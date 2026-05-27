import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

function generateApiKey(): string {
  const randomString = randomBytes(32).toString("hex");
  return `ea_live_${randomString}`;
}

function maskApiKey(key: string): string {
  if (key.length <= 12) return key;
  const prefix = key.substring(0, 8);
  const suffix = key.substring(key.length - 4);
  return `${prefix}...${suffix}`;
}

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const user = (request as NextRequest & { user: { id: string } }).user;

    const apiKeys = await prisma.apiKey.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { emailLogs: true },
        },
      },
    });

    const keysWithMaskedKey = apiKeys.map((apiKey) => ({
      id: apiKey.id,
      name: apiKey.name,
      key: maskApiKey(apiKey.key),
      scope: apiKey.scope,
      allowedEmailAccountIds: apiKey.allowedEmailAccountIds,
      lastUsedAt: apiKey.lastUsedAt,
      createdAt: apiKey.createdAt,
      usageCount: apiKey._count.emailLogs,
    }));

    const maxApiKeys = parseInt(process.env.MAX_API_KEYS_PER_USER || "10", 10);

    return NextResponse.json({
      keys: keysWithMaskedKey,
      apiKeyLimit: {
        current: apiKeys.length,
        max: maxApiKeys,
      },
    });
  } catch (error) {
    console.error("获取 API 密钥列表失败:", error);
    return NextResponse.json(
      { error: "获取 API 密钥列表失败" },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const user = (request as NextRequest & { user: { id: string } }).user;
    const body = await request.json();

    const { name, scope = "ALL", allowedEmailAccountIds } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "密钥名称不能为空" },
        { status: 400 }
      );
    }

    const maxApiKeys = parseInt(process.env.MAX_API_KEYS_PER_USER || "10", 10);
    const currentKeyCount = await prisma.apiKey.count({
      where: { userId: user.id },
    });

    if (currentKeyCount >= maxApiKeys) {
      return NextResponse.json(
        { error: `您已达到 API 密钥数量上限（${maxApiKeys}个），请删除不需要的密钥后再创建` },
        { status: 400 }
      );
    }

    if (scope !== "ALL" && scope !== "SPECIFIC") {
      return NextResponse.json(
        { error: "权限范围必须是 ALL 或 SPECIFIC" },
        { status: 400 }
      );
    }

    if (scope === "SPECIFIC") {
      if (
        !allowedEmailAccountIds ||
        !Array.isArray(allowedEmailAccountIds) ||
        allowedEmailAccountIds.length === 0
      ) {
        return NextResponse.json(
          { error: "指定邮箱权限范围需要选择至少一个邮箱账户" },
          { status: 400 }
        );
      }

      const emailAccounts = await prisma.emailAccount.findMany({
        where: {
          id: { in: allowedEmailAccountIds },
          userId: user.id,
        },
      });

      if (emailAccounts.length !== allowedEmailAccountIds.length) {
        return NextResponse.json(
          { error: "部分邮箱账户不存在或不属于当前用户" },
          { status: 400 }
        );
      }
    }

    const rawKey = generateApiKey();

    const apiKey = await prisma.apiKey.create({
      data: {
        userId: user.id,
        key: rawKey,
        name: name.trim(),
        scope,
        allowedEmailAccountIds:
          scope === "SPECIFIC" ? JSON.stringify(allowedEmailAccountIds) : null,
      },
    });

    return NextResponse.json({
      id: apiKey.id,
      name: apiKey.name,
      key: rawKey,
      scope: apiKey.scope,
      allowedEmailAccountIds: apiKey.allowedEmailAccountIds,
      createdAt: apiKey.createdAt,
      message: "API 密钥创建成功，请妥善保管，此密钥仅显示一次",
    });
  } catch (error) {
    console.error("创建 API 密钥失败:", error);
    return NextResponse.json(
      { error: "创建 API 密钥失败" },
      { status: 500 }
    );
  }
});
