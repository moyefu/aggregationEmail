/*
 * 站点 SMTP 发信模块
 *
 * 本模块封装站点级别的 SMTP 发信功能，用于发送系统邮件，如：
 * - 验证码邮件
 * - 密码重置邮件
 * - 其他系统通知邮件
 *
 * 配置通过环境变量设置：
 * - SITE_SMTP_HOST: SMTP 服务器地址
 * - SITE_SMTP_PORT: SMTP 端口（默认 465）
 * - SITE_SMTP_USER: SMTP 用户名
 * - SITE_SMTP_PASSWORD: SMTP 密码
 * - SITE_SMTP_FROM: 发件人地址
 */

import nodemailer, { Transporter, SendMailOptions, SentMessageInfo } from "nodemailer";

/**
 * 站点 SMTP 配置接口
 * 从环境变量读取 SMTP 服务器配置
 */
export interface SiteSmtpConfig {
  /** SMTP 服务器主机地址 */
  host: string;
  /** SMTP 服务器端口 */
  port: number;
  /** SMTP 认证用户名 */
  user: string;
  /** SMTP 认证密码 */
  password: string;
  /** 发件人邮箱地址 */
  from: string;
  /** 是否使用安全连接 */
  secure: boolean;
}

/**
 * 邮件发送选项接口
 */
export interface SiteEmailOptions {
  /** 收件人邮箱地址 */
  to: string;
  /** 邮件主题 */
  subject: string;
  /** HTML 格式的邮件正文 */
  html: string;
  /** 纯文本格式的邮件正文（可选） */
  text?: string;
}

/**
 * 邮件发送结果接口
 */
export interface SiteEmailResult {
  /** 发送是否成功 */
  success: boolean;
  /** 发送成功时返回的消息 ID */
  messageId?: string;
  /** 发送失败时的错误信息 */
  error?: string;
}

let cachedTransporter: Transporter | null = null;
let cachedConfig: SiteSmtpConfig | null = null;

/**
 * 获取站点 SMTP 配置
 *
 * 从环境变量读取 SMTP 配置信息。
 * 如果配置不完整，返回 null。
 *
 * @returns SMTP 配置对象或 null
 */
export function getSiteSmtpConfig(): SiteSmtpConfig | null {
  const host = process.env.SITE_SMTP_HOST;
  const port = parseInt(process.env.SITE_SMTP_PORT || "465", 10);
  const user = process.env.SITE_SMTP_USER;
  const password = process.env.SITE_SMTP_PASSWORD;
  const from = process.env.SITE_SMTP_FROM;

  if (!host || !user || !password || !from) {
    return null;
  }

  return {
    host,
    port,
    user,
    password,
    from,
    secure: port === 465,
  };
}

/**
 * 检查站点 SMTP 是否已配置
 *
 * @returns 如果所有必需的环境变量都已设置，返回 true
 */
export function isSiteSmtpConfigured(): boolean {
  return getSiteSmtpConfig() !== null;
}

/**
 * 创建或获取 SMTP 传输器
 *
 * 使用单例模式缓存传输器实例，避免重复创建连接。
 * 如果配置发生变化，会创建新的传输器。
 *
 * @returns nodemailer Transporter 实例或 null（如果未配置）
 */
export function getSiteTransporter(): Transporter | null {
  const config = getSiteSmtpConfig();

  if (!config) {
    return null;
  }

  if (cachedTransporter && cachedConfig) {
    const configChanged =
      cachedConfig.host !== config.host ||
      cachedConfig.port !== config.port ||
      cachedConfig.user !== config.user ||
      cachedConfig.password !== config.password;

    if (!configChanged) {
      return cachedTransporter;
    }

    cachedTransporter.close();
  }

  cachedTransporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.password,
    },
    connectionTimeout: 30000,
    socketTimeout: 30000,
  });

  cachedConfig = config;

  return cachedTransporter;
}

/**
 * 发送站点邮件
 *
 * 使用站点 SMTP 配置发送邮件。支持发送验证码邮件、密码重置邮件等系统邮件。
 *
 * @param options - 邮件发送选项
 * @param options.to - 收件人邮箱地址
 * @param options.subject - 邮件主题
 * @param options.html - HTML 格式的邮件正文
 * @param options.text - 纯文本格式的邮件正文（可选）
 * @returns 发送结果，包含成功状态、消息 ID 或错误信息
 *
 * @example
 * // 发送验证码邮件
 * const result = await sendEmail({
 *   to: 'user@example.com',
 *   subject: '您的验证码',
 *   html: '<p>您的验证码是：<strong>123456</strong></p>',
 * });
 *
 * if (result.success) {
 *   console.log('邮件发送成功');
 * } else {
 *   console.error('发送失败:', result.error);
 * }
 */
