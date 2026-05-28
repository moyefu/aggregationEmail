import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/middleware/auth";
import { testProxyConnection } from "@/lib/proxy";

async function POST(request: NextRequest) {
  try {
    const user = (request as NextRequest & { user: { id: string } }).user;
    const body = await request.json();
    const { name, host, port, username, password, protocol } = body;

    if (!name || !host || !port) {
      return NextResponse.json(
        { error: "缺少必填字段：名称、主机、端口" },
        { status: 400 }
      );
    }

    const portNum = parseInt(port, 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      return NextResponse.json(
        { error: "端口号必须是 1-65535 之间的有效数字" },
        { status: 400 }
      );
    }

    const validProtocols = ["HTTP", "HTTPS", "SOCKS5"];
    const proxyProtocol = protocol?.toUpperCase() || "HTTP";
    if (!validProtocols.includes(proxyProtocol)) {
      return NextResponse.json(
        { error: "协议类型必须是 HTTP、HTTPS 或 SOCKS5" },
        { status: 400 }
      );
    }

    const existingProxy = await prisma.proxy.findFirst({
      where: {
        userId: user.id,
        name,
      },
    });

    if (existingProxy) {
      return NextResponse.json(
        { error: "该代理名称已存在" },
        { status: 400 }
      );
    }

    const proxy = await prisma.proxy.create({
      data: {
        userId: user.id,
        name,
        host,
        port: portNum,
        username: username || null,
        password: password || null,
        protocol: proxyProtocol,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        host: true,
        port: true,
        username: true,
        protocol: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      message: "代理添加成功",
      proxy,
    });
  } catch (error) {
    console.error("添加代理错误:", error);
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

    const [proxies, total] = await Promise.all([
      prisma.proxy.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          name: true,
          host: true,
          port: true,
          username: true,
          protocol: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.proxy.count({
        where: { userId: user.id },
      }),
    ]);

    return NextResponse.json({
      proxies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("获取代理列表错误:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

export const POST_handler = withAuth(POST);
export const GET_handler = withAuth(GET);

export { POST_handler as POST, GET_handler as GET };