import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth";
import { prisma } from "@/lib/prisma";

async function PUT(request: NextRequest) {
  try {
    const user = (request as NextRequest & { user: { id: string } }).user;
    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "姓名不能为空" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { name: name.trim() },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return NextResponse.json({
      message: "个人信息更新成功",
      user: updatedUser,
    });
  } catch (error) {
    console.error("更新个人信息错误:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

export const PUT_handler = withAuth(PUT);
export { PUT_handler as PUT };
