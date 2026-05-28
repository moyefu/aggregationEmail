/*
 * 邮件发送工具模块
 *
 * 本模块封装了基于 nodemailer 的邮件发送功能，提供：
 * - SMTP 连接配置和传输器创建
 * - 邮件发送（支持文本、HTML、附件、抄送、密送）
 * - SMTP 连接验证
 *
 * 使用方式：
 * 1. 创建 SmtpConfig 配置对象
 * 2. 调用 sendEmail() 发送邮件
 * 3. 或调用 verifySmtpConnection() 验证连接
 */

import nodemailer, { Transporter, SendMailOptions, SentMessageInfo } from "nodemailer";
import { createProxyAgent, ProxyConfig } from "@/lib/proxy";

/**
 * SMTP 服务器配置接口
 * 用于定义连接 SMTP 服务器所需的基本参数
 */
export interface SmtpConfig {
  /** SMTP 服务器主机地址，如 smtp.qq.com、smtp.163.com */
  host: string;
  /** SMTP 服务器端口，常用端口：25（非加密）、465（SSL）、587（TLS） */
  port: number;
  /** SMTP 认证用户名，通常为邮箱地址 */
  user: string;
  /** SMTP 认证密码，部分邮箱需要使用授权码 */
  password: string;
  /** 是否使用安全连接（SSL/TLS），默认端口 465 时为 true */
  secure?: boolean;
  /** 代理配置，可选 */
  proxy?: ProxyConfig;
}

/**
 * 邮件发送选项接口
 * 定义发送邮件时的各项参数，包括收件人、主题、内容等
 */
export interface EmailOptions {
  /** 发件人邮箱地址 */
  from: string;
  /** 发件人显示名称，可选 */
  fromName?: string;
  /** 收件人邮箱地址，支持单个地址或地址数组 */
  to: string | string[];
  /** 邮件主题 */
  subject: string;
  /** 纯文本格式的邮件正文，可选 */
  text?: string;
  /** HTML 格式的邮件正文，可选 */
  html?: string;
  /** 抄送收件人，支持单个地址或地址数组，可选 */
  cc?: string | string[];
  /** 密送收件人，支持单个地址或地址数组，可选 */
  bcc?: string | string[];
  /** 邮件附件列表，可选 */
  attachments?: EmailAttachment[];
}

/**
 * 邮件附件接口
 * 定义邮件附件的属性
 */
export interface EmailAttachment {
  /** 附件文件名 */
  filename: string;
  /** 附件内容，通常为 Base64 编码的字符串 */
  content: string;
  /** 内容编码方式，默认为 base64 */
  encoding?: string;
  /** 附件的 MIME 类型，如 image/png、application/pdf */
  contentType?: string;
}

/**
 * 邮件发送结果接口
 * 返回邮件发送的成功状态和相关信息
 */
export interface SendEmailResult {
  /** 发送是否成功 */
  success: boolean;
  /** 发送成功时返回的消息 ID，可用于追踪邮件 */
  messageId?: string;
  /** 发送失败时的错误信息 */
  error?: string;
}

/**
 * 传输器信息接口
 * 包含 nodemailer 传输器实例及其配置
 */
export interface TransporterInfo {
  /** nodemailer 传输器实例 */
  transporter: Transporter;
  /** 对应的 SMTP 配置 */
  config: SmtpConfig;
}

/**
 * 创建 SMTP 邮件传输器
 *
 * 根据提供的 SMTP 配置创建 nodemailer 传输器实例。
 * 传输器用于实际发送邮件。
 *
 * @param config - SMTP 服务器配置对象
 * @returns nodemailer Transporter 实例
 *
 * @example
 * const transporter = createTransporter({
 *   host: 'smtp.qq.com',
 *   port: 465,
 *   user: 'example@qq.com',
 *   password: 'authorization-code'
 * });
 */
export function createTransporter(config: SmtpConfig): Transporter {
  const transporterOptions: any = {
    host: config.host,
    port: config.port,
    secure: config.secure ?? config.port === 465,
    auth: {
      user: config.user,
      pass: config.password,
    },
    connectionTimeout: 30000,
    socketTimeout: 30000,
  };

  if (config.proxy) {
    const proxyAgent = createProxyAgent(config.proxy);
    transporterOptions.proxy = `${config.proxy.protocol.toLowerCase()}://${config.proxy.host}:${config.proxy.port}`;
    if (config.proxy.username && config.proxy.password) {
      transporterOptions.proxy = `${config.proxy.protocol.toLowerCase()}://${config.proxy.username}:${config.proxy.password}@${config.proxy.host}:${config.proxy.port}`;
    }
  }

  return nodemailer.createTransport(transporterOptions);
}

