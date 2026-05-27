import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth";
import { sendEmail, verifySmtpConnection } from "@/lib/email";

async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { smtpHost, smtpPort, smtpUser, smtpPassword, fromEmail, fromName, toEmail } = body;

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword || !fromEmail || !toEmail) {
      return NextResponse.json(
        { error: "缺少必填字段" },
        { status: 400 }
      );
    }

    const port = parseInt(smtpPort, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      return NextResponse.json(
        { error: "端口号无效" },
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

    const smtpConfig = {
      host: smtpHost,
      port,
      user: smtpUser,
      password: smtpPassword,
    };

    const verifyResult = await verifySmtpConnection(smtpConfig);
    if (!verifyResult.success) {
      return NextResponse.json(
        { error: verifyResult.error || "SMTP 连接验证失败" },
        { status: 400 }
      );
    }

    const result = await sendEmail(smtpConfig, {
      from: fromEmail,
      fromName: fromName || undefined,
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

export const POST_handler = withAuth(POST);
export { POST_handler as POST };
