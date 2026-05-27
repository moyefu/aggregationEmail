import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail, isSiteSmtpConfigured } from "@/lib/site-smtp";
import crypto from "crypto";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_EXPIRY_HOURS = 1;

function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function POST(request: NextRequest) {
  try {
    if (!isSiteSmtpConfigured()) {
      return NextResponse.json(
        { error: "站点 SMTP 未配置，无法发送重置邮件" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { email } = body as { email: string };

    if (!email) {
      return NextResponse.json(
        { error: "邮箱为必填项" },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: "邮箱格式不正确" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { message: "如果该邮箱已注册，您将收到密码重置邮件" },
        { status: 200 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { message: "如果该邮箱已注册，您将收到密码重置邮件" },
        { status: 200 }
      );
    }

    const recentTokens = await prisma.verificationCode.findMany({
      where: {
        email,
        type: "RESET_PASSWORD",
        createdAt: {
          gte: new Date(Date.now() - 60 * 1000),
        },
      },
    });

    if (recentTokens.length >= 1) {
      return NextResponse.json(
        { error: "发送频率过高，请稍后再试" },
        { status: 429 }
      );
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    await prisma.verificationCode.create({
      data: {
        email,
        code: token,
        type: "RESET_PASSWORD",
        expiresAt,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
    const resetLink = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    const result = await sendPasswordResetEmail(email, resetLink, TOKEN_EXPIRY_HOURS * 60);

    if (!result.success) {
      return NextResponse.json(
        { error: `邮件发送失败: ${result.error}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "密码重置链接已发送到您的邮箱" },
      { status: 200 }
    );
  } catch (error) {
    console.error("忘记密码错误:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}