export async function sendEmail(options: SiteEmailOptions): Promise<SiteEmailResult> {
  const config = getSiteSmtpConfig();

  if (!config) {
    return {
      success: false,
      error: "站点 SMTP 未配置，请设置环境变量 SITE_SMTP_HOST、SITE_SMTP_USER、SITE_SMTP_PASSWORD 和 SITE_SMTP_FROM",
    };
  }

  const transporter = getSiteTransporter();

  if (!transporter) {
    return {
      success: false,
      error: "无法创建 SMTP 传输器",
    };
  }

  try {
    const sendOptions: SendMailOptions = {
      from: config.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    const info: SentMessageInfo = await transporter.sendMail(sendOptions);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
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
  }
}

/**
 * 发送验证码邮件
 *
 * 发送包含验证码的邮件，用于用户注册、登录验证等场景。
 *
 * @param to - 收件人邮箱地址
 * @param code - 验证码
 * @param expiresInMinutes - 验证码有效期（分钟），默认 5 分钟
 * @returns 发送结果
 *
 * @example
 * const result = await sendVerificationCode('user@example.com', '123456', 10);
 */
export async function sendVerificationCode(
  to: string,
  code: string,
  expiresInMinutes: number = 5
): Promise<SiteEmailResult> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">验证码通知</h2>
      <p style="font-size: 16px; color: #666;">您好，</p>
      <p style="font-size: 16px; color: #666;">您的验证码是：</p>
      <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
        <span style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 8px;">${code}</span>
      </div>
      <p style="font-size: 14px; color: #999;">验证码将在 ${expiresInMinutes} 分钟后过期，请尽快使用。</p>
      <p style="font-size: 14px; color: #999;">如果您没有请求此验证码，请忽略此邮件。</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="font-size: 12px; color: #999; text-align: center;">此邮件由系统自动发送，请勿回复。</p>
    </div>
  `;

  const text = `您的验证码是：${code}，验证码将在 ${expiresInMinutes} 分钟后过期。`;

  return sendEmail({
    to,
    subject: "验证码通知",
    html,
    text,
  });
}

/**
 * 发送密码重置邮件
 *
 * 发送包含密码重置链接的邮件，用于用户忘记密码时重置密码。
 *
 * @param to - 收件人邮箱地址
 * @param resetLink - 密码重置链接
 * @param expiresInMinutes - 链接有效期（分钟），默认 30 分钟
 * @returns 发送结果
 *
 * @example
 * const result = await sendPasswordResetEmail('user@example.com', 'https://example.com/reset?token=xxx', 30);
 */
export async function sendPasswordResetEmail(
  to: string,
  resetLink: string,
  expiresInMinutes: number = 30
): Promise<SiteEmailResult> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333; border-bottom: 2px solid #dc3545; padding-bottom: 10px;">密码重置请求</h2>
      <p style="font-size: 16px; color: #666;">您好，</p>
      <p style="font-size: 16px; color: #666;">我们收到了重置您账户密码的请求。请点击下方按钮重置密码：</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">重置密码</a>
      </div>
      <p style="font-size: 14px; color: #999;">链接将在 ${expiresInMinutes} 分钟后过期，请尽快使用。</p>
      <p style="font-size: 14px; color: #999;">如果按钮无法点击，请复制以下链接到浏览器：</p>
      <p style="font-size: 12px; color: #666; word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">${resetLink}</p>
      <p style="font-size: 14px; color: #999; margin-top: 20px;">如果您没有请求重置密码，请忽略此邮件，您的密码不会被更改。</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="font-size: 12px; color: #999; text-align: center;">此邮件由系统自动发送，请勿回复。</p>
    </div>
  `;

  const text = `您收到重置密码的请求。请访问以下链接重置密码：${resetLink}，链接将在 ${expiresInMinutes} 分钟后过期。如果您没有请求重置密码，请忽略此邮件。`;

  return sendEmail({
    to,
    subject: "密码重置请求",
    html,
    text,
  });
}

/**
 * 验证站点 SMTP 连接
 *
 * 测试站点 SMTP 配置是否正确，验证能否成功连接和认证。
 *
 * @returns 验证结果，包含成功状态和可选的错误信息
 *
 * @example
 * const result = await verifySiteSmtpConnection();
 * if (result.success) {
 *   console.log('SMTP 配置有效');
 * } else {
 *   console.error('配置无效:', result.error);
 * }
 */
export async function verifySiteSmtpConnection(): Promise<{ success: boolean; error?: string }> {
  const transporter = getSiteTransporter();

  if (!transporter) {
    return {
      success: false,
      error: "站点 SMTP 未配置",
    };
  }

  try {
    await transporter.verify();
    return { success: true };
  } catch (error) {
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
  }
}

/**
 * 关闭 SMTP 传输器连接
 *
 * 手动关闭缓存的传输器连接。通常在应用关闭时调用。
 */
export function closeSiteTransporter(): void {
  if (cachedTransporter) {
    cachedTransporter.close();
    cachedTransporter = null;
    cachedConfig = null;
  }
}