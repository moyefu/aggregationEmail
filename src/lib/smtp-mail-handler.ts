/*
 * SMTP 邮件处理模块
 *
 * 本文件实现了 SMTP 邮件的核心处理逻辑，包括：
 * - 邮箱账户查询功能
 * - API 密钥权限验证
 * - 邮件发送处理
 * - 邮件日志记录
 *
 * 主要处理通过 SMTP 协议接收的邮件，验证权限后转发到实际的邮件服务器
 */

import { SMTPServerSession } from "smtp-server";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
import { sendEmail, EmailOptions, EmailAttachment } from "@/lib/email";
import { getSessionData } from "./smtp-server";
import { SmtpSessionData, SmtpSessionApiKey } from "./smtp-types";

// 重新导出类型，方便其他模块引用
export type { SmtpSessionData, SmtpSessionUser, SmtpSessionApiKey, SmtpSessionEmailAccount } from "./smtp-types";

/**
 * 邮件处理结果
 * 表示邮件发送操作的返回结果
 */
export interface MailProcessResult {
  /** 邮件发送是否成功 */
  success: boolean;
  /** 发送失败时的错误信息 */
  error?: string;
  /** 使用的邮箱账户 ID */
  emailAccountId?: string;
}

/**
 * 根据发件邮箱地址查找用户的邮箱账户
 * 获取邮箱账户的完整 SMTP 配置信息，用于后续邮件发送
 *
 * @param fromEmail - 发件邮箱地址
 * @param userId - 用户 ID
 * @returns 邮箱账户信息（包含 SMTP 配置），如果不存在则返回 null
 */
export async function findEmailAccountByFromEmail(
  fromEmail: string,
  userId: string
): Promise<{ id: string; fromEmail: string; fromName: string | null; smtpHost: string; smtpPort: number; smtpUser: string; smtpPassword: string } | null> {
  const emailAccount = await prisma.emailAccount.findFirst({
    where: {
      fromEmail,
      userId,
    },
    select: {
      id: true,
      fromEmail: true,
      fromName: true,
      smtpHost: true,
      smtpPort: true,
      smtpUser: true,
      smtpPassword: true,
    },
  });

  return emailAccount;
}

/**
 * 检查 API 密钥是否有权限使用指定的邮箱账户
 * 根据 API 密钥的权限范围（scope）验证访问权限
 *
 * @param apiKey - API 密钥信息
 * @param emailAccountId - 要访问的邮箱账户 ID
 * @returns 权限检查结果，包含是否允许和错误信息
 */
export function checkApiKeyPermission(
  apiKey: SmtpSessionApiKey,
  emailAccountId: string
): { allowed: boolean; error?: string } {
  // ALL 范围表示可以访问用户的所有邮箱账户
  if (apiKey.scope === "ALL") {
    return { allowed: true };
  }

  // SPECIFIC 范围需要检查邮箱账户是否在允许列表中
  if (apiKey.scope === "SPECIFIC") {
    // 检查是否配置了允许的邮箱账户列表
    if (!apiKey.allowedEmailAccountIds) {
      return { allowed: false, error: "API 密钥未配置允许的邮箱账户" };
    }

    // 验证邮箱账户 ID 是否在允许列表中
    if (!apiKey.allowedEmailAccountIds.includes(emailAccountId)) {
      return { allowed: false, error: "该 API 密钥无权使用此邮箱账户发送邮件" };
    }

    return { allowed: true };
  }

  // 未知的权限范围，拒绝访问
  return { allowed: false, error: "未知的权限范围" };
}

/**
 * 处理接收到的邮件
 * 验证会话、权限后通过实际的 SMTP 服务器发送邮件，并记录发送日志
 *
 * 处理流程：
 * 1. 从会话中获取认证数据
 * 2. 根据 MAIL FROM 地址查找邮箱账户
 * 3. 验证 API 密钥权限
 * 4. 解密邮箱账户的 SMTP 密码
 * 5. 构建邮件内容并发送
 * 6. 记录邮件发送日志
 *
 * @param email - 邮件内容，包含发件人、收件人、主题、正文、附件等
 * @param session - SMTP 服务器会话对象
 * @param source - 邮件来源，SMTP 或 API
 * @param remoteIp - 客户端 IP 地址，用于日志记录
 * @returns Promise<MailProcessResult> 处理结果
 */
