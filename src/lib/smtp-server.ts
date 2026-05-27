/*
 * SMTP 服务器模块
 *
 * 本文件实现了完整的 SMTP 服务器功能，包括：
 * - SMTP 服务器创建和配置
 * - 客户端连接管理
 * - 用户认证处理（支持 LOGIN 和 PLAIN 方法）
 * - 邮件数据接收和解析
 * - TLS/SSL 安全连接支持
 * - 服务器生命周期管理（启动、停止、状态查询）
 *
 * 该服务器作为邮件中继，接收邮件后转发到实际的邮件服务器
 */

import { SMTPServer, SMTPServerSession, SMTPServerOptions } from "smtp-server";
import { simpleParser } from "mailparser";
import * as fs from "fs";
import * as path from "path";
import { authenticateSmtpUser } from "./smtp-auth";
import { SmtpSessionData } from "./smtp-types";
import { findEmailAccountByFromEmail, checkApiKeyPermission } from "./smtp-mail-handler";

// 使用 WeakMap 存储会话数据，避免内存泄漏
// 当会话对象被垃圾回收时，关联的数据也会自动释放
const sessionDataMap = new WeakMap<SMTPServerSession, SmtpSessionData>();

/**
 * 设置会话数据
 * 将认证后的用户数据存储到会话中
 *
 * @param session - SMTP 服务器会话对象
 * @param data - 要存储的会话数据
 */
export function setSessionData(session: SMTPServerSession, data: SmtpSessionData): void {
  sessionDataMap.set(session, data);
  // 设置 session.user 用于日志和标识
  session.user = data.user.email;
}

/**
 * 获取会话数据
 * 从会话中检索之前存储的认证数据
 *
 * @param session - SMTP 服务器会话对象
 * @returns 会话数据，如果未设置则返回 undefined
 */
export function getSessionData(session: SMTPServerSession): SmtpSessionData | undefined {
  return sessionDataMap.get(session);
}

/**
 * SMTP 服务器配置选项
 * 用于自定义服务器行为
 */
export interface SmtpServerConfig {
  /** 监听端口，默认 2525 */
  port?: number;
  /** 绑定地址，默认 0.0.0.0（所有网卡） */
  host?: string;
  /** 是否启用 TLS 安全连接 */
  secure?: boolean;
  /** TLS 证书配置选项 */
  tlsOptions?: {
    /** 证书文件路径 */
    cert?: string;
    /** 私钥文件路径 */
    key?: string;
    /** CA 证书文件路径 */
    ca?: string;
  };
  /** 是否允许匿名访问（无需认证） */
  authOptional?: boolean;
  /** 最大邮件大小（字节），默认 25MB */
  maxSize?: number;
  /** 是否允许不安全的明文认证（非 TLS 连接） */
  allowInsecureAuth?: boolean;
  /** 是否隐藏 STARTTLS 功能 */
  hideSTARTTLS?: boolean;
}

/**
 * 解析后的邮件数据结构
 * 包含邮件的所有字段信息
 */
export interface ParsedEmail {
  /** 发件人邮箱地址 */
  from: string;
  /** 收件人邮箱地址列表 */
  to: string[];
  /** 抄送邮箱地址列表 */
  cc?: string[];
  /** 密送邮箱地址列表 */
  bcc?: string[];
  /** 邮件主题 */
  subject?: string;
  /** 纯文本正文 */
  text?: string;
  /** HTML 正文 */
  html?: string;
  /** 附件列表 */
  attachments?: Array<{
    /** 附件文件名 */
    filename?: string;
    /** 内容类型（MIME 类型） */
    contentType?: string;
    /** 附件内容（二进制数据） */
    content: Buffer;
  }>;
  /** 邮件头信息 */
  headers: Record<string, string>;
  /** 邮件唯一标识符 */
  messageId?: string;
  /** 邮件日期 */
  date?: Date;
}

/**
 * SMTP 服务器回调函数集合
 * 用于自定义服务器的各种事件处理
 */
