/*
 * SMTP 认证模块
 *
 * 本文件实现了 SMTP 服务器的用户认证功能，包括：
 * - 基于 API 密钥的用户认证逻辑
 * - 认证结果的类型定义
 * - 认证日志记录功能
 *
 * 认证流程：用户名使用邮箱地址，密码使用 API 密钥
 */

import { prisma } from "@/lib/prisma";

/**
 * SMTP 认证结果
 * 表示认证操作的返回结果，包含成功状态、错误信息和用户数据
 */
export interface SmtpAuthResult {
  /** 认证是否成功 */
  success: boolean;
  /** 认证失败时的错误信息 */
  error?: string;
  /** 认证成功时返回的用户信息 */
  user?: {
    /** 用户唯一标识符 */
    id: string;
    /** 用户邮箱地址 */
    email: string;
    /** 用户显示名称 */
    name: string | null;
  };
  /** 认证成功时返回的 API 密钥信息 */
  apiKey?: {
    /** API 密钥唯一标识符 */
    id: string;
    /** 关联的用户 ID */
    userId: string;
    /** API 密钥名称 */
    name: string;
    /** 权限范围 */
    scope: string;
    /** 允许访问的邮箱账户 ID 列表 */
    allowedEmailAccountIds: string[] | null;
  };
}

/**
 * SMTP 认证日志数据
 * 用于记录每次认证尝试的详细信息
 */
export interface SmtpAuthLogData {
  /** 使用的 API 密钥 ID */
  apiKeyId?: string;
  /** 用户 ID */
  userId?: string;
  /** 认证时使用的用户名（邮箱地址） */
  username: string;
  /** 认证是否成功 */
  success: boolean;
  /** 认证失败时的错误信息 */
  error?: string;
  /** 客户端 IP 地址 */
  remoteIp: string;
}

/**
 * 记录 SMTP 认证日志
 * 将认证尝试记录到数据库，用于审计和安全分析
 *
 * @param data - 认证日志数据，包含用户名、结果、IP 等信息
 * @returns Promise<void>，日志记录失败时仅打印错误，不抛出异常
 */
export async function logSmtpAuth(data: SmtpAuthLogData): Promise<void> {
  try {
    await prisma.smtpAuthLog.create({
      data: {
        apiKeyId: data.apiKeyId,
        userId: data.userId,
        username: data.username,
        success: data.success,
        error: data.error,
        remoteIp: data.remoteIp,
      },
    });
  } catch (error) {
    console.error("[SMTP Auth] 记录认证日志失败:", error);
  }
}

/**
 * 认证 SMTP 用户
 * 使用邮箱地址作为用户名、API 密钥作为密码进行身份验证
 *
 * 认证流程：
 * 1. 验证用户名（邮箱）和密码（API 密钥）格式
 * 2. 查询数据库验证 API 密钥有效性
 * 3. 更新 API 密钥的最后使用时间
 * 4. 记录认证日志并返回结果
 *
 * 注意：邮箱账户的权限验证在 MAIL FROM 阶段进行，不在认证阶段验证
 *
 * @param username - 用户名，应为用户的邮箱地址
 * @param password - 密码，应为有效的 API 密钥（以 ea_live_ 开头）
 * @param remoteIp - 客户端 IP 地址，用于日志记录
 * @returns Promise<SmtpAuthResult> 认证结果，包含成功状态和用户/密钥信息
 */
export async function authenticateSmtpUser(
  username: string,
  password: string,
  remoteIp: string
): Promise<SmtpAuthResult> {
  // 用户名即为邮箱地址，密码即为 API 密钥
  const email = username;
  const apiKey = password;

  // 验证邮箱地址是否为空
  if (!email) {
    return {
      success: false,
      error: "请输入邮箱地址作为用户名",
    };
  }

  // 验证 API 密钥是否为空
  if (!apiKey) {
    return {
      success: false,
      error: "请输入 API 密钥作为密码",
    };
  }

  // 验证 API 密钥格式，必须以 ea_live_ 开头
  if (!apiKey.startsWith("ea_live_")) {
    return {
      success: false,
      error: "无效的 API 密钥格式",
    };
  }

  // 使用正则表达式验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      success: false,
      error: "无效的邮箱地址格式",
    };
  }

  try {
    // 查询 API 密钥记录，同时获取关联的用户信息
    const keyRecord = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    // API 密钥不存在
    if (!keyRecord) {
      const result = {
        success: false,
        error: "API 密钥不存在或已失效",
      };

      // 记录认证失败日志
      await logSmtpAuth({
        username: email,
        success: false,
        error: result.error,
        remoteIp,
      });

      return result;
    }

    // 更新 API 密钥的最后使用时间
    await prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsedAt: new Date() },
    });

    // 解析允许的邮箱账户 ID 列表用于返回
    let allowedEmailAccountIds: string[] | null = null;
    if (keyRecord.allowedEmailAccountIds) {
      try {
        allowedEmailAccountIds = JSON.parse(keyRecord.allowedEmailAccountIds);
      } catch {
        allowedEmailAccountIds = null;
      }
    }

    // 记录认证成功日志
    await logSmtpAuth({
      apiKeyId: keyRecord.id,
      userId: keyRecord.userId,
      username: email,
      success: true,
      remoteIp,
    });

    // 返回认证成功结果，包含用户和 API 密钥信息
    return {
      success: true,
      apiKey: {
        id: keyRecord.id,
        userId: keyRecord.userId,
        name: keyRecord.name,
        scope: keyRecord.scope,
        allowedEmailAccountIds,
      },
      user: keyRecord.user,
    };
  } catch (error) {
    // 捕获并记录认证过程中的异常
    console.error("[SMTP Auth] 认证失败:", error);
    return {
      success: false,
      error: "认证过程中发生错误",
    };
  }
}
