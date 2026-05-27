/*
 * 用户认证中间件
 *
 * 本模块提供基于 JWT 的用户认证功能，包括：
 * - JWT 令牌验证
 * - 从请求中提取令牌
 * - 获取已认证用户信息
 * - 路由保护装饰器
 */

import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// JWT 密钥，从环境变量获取，生产环境必须设置
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";

/**
 * JWT 令牌载荷接口
 * 包含用户基本信息和令牌元数据
 */
export interface JwtPayload {
  // 用户唯一标识
  userId: string;
  // 用户邮箱地址
  email: string;
  // 令牌签发时间（Unix 时间戳）
  iat?: number;
  // 令牌过期时间（Unix 时间戳）
  exp?: number;
}

/**
 * 验证 JWT 令牌
 *
 * @param token - 待验证的 JWT 令牌字符串
 * @returns 验证成功返回令牌载荷对象，验证失败返回 null
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    console.error("Token 验证失败:", error);
    return null;
  }
}

/**
 * 从请求中提取 JWT 令牌
 *
 * 支持两种方式获取令牌：
 * 1. Authorization 请求头（Bearer Token）
 * 2. Cookie 中的 token 字段
 *
 * @param request - Next.js 请求对象
 * @returns 令牌字符串，未找到时返回 null
 */
export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");

  // 优先从 Authorization 请求头获取
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // 其次从 Cookie 获取
  const token = request.cookies.get("token")?.value;
  if (token) {
    return token;
  }

  return null;
}

/**
 * 获取已认证的用户信息
 *
 * 从请求中提取令牌并验证，验证成功后从数据库获取用户详细信息。
 * 同时检查用户是否被禁用，禁用用户将返回 null。
 *
 * @param request - Next.js 请求对象
 * @returns 用户信息对象，未认证、验证失败或用户被禁用时返回 null
 */
export async function getAuthUser(request: NextRequest) {
  const token = getTokenFromRequest(request);

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);

  if (!payload) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        disabledReason: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return null;
    }

    if (!user.isActive) {
      console.log(`用户 ${user.email} 已被禁用，拒绝访问`);
      return null;
    }

    return user;
  } catch (error) {
    console.error("获取用户失败:", error);
    return null;
  }
}

/**
 * 路由认证装饰器（无参数版本）
 *
 * 包装路由处理函数，自动进行用户认证。
 * 认证成功后将用户信息附加到 request.user，认证失败返回 401 错误。
 *
 * @param handler - 原始路由处理函数
 * @returns 包装后的路由处理函数
 *
 * @example
 * export const GET = withAuth(async (request) => {
 *   const user = request.user; // 已认证的用户信息
 *   return NextResponse.json({ user });
 * });
 */
export function withAuth(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "未授权访问，请先登录" },
        { status: 401 }
      );
    }

    // 将用户信息附加到请求对象上
    (request as NextRequest & { user: typeof user }).user = user;

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
 * 路由认证装饰器（支持路由参数版本）
 *
 * 包装带有路由参数的路由处理函数，自动进行用户认证。
 * 认证成功后将用户信息附加到 request.user，认证失败返回 401 错误。
 *
 * @param handler - 原始路由处理函数（接收请求和路由参数上下文）
 * @returns 包装后的路由处理函数
 *
 * @example
 * export const GET = withAuthParams(async (request, { params }) => {
 *   const { id } = params;
 *   const user = request.user;
 *   return NextResponse.json({ id, user });
 * });
 */
export function withAuthParams<T = unknown>(handler: RouteHandler<T>) {
  return async (request: NextRequest, context: T) => {
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "未授权访问，请先登录" },
        { status: 401 }
      );
    }

    // 将用户信息附加到请求对象上
    (request as NextRequest & { user: typeof user }).user = user;

    return handler(request, context);
  };
}

/**
 * 创建未授权响应
 *
 * 快速生成标准的 401 未授权 JSON 响应
 *
 * @returns 401 状态码的 JSON 响应对象
 */
export function createAuthResponse() {
  return NextResponse.json(
    { error: "未授权访问，请先登录" },
    { status: 401 }
  );
}
