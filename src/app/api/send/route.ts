import { NextRequest, NextResponse } from "next/server";
import { withApiKeyAuth, checkEmailPermissionByAddress } from "@/middleware/apiKeyAuth";
import { sendEmail, EmailOptions, EmailAttachment } from "@/lib/email";
import { decrypt } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

interface SendEmailRequestBody {
  from: string;
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: EmailAttachment[];
}

async function POST(
  request: NextRequest,
  context: { apiKey: { id: string; userId: string }; user: { id: string; email: string } }
) {
  try {
    const body: SendEmailRequestBody = await request.json();
    const { from, to, subject, text, html, cc, bcc, attachments } = body;

    if (!from || !to || !subject) {
      return NextResponse.json(
        { error: "缺少必填字段：from, to, subject" },
        { status: 400 }
      );
    }

    if (!text && !html) {
      return NextResponse.json(
        { error: "邮件内容不能为空，请提供 text 或 html" },
        { status: 400 }
      );
    }

    const permissionCheck = await checkEmailPermissionByAddress(
      context.apiKey.id,
      context.user.id,
      from
    );

    if (!permissionCheck.allowed) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: 403 }
      );
    }

    const emailAccount = await prisma.emailAccount.findUnique({
      where: { id: permissionCheck.emailAccountId },
    });

    if (!emailAccount) {
      return NextResponse.json(
        { error: "邮箱账户不存在" },
        { status: 404 }
      );
    }

    let decryptedPassword: string;
    try {
      decryptedPassword = decrypt(emailAccount.smtpPassword);
    } catch {
      return NextResponse.json(
        { error: "邮箱账户密码解密失败，请重新绑定邮箱" },
        { status: 500 }
      );
    }

    const emailOptions: EmailOptions = {
      from: emailAccount.fromEmail,
      fromName: emailAccount.fromName || undefined,
      to,
      subject,
      text,
      html,
      cc,
      bcc,
      attachments,
    };

    const result = await sendEmail(
      {
        host: emailAccount.smtpHost,
        port: emailAccount.smtpPort,
        user: emailAccount.smtpUser,
        password: decryptedPassword,
      },
      emailOptions
    );

    const toAddress = Array.isArray(to) ? to.join(", ") : to;

    const remoteIp = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
                     request.headers.get("x-real-ip") ||
                     "unknown";

    await prisma.emailLog.create({
      data: {
        userId: context.user.id,
        apiKeyId: context.apiKey.id,
        emailAccountId: emailAccount.id,
        to: toAddress,
        subject,
        status: result.success ? "SUCCESS" : "FAILED",
        error: result.error || null,
        source: "API",
        remoteIp,
      },
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        message: "邮件发送成功",
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("发送邮件错误:", error);
    return NextResponse.json(
      { error: "发送邮件时发生错误" },
      { status: 500 }
    );
  }
}

export const POST_handler = withApiKeyAuth(POST);
export { POST_handler as POST };