export async function processIncomingMail(
  email: {
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
      filename?: string;
      contentType?: string;
      content: Buffer;
    }>;
  },
  session: SMTPServerSession,
  source: "SMTP" | "API" = "SMTP",
  remoteIp?: string
): Promise<MailProcessResult> {
  // 从会话中获取认证数据
  const sessionData = getSessionData(session);

  // 检查会话是否已认证
  if (!sessionData) {
    return {
      success: false,
      error: "未认证的会话，请先进行身份验证",
    };
  }

  const { user, apiKey } = sessionData;

  // 获取 MAIL FROM 地址
  const mailFrom = session.envelope?.mailFrom;
  if (!mailFrom || typeof mailFrom === "boolean") {
    return {
      success: false,
      error: "缺少 MAIL FROM 地址",
    };
  }

  const fromEmail = mailFrom.address;
  console.log(`[SMTP] 处理邮件: 从 ${fromEmail} 发送到 ${email.to.join(", ")}`);

  // 始终根据 MAIL FROM 地址查找用户绑定的邮箱账户
  // 不再依赖认证时的 sessionEmailAccount，允许用户使用任意已绑定的邮箱发送
  const emailAccount = await findEmailAccountByFromEmail(fromEmail, user.id);

  if (!emailAccount) {
    console.log(`[SMTP] 邮箱账户未找到: ${fromEmail}`);
    return {
      success: false,
      error: `发件人邮箱 ${fromEmail} 未绑定或不存在`,
    };
  }

  console.log(`[SMTP] 找到邮箱账户: ${emailAccount.id}`);

  // 检查 API 密钥是否有权限使用此邮箱账户
  const permissionCheck = checkApiKeyPermission(apiKey, emailAccount.id);

  if (!permissionCheck.allowed) {
    console.log(`[SMTP] 权限检查失败: ${permissionCheck.error}`);
    return {
      success: false,
      error: permissionCheck.error,
      emailAccountId: emailAccount.id,
    };
  }

  console.log(`[SMTP] 权限检查通过`);

  // 解密邮箱账户的 SMTP 密码
  let decryptedPassword: string;
  try {
    decryptedPassword = decrypt(emailAccount.smtpPassword);
  } catch (error) {
    console.error("[SMTP] 密码解密失败:", error);
    return {
      success: false,
      error: "邮箱账户密码解密失败，请重新绑定邮箱",
      emailAccountId: emailAccount.id,
    };
  }

  // 转换附件格式，将 Buffer 转换为 base64 编码
  const emailAttachments: EmailAttachment[] | undefined = email.attachments?.map((att) => ({
    filename: att.filename || "attachment",
    content: att.content.toString("base64"),
    encoding: "base64",
    contentType: att.contentType,
  }));

  // 构建邮件选项
  const emailOptions: EmailOptions = {
    from: emailAccount.fromEmail,
    fromName: emailAccount.fromName || undefined,
    to: email.to,
    subject: email.subject || "(无主题)",
    text: email.text,
    html: email.html,
    cc: email.cc,
    bcc: email.bcc,
    attachments: emailAttachments,
  };

  console.log(`[SMTP] 正在发送邮件...`);

  // 通过实际的 SMTP 服务器发送邮件
  const result = await sendEmail(
    {
      host: emailAccount.smtpHost,
      port: emailAccount.smtpPort,
      user: emailAccount.smtpUser,
      password: decryptedPassword,
    },
    emailOptions
  );

  // 格式化收件人地址用于日志记录
  const toAddress = Array.isArray(email.to) ? email.to.join(", ") : email.to;

  // 获取客户端 IP 地址
  const clientIp = remoteIp || session.remoteAddress || "unknown";

  // 记录邮件发送日志到数据库
  await prisma.emailLog.create({
    data: {
      userId: user.id,
      apiKeyId: apiKey.id,
      emailAccountId: emailAccount.id,
      to: toAddress,
      subject: email.subject || "(无主题)",
      status: result.success ? "SUCCESS" : "FAILED",
      error: result.error || null,
      source,
      remoteIp: clientIp,
    },
  });

  // 返回处理结果
  if (result.success) {
    console.log(`[SMTP] 邮件发送成功, messageId: ${result.messageId}`);
    return {
      success: true,
      emailAccountId: emailAccount.id,
    };
  } else {
    console.log(`[SMTP] 邮件发送失败: ${result.error}`);
    return {
      success: false,
      error: result.error,
      emailAccountId: emailAccount.id,
    };
  }
}
