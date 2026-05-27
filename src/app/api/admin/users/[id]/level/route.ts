import { NextRequest, NextResponse } from "next/server";
import { withAdminAuthParams } from "@/middleware/adminAuth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function updateUserLevel(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const body = await request.json();
  const { levelId } = body;

  if (!levelId || typeof levelId !== "number") {
    return NextResponse.json({ error: "等级ID无效" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  const level = await prisma.userLevel.findUnique({
    where: { id: levelId },
    select: { id: true, name: true },
  });

  if (!level) {
    return NextResponse.json({ error: "等级不存在" }, { status: 404 });
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { levelId },
    select: {
      id: true,
      email: true,
      name: true,
      level: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return NextResponse.json({
    message: "用户等级已更新",
    user: updatedUser,
  });
}

export const PUT = withAdminAuthParams(updateUserLevel);
