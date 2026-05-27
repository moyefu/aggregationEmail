/*
 * 管理员认证中间件
 *
 * 本模块提供管理后台的认证功能，包括：
 * - 从请求中提取管理员令牌
 * - 管理员令牌验证
 * - 管理后台路由保护装饰器
 *
 * 用于保护管理后台相关接口，确保只有已认证的管理员可以访问
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/admin-auth";

/**
 * 从请求中提取管理员令牌
 *
 * 支持两种方式获取令牌：
 * 1. Authorization 请求头（Bearer Token）
 * 2. Cookie 中的 admin_token 字段
 *
 * @param request - Next.js 请求对象
 * @returns 令牌字符串，未找到时返回 null
 */
export function getAdminTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");

  // 优先从 Authorization 请求头获取
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // 其次从 Cookie 获取
  const token = request.cookies.get("admin_token")?.value;
  if (token) {
    return token;
  }

  return null;
}

/**
 * 管理员路由认证装饰器（无参数版本）
 *
 * 包装路由处理函数，自动进行管理员身份验证。
 * 验证失败返回 401 错误。
 *
 * @param handler - 原始路由处理函数
 * @returns 包装后的路由处理函数
 *
 * @example
 * export const GET = withAdminAuth(async (request) => {
 *   // 已验证管理员身份
 *   return NextResponse.json({ success: true });
 * });
 */
export function withAdminAuth(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const token = getAdminTokenFromRequest(request);

    // 检查是否提供了令牌
    if (!token) {
      return NextResponse.json(
        { error: "未授权访问，请先登录管理后台" },
        { status: 401 }
      );
    }

    // 验证令牌有效性
    const payload = verifyAdminToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: "管理员凭证无效或已过期" },
        { status: 401 }
      );
    }

    return handler(request);
  };
}

/**
 * 路由处理函数类型定义（支持路由参数）
 */
type RouteHandler<T = unknown> = (
  request: NextRequest,
  context: T
) => Promise<NextResponse>;

/**
 * 管理员路由认证装饰器（支持路由参数版本）
 *
 * 包装带有路由参数的路由处理函数，自动进行管理员身份验证。
 * 验证失败返回 401 错误。
 *
 * @param handler - 原始路由处理函数（接收请求和路由参数上下文）
 * @returns 包装后的路由处理函数
 *
 * @example
 * export const GET = withAdminAuthParams(async (request, { params }) => {
 *   const { id } = params;
 *   // 已验证管理员身份
 *   return NextResponse.json({ id });
 * });
 */
export function withAdminAuthParams<T = unknown>(handler: RouteHandler<T>) {
  return async (request: NextRequest, context: T) => {
    const token = getAdminTokenFromRequest(request);

    // 检查是否提供了令牌
    if (!token) {
      return NextResponse.json(
        { error: "未授权访问，请先登录管理后台" },
        { status: 401 }
      );
    }

    // 验证令牌有效性
    const payload = verifyAdminToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: "管理员凭证无效或已过期" },
        { status: 401 }
      );
    }

    return handler(request, context);
  };
}
