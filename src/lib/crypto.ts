/*
 * 加密工具模块
 *
 * 本模块提供基于 AES-256-CBC 算法的对称加密和解密功能，
 * 用于敏感数据（如 SMTP 密码）的安全存储。
 *
 * 安全说明：
 * - 使用 AES-256-CBC 对称加密算法
 * - 每次加密生成随机 IV（初始化向量），确保相同明文产生不同密文
 * - 加密密钥通过 scrypt 从环境变量派生，增强安全性
 *
 * 使用方式：
 * 1. 设置环境变量 ENCRYPTION_KEY（32字符）
 * 2. 调用 encrypt() 加密敏感数据
 * 3. 调用 decrypt() 解密数据
 */

import crypto from "crypto";

// 加密密钥，从环境变量获取，应设置为32字符的随机字符串
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "your-32-character-encryption-k";
// 加密算法：AES-256-CBC（高级加密标准，256位密钥，CBC模式）
const ALGORITHM = "aes-256-cbc";

// 检查密钥长度，AES-256 需要 32 字节的密钥
if (ENCRYPTION_KEY.length !== 32) {
  console.warn("ENCRYPTION_KEY should be 32 characters long for AES-256 encryption");
}

/**
 * 加密文本
 *
 * 使用 AES-256-CBC 算法加密明文字符串。
 * 每次加密都会生成随机的初始化向量（IV），
 * 确保相同明文每次加密产生不同的密文。
 *
 * @param text - 待加密的明文字符串
 * @returns 加密后的字符串，格式为 "IV:密文"（均为十六进制编码）
 *
 * @example
 * const encrypted = encrypt('my-password');
 * // 返回类似: "a1b2c3d4e5f6...:987654321abc..."
 *
 * // 存储加密后的字符串到数据库
 * await saveToDatabase({ password: encrypted });
 */
export function encrypt(text: string): string {
  // 生成16字节的随机初始化向量（IV）
  const iv = crypto.randomBytes(16);
  // 使用 scrypt 从密钥派生32字节的加密密钥
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  // 创建加密器实例
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  // 执行加密：将 UTF-8 明文转换为十六进制密文
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  // 返回格式：IV（十六进制）: 密文（十六进制）
  // IV 需要保存以便解密时使用
  return iv.toString("hex") + ":" + encrypted;
}

/**
 * 解密文本
 *
 * 将 encrypt() 加密的字符串解密还原为明文。
 * 需要使用相同的加密密钥（环境变量 ENCRYPTION_KEY）。
 *
 * @param encryptedData - 加密后的字符串，格式为 "IV:密文"
 * @returns 解密后的明文字符串
 * @throws 当加密数据格式无效时抛出错误
 *
 * @example
 * const encrypted = encrypt('my-password');
 * const decrypted = decrypt(encrypted);
 * console.log(decrypted); // 输出: 'my-password'
 *
 * @example
 * // 从数据库读取并解密
 * const stored = await getFromDatabase();
 * const password = decrypt(stored.encryptedPassword);
 */
export function decrypt(encryptedData: string): string {
  // 解析加密数据，分离 IV 和密文
  const parts = encryptedData.split(":");
  if (parts.length !== 2) {
    throw new Error("Invalid encrypted data format");
  }
  
  // 将十六进制 IV 转换为 Buffer
  const iv = Buffer.from(parts[0], "hex");
  // 获取十六进制密文
  const encrypted = parts[1];
  // 使用相同的密钥派生方式生成解密密钥
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  // 创建解密器实例
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  
  // 执行解密：将十六进制密文转换为 UTF-8 明文
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}
