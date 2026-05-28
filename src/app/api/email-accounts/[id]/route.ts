import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuthParams } from "@/middleware/auth";
import { verifySmtpConnection, isValidEmail } from "@/lib/smtp";
import { encrypt } from "@/lib/crypto";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function deleteHandler(request: NextRequest, { params }: RouteParams) {
  try {
    const user = (request as NextRequest & { user: { id: string } }).user;
    const { id } = await params;

    const emailAccount = await prisma.emailAccount.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!emailAccount) {
      return NextResponse.json(
        { error: "邮箱账户不存在" },
        { status: 404 }
      );
    }

    if (emailAccount.userId !== user.id) {
      return NextResponse.json(
        { error: "无权删除此邮箱账户" },
        { status: 403 }
      );
    }

    await prisma.emailAccount.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "邮箱账户删除成功",
    });
  } catch (error) {
    console.error("删除邮箱账户错误:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

async function putHandler(request: NextRequest, { params }: RouteParams) {
  try {
    const user = (request as NextRequest & { user: { id: string } }).user;
    const { id } = await params;
    const body = await request.json();
    const { smtpHost, smtpPort, smtpUser, smtpPassword, fromEmail, fromName, proxyId } = body;

    const emailAccount = await prisma.emailAccount.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!emailAccount) {
      return NextResponse.json(
        { error: "邮箱账户不存在" },
        { status: 404 }
      );
    }

    if (emailAccount.userId !== user.id) {
      return NextResponse.json(
        { error: "无权修改此邮箱账户" },
        { status: 403 }
      );
    }

    if (!smtpHost || !smtpPort || !smtpUser || !fromEmail) {
      return NextResponse.json(
        { error: "缺少必填字段" },
        { status: 400 }
      );
    }

    if (!isValidEmail(fromEmail)) {
      return NextResponse.json(
        { error: "发件人邮箱格式不正确" },
        { status: 400 }
      );
    }

    const port = parseInt(smtpPort, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      return NextResponse.json(
        { error: "端口号必须是 1-65535 之间的有效数字" },
        { status: 400 }
      );
    }

    const selfSmtpPort = parseInt(process.env.SMTP_PORT || "2525", 10);
    const selfSmtpHost = process.env.SMTP_HOST || "0.0.0.0";
    const isSelfSmtpServer =
      port === selfSmtpPort &&
      (smtpHost === "localhost" ||
        smtpHost === "127.0.0.1" ||
        smtpHost === selfSmtpHost ||
        smtpHost === "0.0.0.0");

    if (isSelfSmtpServer) {
      return NextResponse.json(
        { error: "不能将本服务的 SMTP 服务器作为发件服务器，这会导致循环请求" },
        { status: 400 }
      );
    }

    if (smtpPassword && smtpPassword.trim()) {
      const userApiKeys = await prisma.apiKey.findMany({
        where: { userId: user.id },
        select: { key: true },
      });

      const isApiKey = userApiKeys.some((apiKey) => apiKey.key === smtpPassword);
      if (isApiKey) {
        return NextResponse.json(
          { error: "不能使用本服务的 API Key 作为 SMTP 密码，这会导致循环请求" },
          { status: 400 }
        );
      }
    }

    if (proxyId) {
      const proxy = await prisma.proxy.findUnique({
        where: { id: proxyId },
        select: { userId: true },
      });

      if (!proxy || proxy.userId !== user.id) {
        return NextResponse.json(
          { error: "代理不存在或无权使用" },
          { status: 400 }
        );
      }
    }

    const updateData: {
      smtpHost: string;
      smtpPort: number;
      smtpUser: string;
      fromEmail: string;
      fromName: string | null;
      proxyId: string | null;
      smtpPassword?: string;
      isVerified?: boolean;
    } = {
      smtpHost,
      smtpPort: port,
      smtpUser,
      fromEmail,
      fromName: fromName || null,
      proxyId: proxyId || null,
    };

    if (smtpPassword && smtpPassword.trim()) {
      const verifyResult = await verifySmtpConnection({
        host: smtpHost,
        port,
        user: smtpUser,
        password: smtpPassword,
      });

      if (!verifyResult.success) {
        return NextResponse.json(
          { error: `SMTP 验证失败: ${verifyResult.error}` },
          { status: 400 }
        );
      }

      updateData.smtpPassword = encrypt(smtpPassword);
      updateData.isVerified = true;
    }

    const updated = await prisma.emailAccount.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        smtpHost: true,
        smtpPort: true,
        smtpUser: true,
        fromEmail: true,
        fromName: true,
        proxyId: true,
        proxy: {
          select: {
            id: true,
            name: true,
            host: true,
            port: true,
            protocol: true,
          },
        },
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "邮箱账户更新成功",
      emailAccount: updated,
    });
  } catch (error) {
    console.error("更新邮箱账户错误:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

export const DELETE = withAuthParams(deleteHandler);
export const PUT = withAuthParams(putHandler);
