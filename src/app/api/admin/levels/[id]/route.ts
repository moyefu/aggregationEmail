import { NextRequest, NextResponse } from "next/server";
import { withAdminAuthParams } from "@/middleware/adminAuth";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function getLevel(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const levelId = parseInt(id, 10);

  if (isNaN(levelId)) {
    return NextResponse.json({ error: "无效的等级ID" }, { status: 400 });
  }

  const level = await prisma.userLevel.findUnique({
    where: { id: levelId },
    include: {
      _count: {
        select: { users: true },
      },
    },
  });

  if (!level) {
    return NextResponse.json({ error: "等级不存在" }, { status: 404 });
  }

  return NextResponse.json({
    id: level.id,
    name: level.name,
    maxEmailAccounts: level.maxEmailAccounts,
    userCount: level._count.users,
    createdAt: level.createdAt,
    updatedAt: level.updatedAt,
  });
}

async function updateLevel(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const levelId = parseInt(id, 10);

  if (isNaN(levelId)) {
    return NextResponse.json({ error: "无效的等级ID" }, { status: 400 });
  }

  const body = await request.json();
  const { name, maxEmailAccounts } = body;

  const updateData: { name?: string; maxEmailAccounts?: number } = {};

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "等级名称不能为空" }, { status: 400 });
    }

    const existingLevel = await prisma.userLevel.findFirst({
      where: {
        name: name.trim(),
        NOT: { id: levelId },
      },
    });

    if (existingLevel) {
      return NextResponse.json({ error: "等级名称已存在" }, { status: 400 });
    }

    updateData.name = name.trim();
  }

  if (maxEmailAccounts !== undefined) {
    if (
      typeof maxEmailAccounts !== "number" ||
      maxEmailAccounts < 0 ||
      !Number.isInteger(maxEmailAccounts)
    ) {
      return NextResponse.json({ error: "邮箱限制必须是正整数" }, { status: 400 });
    }
    updateData.maxEmailAccounts = maxEmailAccounts;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "没有需要更新的字段" }, { status: 400 });
  }

  const level = await prisma.userLevel.update({
    where: { id: levelId },
    data: updateData,
    include: {
      _count: {
        select: { users: true },
      },
    },
  });

  return NextResponse.json({
    id: level.id,
    name: level.name,
    maxEmailAccounts: level.maxEmailAccounts,
    userCount: level._count.users,
    createdAt: level.createdAt,
    updatedAt: level.updatedAt,
  });
}

async function deleteLevel(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const levelId = parseInt(id, 10);

  if (isNaN(levelId)) {
    return NextResponse.json({ error: "无效的等级ID" }, { status: 400 });
  }

  const level = await prisma.userLevel.findUnique({
    where: { id: levelId },
    include: {
      _count: {
        select: { users: true },
      },
    },
  });

  if (!level) {
    return NextResponse.json({ error: "等级不存在" }, { status: 404 });
  }

  if (level._count.users > 0) {
    return NextResponse.json(
      { error: "该等级下存在用户，无法删除" },
      { status: 400 }
    );
  }

  await prisma.userLevel.delete({
    where: { id: levelId },
  });

  return NextResponse.json({ message: "等级已删除" });
}

export const GET = withAdminAuthParams(getLevel);
export const PUT = withAdminAuthParams(updateLevel);
export const DELETE = withAdminAuthParams(deleteLevel);
