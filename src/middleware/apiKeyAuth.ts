/*
 * API 密钥认证中间件
 *
 * 本模块提供基于 API 密钥的认证和权限控制功能，包括：
 * - API 密钥验证
 * - 邮箱账户权限检查
 * - 路由保护装饰器
 *
 * 用于保护外部 API 接口，支持按密钥范围控制邮箱账户访问权限
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * API 密钥认证结果接口
 * 包含验证状态、密钥信息、用户信息和错误信息
 */
export interface ApiKeyAuthResult {
  // 验证是否通过
  valid: boolean;
  // API 密钥详细信息（验证成功时返回）
  apiKey?: {
    // 密钥唯一标识
    id: string;
    // 密钥所属用户 ID
    userId: string;
    // 密钥名称
    name: string;
    // 权限范围：ALL（全部邮箱）或 SPECIFIC（指定邮箱）
    scope: string;
    // 允许访问的邮箱账户 ID 列表（scope 为 SPECIFIC 时有效）
    allowedEmailAccountIds: string[] | null;
  };
  // 用户信息（验证成功时返回）
  user?: {
    // 用户唯一标识
    id: string;
    // 用户邮箱
    email: string;
    // 用户名称
    name: string | null;
  };
  // 错误信息（验证失败时返回）
  error?: string;
}

/**
 * 从请求中提取 API 密钥
 *
 * 从 Authorization 请求头中获取 Bearer Token 格式的 API 密钥
 *
 * @param request - Next.js 请求对象
 * @returns API 密钥字符串，未找到时返回 null
 */
export function getApiKeyFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");

  // 从 Authorization 请求头获取 Bearer Token
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * 验证 API 密钥
 *
 * 检查 API 密钥的有效性，包括格式验证、数据库查询和最后使用时间更新
 *
 * @param request - Next.js 请求对象
 * @returns 认证结果对象，包含验证状态、密钥信息、用户信息或错误信息
 */
export async function verifyApiKey(request: NextRequest): Promise<ApiKeyAuthResult> {
  const apiKey = getApiKeyFromRequest(request);

  // 检查是否提供了 API 密钥
  if (!apiKey) {
    return {
      valid: false,
      error: "缺少 API 密钥，请在请求头中提供 Authorization: Bearer ea_live_xxx",
    };
  }

  // 检查密钥格式是否正确
  if (!apiKey.startsWith("ea_live_")) {
    return {
      valid: false,
      error: "无效的 API 密钥格式",
    };
  }

  try {
    // 查询密钥记录并关联用户信息
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

    // 密钥不存在
    if (!keyRecord) {
      return {
        valid: false,
        error: "API 密钥不存在或已失效",
      };
    }

    // 更新密钥最后使用时间
    await prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsedAt: new Date() },
    });

    // 解析允许访问的邮箱账户 ID 列表
    let allowedEmailAccountIds: string[] | null = null;
    if (keyRecord.allowedEmailAccountIds) {
      try {
        allowedEmailAccountIds = JSON.parse(keyRecord.allowedEmailAccountIds);
      } catch {
        allowedEmailAccountIds = null;
      }
    }

    return {
      valid: true,
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
    console.error("验证 API 密钥失败:", error);
    return {
      valid: false,
      error: "验证 API 密钥时发生错误",
    };
  }
}

/**
 * 检查邮箱账户使用权限
 *
 * 根据 API 密钥的权限范围检查是否允许使用指定的邮箱账户
 *
 * @param apiKeyId - API 密钥 ID
 * @param userId - 用户 ID
 * @param emailAccountId - 邮箱账户 ID
 * @returns 权限检查结果，包含是否允许和错误信息
 */
