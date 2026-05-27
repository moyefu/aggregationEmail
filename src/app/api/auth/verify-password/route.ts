import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

async function POST(request: NextRequest) {
  try {
    const user = (request as NextRequest & { user: { id: string } }).user;
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
        { valid: false, error: "密码错误" },
        { status: 200 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("验证密码错误:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

export const POST_handler = withAuth(POST);
export { POST_handler as POST };
