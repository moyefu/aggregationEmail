import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationCode, isSiteSmtpConfigured } from "@/lib/site-smtp";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_EXPIRY_MINUTES = 10;

type CodeType = "REGISTER" | "RESET_PASSWORD";

function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    if (!isSiteSmtpConfigured()) {
      return NextResponse.json(
        { error: "站点 SMTP 未配置，无法发送验证码" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { email, type } = body as { email: string; type: CodeType };

    if (!email || !type) {
      return NextResponse.json(
        { error: "邮箱和验证码类型为必填项" },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: "邮箱格式不正确" },
        { status: 400 }
      );
    }

    if (type !== "REGISTER" && type !== "RESET_PASSWORD") {
      return NextResponse.json(
        { error: "验证码类型无效，必须是 REGISTER 或 RESET_PASSWORD" },
        { status: 400 }
      );
    }

    if (type === "REGISTER") {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      if (existingUser) {
        return NextResponse.json(
          { error: "该邮箱已被注册" },
          { status: 409 }
        );
      }
    }

    if (type === "RESET_PASSWORD") {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      if (!existingUser) {
        return NextResponse.json(
          { error: "该邮箱未注册" },
          { status: 404 }
        );
      }
    }

    const recentCodes = await prisma.verificationCode.findMany({
      where: {
        email,
        type,
        createdAt: {
          gte: new Date(Date.now() - 60 * 1000),
        },
      },
    });

    if (recentCodes.length >= 3) {
      return NextResponse.json(
        { error: "发送频率过高，请稍后再试" },
        { status: 429 }
      );
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

    await prisma.verificationCode.create({
      data: {
        email,
        code,
        type,
        expiresAt,
      },
    });

    const result = await sendVerificationCode(email, code, CODE_EXPIRY_MINUTES);

    if (!result.success) {
      return NextResponse.json(
        { error: `验证码发送失败: ${result.error}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "验证码已发送，请查收邮件" },
      { status: 200 }
    );
  } catch (error) {
    console.error("发送验证码错误:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}