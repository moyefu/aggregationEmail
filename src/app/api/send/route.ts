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

async function logAuth(
  apiKeyName: string,
  userId: string,
  username: string,
  success: boolean,
  error: string | null,
  remoteIp: string
) {
  try {
    await prisma.authenticationLog.create({
      data: {
        apiKeyName,
        userId,
        username,
        success,
        error,
        remoteIp,
        source: "API",
      },
    });
  } catch (e) {
    console.error("[API Auth] 记录认证日志失败:", e);
  }
}

function getRemoteIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function parseToArray(value: string | null | undefined): string[] | string {
  if (!value) return value || "";
  if (value.includes(",")) {
    return value.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return value;
}

async function parseRequestBody(request: NextRequest): Promise<SendEmailRequestBody> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const attachments: EmailAttachment[] = [];

    for (const [key, value] of formData.entries()) {
      if (key.trim() === "attachments" && value instanceof File) {
        const buffer = Buffer.from(await value.arrayBuffer());
        attachments.push({
          filename: value.name || "attachment",
          content: buffer.toString("base64"),
          encoding: "base64",
          contentType: value.type || "application/octet-stream",
        });
      }
    }

    const getString = (key: string): string => {
      const val = formData.get(key.trim());
      if (val === null || val === undefined) return "";
      if (typeof val === "string") return val.trim();
      if (val instanceof File) return "";
      return String(val).trim();
    };

    const allEntries: Record<string, unknown> = {};
    for (const [key, value] of formData.entries()) {
      const displayVal = value instanceof File ? `[File: ${value.name}]` : String(value);
      allEntries[key] = displayVal;
    }
    console.log("[API Send] All FormData entries:", JSON.stringify(allEntries, null, 2));

    const from = getString("from");
    const to = getString("to");
    const subject = getString("subject");
    const text = getString("text") || undefined;
    const html = getString("html") || undefined;
    const cc = getString("cc") || undefined;
    const bcc = getString("bcc") || undefined;

    console.log("[API Send] FormData parsed:", { from, to, subject, hasText: !!text, hasHtml: !!html, attachmentCount: attachments.length });

    return {
      from,
      to: to ? parseToArray(to) : "",
      subject,
      text: text || undefined,
      html: html || undefined,
      cc: cc ? parseToArray(cc) : undefined,
      bcc: bcc ? parseToArray(bcc) : undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
    };
  }

  try {
    return await request.json();
  } catch {
    throw new Error("请求体解析失败，请确保 Content-Type 为 application/json（JSON 格式）或 multipart/form-data（表单格式）");
  }
}

async function POST(
  request: NextRequest,
  context: { apiKey: { id: string; userId: string; name: string }; user: { id: string; email: string } }
) {
  const remoteIp = getRemoteIp(request);

  try {
    const body: SendEmailRequestBody = await parseRequestBody(request);
    const { from, to, subject, text, html, cc, bcc, attachments } = body;

    if (!from || !to || !subject) {
      await logAuth(context.apiKey.name, context.user.id, context.apiKey.name, false, "缺少必填字段：from, to, subject", remoteIp);
      return NextResponse.json(
        { error: "缺少必填字段：from, to, subject" },
        { status: 400 }
      );
    }

    if (!text && !html) {
      await logAuth(context.apiKey.name, context.user.id, context.apiKey.name, false, "邮件内容不能为空", remoteIp);
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
      await logAuth(context.apiKey.name, context.user.id, context.apiKey.name, false, permissionCheck.error || "权限检查失败", remoteIp);
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: 403 }
      );
    }

    const emailAccount = await prisma.emailAccount.findUnique({
      where: { id: permissionCheck.emailAccountId },
    });

    if (!emailAccount) {
      await logAuth(context.apiKey.name, context.user.id, context.apiKey.name, false, "邮箱账户不存在", remoteIp);
      return NextResponse.json(
        { error: "邮箱账户不存在" },
        { status: 404 }
      );
    }

    let decryptedPassword: string;
    try {
      decryptedPassword = decrypt(emailAccount.smtpPassword);
    } catch {
      await logAuth(context.apiKey.name, context.user.id, context.apiKey.name, false, "邮箱账户密码解密失败", remoteIp);
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

    await logAuth(context.apiKey.name, context.user.id, context.apiKey.name, result.success, result.error || null, remoteIp);

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
    const errorMessage = error instanceof Error ? error.message : "发送邮件时发生错误";
    const isParseError = errorMessage.includes("请求体解析失败");
    await logAuth(context.apiKey.name, context.user.id, context.apiKey.name, false, errorMessage, remoteIp);
    return NextResponse.json(
      { error: errorMessage },
      { status: isParseError ? 400 : 500 }
    );
  }
}

export const POST_handler = withApiKeyAuth(POST);
export { POST_handler as POST };