export async function checkEmailPermission(
  apiKeyId: string,
  userId: string,
  emailAccountId: string
): Promise<{ allowed: boolean; error?: string }> {
  try {
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: apiKeyId },
    });

    if (!apiKey) {
      return { allowed: false, error: "API 密钥不存在" };
    }

    // 权限范围为 ALL：可使用用户所有邮箱账户
    if (apiKey.scope === "ALL") {
      const emailAccount = await prisma.emailAccount.findFirst({
        where: {
          id: emailAccountId,
          userId,
        },
      });

      if (!emailAccount) {
        return { allowed: false, error: "邮箱账户不存在或不属于当前用户" };
      }

      return { allowed: true };
    }

    // 权限范围为 SPECIFIC：仅可使用指定的邮箱账户
    if (apiKey.scope === "SPECIFIC") {
      let allowedIds: string[] = [];
      if (apiKey.allowedEmailAccountIds) {
        try {
          allowedIds = JSON.parse(apiKey.allowedEmailAccountIds);
        } catch {
          return { allowed: false, error: "API 密钥权限配置错误" };
        }
      }

      // 检查目标邮箱账户是否在允许列表中
      if (!allowedIds.includes(emailAccountId)) {
        return { allowed: false, error: "该 API 密钥无权使用此邮箱账户发送邮件" };
      }

      // 验证邮箱账户确实属于当前用户
      const emailAccount = await prisma.emailAccount.findFirst({
        where: {
          id: emailAccountId,
          userId,
        },
      });

      if (!emailAccount) {
        return { allowed: false, error: "邮箱账户不存在或不属于当前用户" };
      }

      return { allowed: true };
    }

    return { allowed: false, error: "未知的权限范围" };
  } catch (error) {
    console.error("检查邮箱权限失败:", error);
    return { allowed: false, error: "检查权限时发生错误" };
  }
}

/**
 * 根据邮箱地址检查使用权限
 *
 * 通过发件人邮箱地址查找邮箱账户，并检查 API 密钥是否有权使用该账户
 *
 * @param apiKeyId - API 密钥 ID
 * @param userId - 用户 ID
 * @param fromEmail - 发件人邮箱地址
 * @returns 权限检查结果，包含是否允许、邮箱账户 ID 和错误信息
 */
export async function checkEmailPermissionByAddress(
  apiKeyId: string,
  userId: string,
  fromEmail: string
): Promise<{ allowed: boolean; emailAccountId?: string; error?: string }> {
  try {
    // 根据邮箱地址查找邮箱账户
    const emailAccount = await prisma.emailAccount.findFirst({
      where: {
        fromEmail,
        userId,
      },
    });

    if (!emailAccount) {
      return { allowed: false, error: "发件人邮箱未绑定或不存在" };
    }

    // 检查 API 密钥是否有权使用该邮箱账户
    const permissionCheck = await checkEmailPermission(apiKeyId, userId, emailAccount.id);

    return {
      allowed: permissionCheck.allowed,
      emailAccountId: emailAccount.id,
      error: permissionCheck.error,
    };
  } catch (error) {
    console.error("检查邮箱权限失败:", error);
    return { allowed: false, error: "检查权限时发生错误" };
  }
}

/**
 * API 密钥认证装饰器
 *
 * 包装路由处理函数，自动进行 API 密钥验证。
 * 验证成功后将密钥信息和用户信息传递给处理函数，验证失败返回 401 错误。
 *
 * @param handler - 原始路由处理函数，接收请求和认证上下文
 * @returns 包装后的路由处理函数
 *
 * @example
 * export const POST = withApiKeyAuth(async (request, { apiKey, user }) => {
 *   // apiKey: API 密钥信息
 *   // user: 用户信息
 *   return NextResponse.json({ success: true });
 * });
 */
export function withApiKeyAuth(
  handler: (
    request: NextRequest,
    context: { apiKey: NonNullable<ApiKeyAuthResult["apiKey"]>; user: NonNullable<ApiKeyAuthResult["user"]> }
  ) => Promise<NextResponse>
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    const authResult = await verifyApiKey(request);

    if (!authResult.valid) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    return handler(request, {
      apiKey: authResult.apiKey!,
      user: authResult.user!,
    });
  };
}
