import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/middleware/adminAuth";
import { prisma } from "@/lib/prisma";

async function getLevels(request: NextRequest) {
  const levels = await prisma.userLevel.findMany({
    include: {
      _count: {
        select: { users: true },
      },
    },
    orderBy: { id: "asc" },
  });

  return NextResponse.json(
    levels.map((level) => ({
      id: level.id,
      name: level.name,
      maxEmailAccounts: level.maxEmailAccounts,
      userCount: level._count.users,
      createdAt: level.createdAt,
      updatedAt: level.updatedAt,
    }))
  );
}

async function createLevel(request: NextRequest) {
  const body = await request.json();
  const { name, maxEmailAccounts } = body;

  if (!name || typeof name !== "string" || name.trim() === "") {
    return NextResponse.json({ error: "等级名称不能为空" }, { status: 400 });
  }

  if (
    typeof maxEmailAccounts !== "number" ||
    maxEmailAccounts < 0 ||
    !Number.isInteger(maxEmailAccounts)
  ) {
    return NextResponse.json({ error: "邮箱限制必须是正整数" }, { status: 400 });
  }

  const existingLevel = await prisma.userLevel.findUnique({
    where: { name: name.trim() },
  });

  if (existingLevel) {
    return NextResponse.json({ error: "等级名称已存在" }, { status: 400 });
  }

  const level = await prisma.userLevel.create({
    data: {
      name: name.trim(),
      maxEmailAccounts,
    },
  });

  return NextResponse.json({
    id: level.id,
    name: level.name,
    maxEmailAccounts: level.maxEmailAccounts,
    userCount: 0,
    createdAt: level.createdAt,
    updatedAt: level.updatedAt,
  });
}

export const GET = withAdminAuth(getLevels);
export const POST = withAdminAuth(createLevel);
