import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function PUT(request: NextRequest) {
  try {
    const user = (request as NextRequest & { user: { id: string } }).user;
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "请填写所有密码字段" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "新密码长度至少为 8 个字符" },
        { status: 400 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 404 }
      );
    }

    const isValid = await bcrypt.compare(currentPassword, dbUser.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "当前密码错误" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      message: "密码修改成功",
    });
  } catch (error) {
    console.error("修改密码错误:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

export const PUT_handler = withAuth(PUT);
export { PUT_handler as PUT };