export interface SmtpServerCallbacks {
  /**
   * 自定义认证回调
   * @param username - 用户名
   * @param password - 密码
   * @param session - 会话对象
   * @returns 认证结果
   */
  onAuth?: (
    username: string,
    password: string,
    session: SMTPServerSession
  ) => Promise<{ success: boolean; error?: string }>;
  /**
   * 邮件接收回调
   * @param email - 解析后的邮件数据
   * @param session - 会话对象
   */
  onMailReceived?: (email: ParsedEmail, session: SMTPServerSession) => Promise<void>;
  /**
   * 错误处理回调
   * @param error - 错误对象
   * @param session - 相关会话（可选）
   */
  onError?: (error: Error, session?: SMTPServerSession) => void;
  /**
   * 连接验证回调
   * @param session - 会话对象
   * @returns 是否允许连接
   */
  onConnect?: (session: SMTPServerSession) => Promise<boolean>;
}

// 服务器实例，单例模式
let server: SMTPServer | null = null;

/**
 * 加载 TLS 证书文件
 * 从配置的路径读取证书、私钥和 CA 证书
 *
 * @param tlsOptions - TLS 配置选项，包含证书文件路径
 * @returns 证书内容对象，如果加载失败则返回 null
 */
function loadTlsCertificates(tlsOptions?: SmtpServerConfig["tlsOptions"]): {
  cert?: Buffer;
  key?: Buffer;
  ca?: Buffer;
} | null {
  // 必须同时提供证书和私钥
  if (!tlsOptions?.cert || !tlsOptions?.key) {
    return null;
  }

  try {
    // 解析证书文件的绝对路径
    const certPath = path.resolve(tlsOptions.cert);
    const keyPath = path.resolve(tlsOptions.key);

    // 检查证书文件是否存在
    if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
      console.warn("[SMTP] TLS 证书文件不存在");
      return null;
    }

    // 读取证书内容
    const result: { cert: Buffer; key: Buffer; ca?: Buffer } = {
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath),
    };

    // 可选：读取 CA 证书
    if (tlsOptions.ca) {
      const caPath = path.resolve(tlsOptions.ca);
      if (fs.existsSync(caPath)) {
        result.ca = fs.readFileSync(caPath);
      }
    }

    console.log("[SMTP] TLS 证书加载成功");
    return result;
  } catch (error) {
    console.warn("[SMTP] TLS 证书加载失败:", error);
    return null;
  }
}

/**
 * 创建 SMTP 服务器实例
 * 根据配置创建并配置 SMTP 服务器，设置各种事件处理器
 *
 * @param config - 服务器配置选项
 * @param callbacks - 事件回调函数
 * @returns 配置好的 SMTP 服务器实例
 */
