import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const TOKEN_EXPIRY_HOURS = 1;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, token, password } = body as {
      email: string;
      token: string;
      password: string;
    };

    if (!email || !token || !password) {
      return NextResponse.json(
        { error: "邮箱、令牌和密码为必填项" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "密码长度至少为 6 位" },
        { status: 400 }
      );
    }

    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        email,
        code: token,
        type: "RESET_PASSWORD",
        used: false,
      },
    });

    if (!verificationCode) {
      return NextResponse.json(
        { error: "无效的重置令牌" },
        { status: 400 }
      );
    }

    const now = new Date();
    const expiresAt = new Date(verificationCode.expiresAt);
    const expiryTime = new Date(verificationCode.createdAt.getTime() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    if (now > expiryTime || now > expiresAt) {
      return NextResponse.json(
        { error: "重置令牌已过期，请重新获取" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 404 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { email },
        data: { password: hashedPassword },
      }),
      prisma.verificationCode.update({
        where: { id: verificationCode.id },
        data: { used: true },
      }),
    ]);

    return NextResponse.json(
      { message: "密码重置成功" },
      { status: 200 }
    );
  } catch (error) {
    console.error("重置密码错误:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}