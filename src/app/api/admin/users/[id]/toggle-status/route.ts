import { NextRequest, NextResponse } from "next/server";
import { withAdminAuthParams } from "@/middleware/adminAuth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function toggleUserStatus(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const body = await request.json();
  const { disabledReason } = body;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { isActive: true },
  });

  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  if (user.isActive) {
    if (!disabledReason || typeof disabledReason !== "string" || disabledReason.trim() === "") {
      return NextResponse.json(
        { error: "禁用用户时必须提供禁用原因" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        disabledAt: new Date(),
        disabledReason: disabledReason.trim(),
      },
      select: {
        id: true,
        isActive: true,
        disabledAt: true,
        disabledReason: true,
      },
    });

    return NextResponse.json({
      message: "用户已禁用",
      user: updatedUser,
    });
  } else {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        isActive: true,
        disabledAt: null,
        disabledReason: null,
      },
      select: {
        id: true,
        isActive: true,
        disabledAt: true,
        disabledReason: true,
      },
    });

    return NextResponse.json({
      message: "用户已启用",
      user: updatedUser,
    });
  }
}

export const POST = withAdminAuthParams(toggleUserStatus);