export function createSmtpServer(
  config: SmtpServerConfig = {},
  callbacks: SmtpServerCallbacks = {}
): SMTPServer {
  // 解构配置，设置默认值
  const {
    port = parseInt(process.env.SMTP_PORT || "2525", 10),
    host = process.env.SMTP_HOST || "0.0.0.0",
    secure = false,
    tlsOptions,
    authOptional = true,
    maxSize = 25 * 1024 * 1024, // 默认 25MB
    allowInsecureAuth = true,
    hideSTARTTLS = false,
  } = config;

  // 加载 TLS 证书
  const tlsCerts = loadTlsCertificates(tlsOptions);
  const hasTls = tlsCerts !== null;

  // 构建服务器选项
  const serverOptions: SMTPServerOptions = {
    secure,
    size: maxSize,
    authOptional,
    allowInsecureAuth,
    // 如果没有 TLS 证书，隐藏 STARTTLS 功能
    hideSTARTTLS: hideSTARTTLS || !hasTls,
    banner: "ESMTP aggregation-email SMTP Server",
    disableReverseLookup: true,
  };

  // 如果有 TLS 证书，添加到服务器配置
  if (hasTls) {
    serverOptions.cert = tlsCerts.cert;
    serverOptions.key = tlsCerts.key;
    if (tlsCerts.ca) {
      serverOptions.ca = tlsCerts.ca;
    }
  }

  // 创建 SMTP 服务器实例
  const smtpServer = new SMTPServer({
    ...serverOptions,

    // 客户端连接事件处理
    onConnect: (session, callback) => {
      const clientInfo = `${session.remoteAddress}:${session.remotePort}`;
      console.log(`[SMTP] 客户端连接: ${clientInfo}`);
      console.log(`[SMTP] 安全连接: ${session.secure ? "是 (TLS)" : "否"}`);

      // 如果提供了自定义连接验证回调
      if (callbacks.onConnect) {
        callbacks.onConnect(session)
          .then((allow) => {
            if (!allow) {
              console.log(`[SMTP] 拒绝连接: ${clientInfo}`);
              callback(new Error("Connection rejected"));
              return;
            }
            callback();
          })
          .catch((error) => {
            console.error("[SMTP] onConnect 回调错误:", error);
            callback(error instanceof Error ? error : new Error("Connection error"));
          });
        return;
      }

      callback();
    },

    // MAIL FROM 命令处理 - 验证发件人邮箱是否属于用户且有权限
    onMailFrom: (from, session, callback) => {
      console.log(`[SMTP] MAIL FROM: ${from.address}`);
      
      (async () => {
        const sessionData = getSessionData(session);
        
        if (!sessionData) {
          console.log(`[SMTP] MAIL FROM 失败: 未认证的会话`);
          callback(new Error("未认证的会话，请先进行身份验证"));
          return;
        }
        
        const { user, apiKey } = sessionData;
        const fromEmail = from.address;
        
        if (!fromEmail) {
          console.log(`[SMTP] MAIL FROM 失败: 缺少发件人地址`);
          callback(new Error("缺少发件人邮箱地址"));
          return;
        }
        
        const emailAccount = await findEmailAccountByFromEmail(fromEmail, user.id);
        
        if (!emailAccount) {
          console.log(`[SMTP] MAIL FROM 失败: 邮箱 ${fromEmail} 未绑定`);
          callback(new Error(`发件人邮箱 ${fromEmail} 未绑定或不存在`));
          return;
        }
        
        const permissionCheck = checkApiKeyPermission(apiKey, emailAccount.id);
        
        if (!permissionCheck.allowed) {
          console.log(`[SMTP] MAIL FROM 失败: ${permissionCheck.error}`);
          callback(new Error(permissionCheck.error || "无权限使用此邮箱"));
          return;
        }
        
        console.log(`[SMTP] MAIL FROM 验证通过: ${fromEmail}`);
        callback();
      })().catch((error) => {
        console.error("[SMTP] MAIL FROM 处理错误:", error);
        callback(error instanceof Error ? error : new Error("MAIL FROM 处理错误"));
      });
    },

    // RCPT TO 命令处理
    onRcptTo: (to, session, callback) => {
      console.log(`[SMTP] RCPT TO: ${to.address}`);
      callback();
    },

    // 认证处理（仅在 authOptional 为 false 时启用）
    onAuth: authOptional
      ? undefined
      : (auth, session, callback) => {
          const remoteIp = session.remoteAddress || "unknown";
          const authMethod = auth.method || "UNKNOWN";
          
          console.log(`[SMTP] 收到认证请求: 方法=${authMethod}, 用户=${auth.username || "(空)"}, IP=${remoteIp}`);

          let username = "";
          let password = "";

          if (auth.method === "LOGIN") {
            if (auth.username !== undefined) {
              username = auth.username;
            }
            if (auth.password !== undefined) {
              password = auth.password;
            }
          } else if (auth.method === "PLAIN") {
            username = auth.username || "";
            password = auth.password || "";
          } else {
            console.log(`[SMTP] 不支持的认证方法: ${auth.method}`);
            callback(new Error("Unsupported authentication method"));
            return;
          }

          authenticateSmtpUser(username, password, remoteIp)
            .then((authResult) => {
              if (authResult.success) {
                console.log(`[SMTP] 认证成功: 用户=${authResult.user?.email}, API密钥=${authResult.apiKey?.name}`);
                
                if (authResult.user && authResult.apiKey) {
                  const sessionData: SmtpSessionData = {
                    user: authResult.user,
                    apiKey: authResult.apiKey,
                  };
                  setSessionData(session, sessionData);
                }
                
                callback(null, { user: authResult.user?.email || username });
              } else {
                console.log(`[SMTP] 认证失败: ${authResult.error}`);
                callback(new Error(authResult.error || "认证失败"));
              }
            })
            .catch((error) => {
              console.error("[SMTP] 认证错误:", error);
              callback(error instanceof Error ? error : new Error("认证错误"));
            });
        },

    // 邮件数据接收处理
    onData: (stream, session, callback) => {
      console.log(`[SMTP] 接收邮件数据... (安全: ${session.secure ? "TLS" : "明文"})`);

      // 收集数据块
      const chunks: Buffer[] = [];

      // 接收数据流
      stream.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });

      // 数据接收完成
      stream.on("end", () => {
        (async () => {
          try {
            // 合并所有数据块并解析邮件
            const rawEmail = Buffer.concat(chunks).toString("utf-8");
            const parsed = await simpleParser(rawEmail);

            // 获取信封信息
            const envelopeFrom = session.envelope?.mailFrom;
            const envelopeTo = session.envelope?.rcptTo;

            // 解析收件人地址
            const toAddresses: string[] = [];
            if (parsed.to) {
              const toList = Array.isArray(parsed.to) ? parsed.to : [parsed.to];
              for (const addr of toList) {
                if (addr.value) {
                  for (const v of addr.value) {
                    if (v.address) toAddresses.push(v.address);
                  }
                }
              }
            }
            // 如果邮件内容中没有收件人，使用信封中的收件人
            if (toAddresses.length === 0 && envelopeTo) {
              for (const addr of envelopeTo) {
                if (addr.address) toAddresses.push(addr.address);
              }
            }

            // 解析抄送地址
            const ccAddresses: string[] | undefined = parsed.cc ? [] : undefined;
            if (parsed.cc && ccAddresses) {
              const ccList = Array.isArray(parsed.cc) ? parsed.cc : [parsed.cc];
              for (const addr of ccList) {
                if (addr.value) {
                  for (const v of addr.value) {
                    if (v.address) ccAddresses.push(v.address);
                  }
                }
              }
            }

            // 解析密送地址
            const bccAddresses: string[] | undefined = parsed.bcc ? [] : undefined;
            if (parsed.bcc && bccAddresses) {
              const bccList = Array.isArray(parsed.bcc) ? parsed.bcc : [parsed.bcc];
              for (const addr of bccList) {
                if (addr.value) {
                  for (const v of addr.value) {
                    if (v.address) bccAddresses.push(v.address);
                  }
                }
              }
            }

            // 确定发件人地址
            let fromAddress = parsed.from?.text || "";
            // 如果邮件内容中没有发件人，使用信封中的发件人
            if (!fromAddress && envelopeFrom && typeof envelopeFrom !== "boolean") {
              fromAddress = envelopeFrom.address;
            }

            // 构建解析后的邮件对象
            const email: ParsedEmail = {
              from: fromAddress,
              to: toAddresses,
              cc: ccAddresses?.length ? ccAddresses : undefined,
              bcc: bccAddresses?.length ? bccAddresses : undefined,
              subject: parsed.subject || undefined,
              text: parsed.text || undefined,
              html: parsed.html || undefined,
              attachments: parsed.attachments?.map((att) => ({
                filename: att.filename,
                contentType: att.contentType,
                content: att.content,
              })),
              headers: {},
              messageId: parsed.messageId,
              date: parsed.date,
            };

            // 提取邮件头信息
            if (parsed.headers) {
              for (const [key, value] of parsed.headers) {
                email.headers[key] = String(value);
              }
            }

            console.log(`[SMTP] 邮件解析成功:`);
            console.log(`  发件人: ${email.from}`);
            console.log(`  收件人: ${email.to.join(", ")}`);
            console.log(`  主题: ${email.subject || "(无主题)"}`);

            // 调用邮件接收回调，如果回调抛出错误则返回给 SMTP 客户端
            if (callbacks.onMailReceived) {
              try {
                await callbacks.onMailReceived(email, session);
              } catch (mailError) {
                // 邮件处理失败，将错误传递给 callback，SMTP 客户端会收到错误
                console.error("[SMTP] 邮件处理失败:", mailError);
                // 保留原始错误的消息和 responseCode
                const err = mailError instanceof Error ? mailError : new Error("邮件处理失败");
                // 确保设置 550 响应码（永久失败）
                if (!(err as any).responseCode) {
                  (err as any).responseCode = 550;
                }
                if (callbacks.onError) {
                  callbacks.onError(err, session);
                }
                callback(err);
                return;
              }
            }

            callback();
          } catch (error) {
            console.error("[SMTP] 邮件解析失败:", error);
            const err = error instanceof Error ? error : new Error("邮件解析失败");
            if (callbacks.onError) {
              callbacks.onError(err, session);
            }
            callback(err);
          }
        })().catch((error) => {
          console.error("[SMTP] 处理错误:", error);
          callback(error instanceof Error ? error : new Error("处理错误"));
        });
      });

      // 数据流错误处理
      stream.on("error", (error) => {
        console.error("[SMTP] 数据流错误:", error);
        if (callbacks.onError) {
          callbacks.onError(error, session);
        }
        callback(error);
      });
    },

    // 连接关闭事件
    onClose: (session) => {
      console.log(`[SMTP] 连接关闭: ${session.remoteAddress}`);
    },
  });

  // 服务器级别错误处理
  smtpServer.on("error", (error: Error) => {
    console.error("[SMTP] 服务器错误:", error);
    if (callbacks.onError) {
      callbacks.onError(error);
    }
  });

  return smtpServer;
}

