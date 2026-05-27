import { NextRequest, NextResponse } from "next/server";
import { withAuthParams } from "@/middleware/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function deleteHandler(request: NextRequest, { params }: RouteParams) {
  try {
    const user = (request as NextRequest & { user: { id: string } }).user;
    const { id } = await params;

    const apiKey = await prisma.apiKey.findUnique({
      where: { id },
    });

    if (!apiKey) {
      return NextResponse.json(
        { error: "API 密钥不存在" },
        { status: 404 }
      );
    }

    if (apiKey.userId !== user.id) {
      return NextResponse.json(
        { error: "无权删除此 API 密钥" },
        { status: 403 }
      );
    }

    await prisma.apiKey.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "API 密钥已删除",
    });
  } catch (error) {
    console.error("删除 API 密钥失败:", error);
    return NextResponse.json(
      { error: "删除 API 密钥失败" },
      { status: 500 }
    );
  }
}

async function getHandler(request: NextRequest, { params }: RouteParams) {
  try {
    const user = (request as NextRequest & { user: { id: string } }).user;
    const { id } = await params;

    const apiKey = await prisma.apiKey.findUnique({
      where: { id },
      include: {
        _count: {
          select: { emailLogs: true },
        },
      },
    });

    if (!apiKey) {
      return NextResponse.json(
        { error: "API 密钥不存在" },
        { status: 404 }
      );
    }

    if (apiKey.userId !== user.id) {
      return NextResponse.json(
        { error: "无权访问此 API 密钥" },
        { status: 403 }
      );
    }

    const keyMasked = apiKey.key.length > 12 
      ? `${apiKey.key.substring(0, 8)}...${apiKey.key.substring(apiKey.key.length - 4)}`
      : apiKey.key;

    return NextResponse.json({
      id: apiKey.id,
      name: apiKey.name,
      keyMasked,
      scope: apiKey.scope,
      allowedEmailAccountIds: apiKey.allowedEmailAccountIds,
      lastUsedAt: apiKey.lastUsedAt,
      createdAt: apiKey.createdAt,
      updatedAt: apiKey.updatedAt,
      emailLogCount: apiKey._count.emailLogs,
    });
  } catch (error) {
    console.error("获取 API 密钥详情失败:", error);
    return NextResponse.json(
      { error: "获取 API 密钥详情失败" },
      { status: 500 }
    );
  }
}

export const DELETE = withAuthParams(deleteHandler);
export const GET = withAuthParams(getHandler);
