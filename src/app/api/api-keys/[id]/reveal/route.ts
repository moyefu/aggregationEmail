import { NextRequest, NextResponse } from "next/server";
import { withAuthParams } from "@/middleware/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function postHandler(request: NextRequest, { params }: RouteParams) {
  try {
    const user = (request as NextRequest & { user: { id: string } }).user;
    const { id } = await params;
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: "请输入密码" },
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

    const isValid = await bcrypt.compare(password, dbUser.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "密码错误" },
        { status: 400 }
      );
    }

    const apiKey = await prisma.apiKey.findFirst({
      where: { id, userId: user.id },
      select: { key: true },
    });

    if (!apiKey) {
      return NextResponse.json(
        { error: "API 密钥不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({ key: apiKey.key });
  } catch (error) {
    console.error("查看 API 密钥错误:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

export const POST = withAuthParams(postHandler);