/**
 * 启动 SMTP 服务器
 * 创建并启动 SMTP 服务器实例，开始监听指定端口
 *
 * @param config - 服务器配置选项
 * @param callbacks - 事件回调函数
 * @returns Promise<SMTPServer> 启动成功后返回服务器实例
 * @throws 如果服务器已在运行或启动失败
 */
export function startSmtpServer(
  config: SmtpServerConfig = {},
  callbacks: SmtpServerCallbacks = {}
): Promise<SMTPServer> {
  return new Promise((resolve, reject) => {
    // 检查是否已有服务器在运行
    if (server) {
      reject(new Error("SMTP 服务器已在运行"));
      return;
    }

    // 创建服务器实例
    server = createSmtpServer(config, callbacks);

    // 获取监听配置
    const port = config.port || parseInt(process.env.SMTP_PORT || "2525", 10);
    const host = config.host || process.env.SMTP_HOST || "0.0.0.0";

    // 开始监听
    server.listen(port, host, () => {
      console.log(`[SMTP] 服务器启动成功: ${host}:${port}`);
      resolve(server!);
    });

    // 监听启动错误
    server.on("error", (error: Error) => {
      console.error("[SMTP] 启动失败:", error);
      server = null;
      reject(error);
    });
  });
}

/**
 * 停止 SMTP 服务器
 * 关闭当前运行的服务器实例
 *
 * @returns Promise<void> 服务器关闭后 resolve
 * @throws 如果关闭过程中发生错误
 */
export function stopSmtpServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    // 如果没有运行中的服务器，直接返回
    if (!server) {
      resolve();
      return;
    }

    // 保存当前服务器引用并清空全局变量
    const currentServer = server;
    server = null;
    
    // 关闭服务器
    currentServer.close(() => {
      console.log("[SMTP] 服务器已关闭");
      resolve();
    });
    
    // 监听关闭错误
    currentServer.on("error", (error: Error) => {
      console.error("[SMTP] 关闭失败:", error);
      reject(error);
    });
  });
}

/**
 * 获取当前 SMTP 服务器实例
 *
 * @returns 服务器实例，如果未启动则返回 null
 */
export function getSmtpServer(): SMTPServer | null {
  return server;
}

/**
 * 检查 SMTP 服务器是否正在运行
 *
 * @returns 如果服务器正在运行返回 true，否则返回 false
 */
export function isSmtpServerRunning(): boolean {
  return server !== null;
}
