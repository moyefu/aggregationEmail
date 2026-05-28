import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/middleware/auth";
import { verifySmtpConnection, isValidEmail } from "@/lib/smtp";
import { encrypt } from "@/lib/crypto";

async function POST(request: NextRequest) {
  try {
    const user = (request as NextRequest & { user: { id: string } }).user;
    const body = await request.json();
    const { smtpHost, smtpPort, smtpUser, smtpPassword, fromEmail, fromName, proxyId } = body;

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword || !fromEmail) {
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

    const [currentCount, userWithLevel] = await Promise.all([
      prisma.emailAccount.count({ where: { userId: user.id } }),
      prisma.user.findUnique({
        where: { id: user.id },
        select: { level: { select: { maxEmailAccounts: true } } },
      }),
    ]);

    const maxEmailAccounts = userWithLevel?.level?.maxEmailAccounts ?? 5;

    if (currentCount >= maxEmailAccounts) {
      return NextResponse.json(
        { error: `您已达到邮箱数量上限（${maxEmailAccounts}个），请升级等级或删除不需要的邮箱` },
        { status: 400 }
      );
    }

    const existingAccount = await prisma.emailAccount.findFirst({
      where: {
        userId: user.id,
        fromEmail,
      },
    });

    if (existingAccount) {
      return NextResponse.json(
        { error: "该邮箱地址已添加，请勿重复添加" },
        { status: 400 }
      );
    }

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

    const encryptedPassword = encrypt(smtpPassword);

    const emailAccount = await prisma.emailAccount.create({
      data: {
        userId: user.id,
        smtpHost,
        smtpPort: port,
        smtpUser,
        smtpPassword: encryptedPassword,
        fromEmail,
        fromName: fromName || null,
        proxyId: proxyId || null,
        isVerified: true,
      },
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
      },
    });

    return NextResponse.json({
      message: "邮箱账户添加成功",
      emailAccount,
    });
  } catch (error) {
    console.error("添加邮箱账户错误:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

async function GET(request: NextRequest) {
  try {
    const user = (request as NextRequest & { user: { id: string } }).user;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const [emailAccounts, total, userWithLevel] = await Promise.all([
      prisma.emailAccount.findMany({
        where: { userId: user.id },
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
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.emailAccount.count({
        where: { userId: user.id },
      }),
      prisma.user.findUnique({
        where: { id: user.id },
        select: { level: { select: { maxEmailAccounts: true } } },
      }),
    ]);

    const maxEmailAccounts = userWithLevel?.level?.maxEmailAccounts ?? 5;

    return NextResponse.json({
      accounts: emailAccounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      emailLimit: {
        current: total,
        max: maxEmailAccounts,
      },
    });
  } catch (error) {
    console.error("获取邮箱列表错误:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

export const POST_handler = withAuth(POST);
export const GET_handler = withAuth(GET);

export { POST_handler as POST, GET_handler as GET };
