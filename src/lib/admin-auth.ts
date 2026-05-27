/*
 * 管理员认证工具模块
 *
 * 本模块提供管理员身份验证和 JWT 令牌管理功能，包括：
 * - 管理员账号密码验证
 * - JWT 令牌生成
 * - JWT 令牌验证
 *
 * 安全说明：
 * - 生产环境请务必修改默认的管理员账号密码
 * - JWT 密钥应通过环境变量配置，不要使用默认值
 * - 令牌有效期为 24 小时
 *
 * 使用方式：
 * 1. 调用 verifyAdminCredentials() 验证登录凭证
 * 2. 验证通过后调用 generateAdminToken() 生成令牌
 * 3. 后续请求使用 verifyAdminToken() 验证令牌有效性
 */

import jwt from "jsonwebtoken";

// JWT 密钥，从环境变量获取，生产环境必须修改
const JWT_SECRET_ADMIN = process.env.JWT_SECRET_ADMIN || process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
// 管理员用户名，从环境变量获取
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
// 管理员密码，从环境变量获取，生产环境必须修改
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
// 令牌有效期：24小时
const ADMIN_TOKEN_EXPIRES_IN = "24h";

/**
 * 管理员 JWT 载荷接口
 * 定义 JWT 令牌中包含的数据结构
 */
export interface AdminJwtPayload {
  /** 管理员身份标识，固定为 true */
  isAdmin: boolean;
  /** 令牌签发时间（Unix 时间戳），由 jwt.sign 自动添加 */
  iat?: number;
  /** 令牌过期时间（Unix 时间戳），由 jwt.sign 自动添加 */
  exp?: number;
}

/**
 * 验证管理员登录凭证
 *
 * 检查提供的用户名和密码是否与管理员账号匹配。
 * 用户名和密码通过环境变量 ADMIN_USERNAME 和 ADMIN_PASSWORD 配置。
 *
 * @param username - 待验证的用户名
 * @param password - 待验证的密码
 * @returns 凭证是否有效，true 表示验证通过
 *
 * @example
 * // 验证登录凭证
 * if (verifyAdminCredentials('admin', 'mypassword')) {
 *   const token = generateAdminToken();
 *   // 返回令牌给客户端
 * } else {
 *   // 返回认证失败错误
 * }
 */
export function verifyAdminCredentials(username: string, password: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

/**
 * 生成管理员 JWT 令牌
 *
 * 创建一个包含管理员身份标识的 JWT 令牌。
 * 令牌有效期为 24 小时，用于后续 API 请求的身份验证。
 *
 * @returns 签名后的 JWT 令牌字符串
 *
 * @example
 * // 登录成功后生成令牌
 * const token = generateAdminToken();
 * // 返回给客户端
 * res.json({ success: true, token });
 */
export function generateAdminToken(): string {
  // 构建载荷，标记为管理员身份
  const payload: AdminJwtPayload = {
    isAdmin: true,
  };

  // 使用密钥签名，设置过期时间
  return jwt.sign(payload, JWT_SECRET_ADMIN, { expiresIn: ADMIN_TOKEN_EXPIRES_IN });
}

/**
 * 验证管理员 JWT 令牌
 *
 * 验证 JWT 令牌的有效性，包括签名验证、过期检查和管理员身份确认。
 * 用于保护需要管理员权限的 API 端点。
 *
 * @param token - 待验证的 JWT 令牌字符串
 * @returns 验证成功返回载荷对象，验证失败返回 null
 *
 * @example
 * // 在中间件中验证令牌
 * const authHeader = req.headers.authorization;
 * const token = authHeader?.replace('Bearer ', '');
 *
 * const payload = verifyAdminToken(token);
 * if (!payload) {
 *   return res.status(401).json({ error: '未授权访问' });
 * }
 *
 * // 令牌有效，继续处理请求
 * next();
 */
export function verifyAdminToken(token: string): AdminJwtPayload | null {
  try {
    // 验证令牌签名和有效期
    const decoded = jwt.verify(token, JWT_SECRET_ADMIN) as AdminJwtPayload;
    
    // 确保令牌包含管理员标识
    if (!decoded.isAdmin) {
      return null;
    }
    
    return decoded;
  } catch (error) {
    // 令牌无效（过期、签名错误、格式错误等）
    console.error("Admin token 验证失败:", error);
    return null;
  }
}