/**
 * 发送邮件
 *
 * 使用指定的 SMTP 配置发送邮件。支持多种邮件格式和选项，
 * 包括 HTML 正文、附件、抄送和密送。
 *
 * @param smtpConfig - SMTP 服务器配置
 * @param mailOptions - 邮件发送选项
 * @returns 发送结果，包含成功状态、消息 ID 或错误信息
 *
 * @example
 * const result = await sendEmail(
 *   { host: 'smtp.qq.com', port: 465, user: 'from@qq.com', password: 'xxx' },
 *   { from: 'from@qq.com', to: 'to@example.com', subject: '测试', text: '内容' }
 * );
 *
 * if (result.success) {
 *   console.log('发送成功，消息ID:', result.messageId);
 * } else {
 *   console.error('发送失败:', result.error);
 * }
 */
export async function sendEmail(
  smtpConfig: SmtpConfig,
  mailOptions: EmailOptions
): Promise<SendEmailResult> {
  const transporter = createTransporter(smtpConfig);

  try {
    // 构建发件人地址，支持显示名称
    const fromAddress = mailOptions.fromName
      ? `${mailOptions.fromName} <${mailOptions.from}>`
      : mailOptions.from;

    // 构建 nodemailer 发送选项
    const sendOptions: SendMailOptions = {
      from: fromAddress,
      // 收件人数组转为逗号分隔字符串
      to: Array.isArray(mailOptions.to) ? mailOptions.to.join(", ") : mailOptions.to,
      subject: mailOptions.subject,
      text: mailOptions.text,
      html: mailOptions.html,
      // 抄送人数组转为逗号分隔字符串
      cc: mailOptions.cc
        ? Array.isArray(mailOptions.cc)
          ? mailOptions.cc.join(", ")
          : mailOptions.cc
        : undefined,
      // 密送人数组转为逗号分隔字符串
      bcc: mailOptions.bcc
        ? Array.isArray(mailOptions.bcc)
          ? mailOptions.bcc.join(", ")
          : mailOptions.bcc
        : undefined,
      // 处理附件，默认使用 base64 编码
      attachments: mailOptions.attachments?.map((att) => ({
        filename: att.filename,
        content: att.content,
        encoding: att.encoding || "base64",
        contentType: att.contentType,
      })),
    };

    // 执行邮件发送
    const info: SentMessageInfo = await transporter.sendMail(sendOptions);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    // 错误处理：将常见错误转换为友好的中文提示
    let errorMessage = "邮件发送失败";

    if (error instanceof Error) {
      if (error.message.includes("Invalid login")) {
        errorMessage = "SMTP 认证失败，请检查用户名和密码";
      } else if (error.message.includes("ECONNREFUSED")) {
        errorMessage = "无法连接到 SMTP 服务器";
      } else if (error.message.includes("ETIMEDOUT") || error.message.includes("timeout")) {
        errorMessage = "连接超时";
      } else if (error.message.includes("self signed certificate")) {
        errorMessage = "SSL 证书验证失败";
      } else {
        errorMessage = error.message;
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  } finally {
    // 确保关闭传输器连接
    transporter.close();
  }
}

/**
 * 验证 SMTP 连接
 *
 * 测试 SMTP 服务器配置是否正确，验证能否成功连接和认证。
 * 通常在保存配置前调用此函数进行验证。
 *
 * @param config - SMTP 服务器配置
 * @returns 验证结果，包含成功状态和可选的错误信息
 *
 * @example
 * const result = await verifySmtpConnection({
 *   host: 'smtp.qq.com',
 *   port: 465,
 *   user: 'example@qq.com',
 *   password: 'authorization-code'
 * });
 *
 * if (result.success) {
 *   console.log('SMTP 配置有效');
 * } else {
 *   console.error('配置无效:', result.error);
 * }
 */
export async function verifySmtpConnection(config: SmtpConfig): Promise<{ success: boolean; error?: string }> {
  const transporter = createTransporter(config);

  try {
    // 使用 nodemailer 的 verify 方法验证连接
    await transporter.verify();
    return { success: true };
  } catch (error) {
    // 错误处理：将常见错误转换为友好的中文提示
    let errorMessage = "SMTP 连接验证失败";

    if (error instanceof Error) {
      if (error.message.includes("Invalid login")) {
        errorMessage = "SMTP 认证失败，请检查用户名和密码";
      } else if (error.message.includes("ECONNREFUSED")) {
        errorMessage = "无法连接到 SMTP 服务器，请检查主机地址和端口";
      } else if (error.message.includes("ETIMEDOUT") || error.message.includes("timeout")) {
        errorMessage = "连接超时，请检查网络或服务器地址";
      } else if (error.message.includes("self signed certificate")) {
        errorMessage = "SSL 证书验证失败";
      } else {
        errorMessage = error.message;
      }
    }

    return { success: false, error: errorMessage };
  } finally {
    // 确保关闭传输器连接
    transporter.close();
  }
}
