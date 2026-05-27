/*
 * SMTP 会话类型定义
 *
 * 本文件定义了 SMTP 服务器会话中使用的核心数据类型，
 * 包括用户信息、API 密钥信息、邮箱账户信息以及完整的会话数据结构。
 * 这些类型用于在 SMTP 认证和邮件处理过程中传递和验证用户身份。
 */

/**
 * SMTP 会话用户信息
 * 表示通过 SMTP 认证的用户基本信息
 */
export interface SmtpSessionUser {
  /** 用户唯一标识符 */
  id: string;
  /** 用户邮箱地址 */
  email: string;
  /** 用户显示名称，可为空 */
  name: string | null;
}

/**
 * SMTP 会话 API 密钥信息
 * 表示用于 SMTP 认证的 API 密钥及其权限配置
 */
export interface SmtpSessionApiKey {
  /** API 密钥唯一标识符 */
  id: string;
  /** 关联的用户 ID */
  userId: string;
  /** API 密钥名称，用于识别密钥用途 */
  name: string;
  /** 权限范围：ALL 表示所有邮箱账户，SPECIFIC 表示特定邮箱账户 */
  scope: string;
  /** 允许访问的邮箱账户 ID 列表，当 scope 为 SPECIFIC 时使用 */
  allowedEmailAccountIds: string[] | null;
}

/**
 * SMTP 会话邮箱账户信息
 * 表示用户绑定的发件邮箱账户基本信息
 */
export interface SmtpSessionEmailAccount {
  /** 邮箱账户唯一标识符 */
  id: string;
  /** 发件邮箱地址 */
  fromEmail: string;
}

/**
 * SMTP 会话完整数据
 * 包含认证后的用户、API 密钥和邮箱账户信息
 * 在 SMTP 认证成功后存储在会话中，供后续邮件处理使用
 */
export interface SmtpSessionData {
  /** 认证通过的用户信息 */
  user: SmtpSessionUser;
  /** 认证使用的 API 密钥信息 */
  apiKey: SmtpSessionApiKey;
  /** 当前使用的邮箱账户，认证时可选绑定 */
  emailAccount?: SmtpSessionEmailAccount;
}
