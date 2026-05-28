import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuthParams } from "@/middleware/auth";
import { testProxyConnection, ProxyConfig } from "@/lib/proxy";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function postHandler(request: NextRequest, { params }: RouteParams) {
  try {
    const user = (request as NextRequest & { user: { id: string } }).user;
    const { id } = await params;

    const proxy = await prisma.proxy.findUnique({
      where: { id },
      select: {
        userId: true,
        host: true,
        port: true,
        username: true,
        password: true,
        protocol: true,
      },
    });

    if (!proxy) {
      return NextResponse.json(
        { error: "代理不存在" },
        { status: 404 }
      );
    }

    if (proxy.userId !== user.id) {
      return NextResponse.json(
        { error: "无权测试此代理" },
        { status: 403 }
      );
    }

    const proxyConfig: ProxyConfig = {
      host: proxy.host,
      port: proxy.port,
      username: proxy.username,
      password: proxy.password,
      protocol: proxy.protocol,
    };

    const result = await testProxyConnection(proxyConfig);

    return NextResponse.json(result);
  } catch (error) {
    console.error("测试代理错误:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

export const POST = withAuthParams(postHandler);