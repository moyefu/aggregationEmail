import { NextRequest, NextResponse } from "next/server";
import { withAuthParams } from "@/middleware/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, verifySmtpConnection } from "@/lib/email";
import { decrypt } from "@/lib/crypto";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function postHandler(request: NextRequest, { params }: RouteParams) {
  try {
    const user = (request as NextRequest & { user: { id: string } }).user;
    const { id } = await params;
    const body = await request.json();
    const { toEmail, smtpHost, smtpPort, smtpUser, smtpPassword, fromEmail, fromName } = body;

    if (!toEmail) {
      return NextResponse.json(
        { error: "请输入收件人邮箱" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(toEmail)) {
      return NextResponse.json(
        { error: "收件人邮箱格式不正确" },
        { status: 400 }
      );
    }

    const emailAccount = await prisma.emailAccount.findFirst({
      where: { id, userId: user.id },
      select: {
        id: true,
        smtpHost: true,
        smtpPort: true,
        smtpUser: true,
        smtpPassword: true,
        fromEmail: true,
        fromName: true,
      },
    });

    if (!emailAccount) {
      return NextResponse.json(
        { error: "邮箱账户不存在" },
        { status: 404 }
      );
    }

    const configHost = smtpHost || emailAccount.smtpHost;
    const configPort = smtpPort || emailAccount.smtpPort;
    const configUser = smtpUser || emailAccount.smtpUser;
    const configPassword = smtpPassword || decrypt(emailAccount.smtpPassword);
    const configFromEmail = fromEmail || emailAccount.fromEmail;
    const configFromName = fromName !== undefined ? fromName : emailAccount.fromName;

    const smtpConfig = {
      host: configHost,
      port: parseInt(configPort.toString(), 10),
      user: configUser,
      password: configPassword,
    };

    const verifyResult = await verifySmtpConnection(smtpConfig);
    if (!verifyResult.success) {
      return NextResponse.json(
        { error: verifyResult.error || "SMTP 连接验证失败" },
        { status: 400 }
      );
    }

    const result = await sendEmail(smtpConfig, {
      from: configFromEmail,
      fromName: configFromName || undefined,
      to: [toEmail],
      subject: "邮件聚合服务 - 测试邮件",
      text: "这是一封测试邮件，由邮件聚合服务发送。如果您收到此邮件，说明 SMTP 配置正确。",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">邮件聚合服务 - 测试邮件</h2>
          <p>这是一封测试邮件，由邮件聚合服务发送。</p>
          <p>如果您收到此邮件，说明 SMTP 配置正确。</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">此邮件由系统自动发送，请勿回复。</p>
        </div>
      `,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "测试邮件发送成功",
        messageId: result.messageId,
      });
    } else {
      return NextResponse.json(
        { error: `发送失败: ${result.error}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("发送测试邮件错误:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

export const POST = withAuthParams(postHandler);
