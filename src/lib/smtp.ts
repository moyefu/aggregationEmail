/**
 * SMTP 工具函数模块
 * 
 * 提供 SMTP 连接验证和邮箱格式验证功能。
 * 
 * @module lib/smtp
 */

import { verifySmtpConnection as verifySmtp, SmtpConfig } from "@/lib/email";

/**
 * SMTP 连接验证结果
 */
export interface SmtpVerifyResult {
  /** 验证是否成功 */
  success: boolean;
  /** 错误信息（验证失败时） */
  error?: string;
}

/**
 * 验证 SMTP 服务器连接
 * 
 * 测试给定的 SMTP 配置是否能够成功连接到服务器。
 * 用于在添加邮箱账户时验证 SMTP 配置的正确性。
 * 
 * @param config - SMTP 配置对象
 * @param config.host - SMTP 服务器地址
 * @param config.port - SMTP 服务器端口
 * @param config.user - SMTP 用户名
 * @param config.password - SMTP 密码
 * @param config.secure - 是否使用安全连接
 * @returns 验证结果对象
 * 
 * @example
 * ```typescript
 * const result = await verifySmtpConnection({
 *   host: 'smtp.example.com',
 *   port: 587,
 *   user: 'user@example.com',
 *   password: 'password',
 *   secure: false
 * });
 * 
 * if (result.success) {
 *   console.log('SMTP 连接成功');
 * } else {
 *   console.error('SMTP 连接失败:', result.error);
 * }
 * ```
 */
export async function verifySmtpConnection(config: SmtpConfig): Promise<SmtpVerifyResult> {
  return verifySmtp(config);
}

/**
 * 验证邮箱地址格式
 * 
 * 使用正则表达式验证邮箱地址的格式是否正确。
 * 注意：此函数只验证格式，不验证邮箱是否真实存在。
 * 
 * @param email - 要验证的邮箱地址
 * @returns 邮箱格式是否有效
 * 
 * @example
 * ```typescript
 * isValidEmail('user@example.com'); // true
 * isValidEmail('invalid-email');    // false
 * isValidEmail('user@.com');        // false
 * ```
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
