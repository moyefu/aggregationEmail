import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/middleware/adminAuth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * 获取用户列表（管理员）
 * 
 * 支持分页查询，返回用户详细信息包括等级、邮箱数、API Key 数等。
 */
async function getUsers(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        disabledAt: true,
        disabledReason: true,
        lastLoginAt: true,
        lastLoginIp: true,
        lastLoginUserAgent: true,
        createdAt: true,
        updatedAt: true,
        level: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            emailAccounts: true,
            apiKeys: true,
          },
        },
        emailAccounts: {
          select: { updatedAt: true },
          orderBy: { updatedAt: "desc" },
          take: 1,
        },
        apiKeys: {
          select: { lastUsedAt: true },
          orderBy: { lastUsedAt: "desc" },
          take: 1,
        },
      },
    }),
    prisma.user.count(),
  ]);

  const usersWithLastActivity = users.map((user) => {
    const lastEmailAccountActivity = user.emailAccounts[0]?.updatedAt;
    const lastApiKeyActivity = user.apiKeys[0]?.lastUsedAt;

    let lastActivityAt: Date | null = null;
    if (lastEmailAccountActivity && lastApiKeyActivity) {
      lastActivityAt = new Date(
        Math.max(lastEmailAccountActivity.getTime(), lastApiKeyActivity.getTime())
      );
    } else {
      lastActivityAt = lastEmailAccountActivity || lastApiKeyActivity || null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      levelId: user.level.id,
      levelName: user.level.name,
      emailAccountCount: user._count.emailAccounts,
      apiKeyCount: user._count.apiKeys,
      lastActivityAt,
      lastLoginAt: user.lastLoginAt,
      lastLoginIp: user.lastLoginIp,
      lastLoginUserAgent: user.lastLoginUserAgent,
      isActive: user.isActive,
      disabledAt: user.disabledAt,
      disabledReason: user.disabledReason,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  });

  return NextResponse.json({
    users: usersWithLastActivity,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

/**
 * 创建用户（管理员）
 * 
 * 管理员可以直接创建用户，无需邮箱验证。
 * 
 * @param request - Next.js 请求对象
 * @returns 创建的用户信息
 */
async function createUser(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, levelId } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "邮箱和密码为必填项" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "邮箱格式不正确" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "密码长度至少为 8 个字符" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "该邮箱已被注册" },
        { status: 409 }
      );
    }

    const level = await prisma.userLevel.findUnique({
      where: { id: levelId || 1 },
    });

    if (!level) {
      return NextResponse.json(
        { error: "指定的用户等级不存在" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        levelId: level.id,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        level: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "用户创建成功",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        levelId: user.level.id,
        levelName: user.level.name,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("创建用户错误:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

export const GET = withAdminAuth(getUsers);
export const POST = withAdminAuth(createUser);
