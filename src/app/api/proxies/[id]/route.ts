import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuthParams } from "@/middleware/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function deleteHandler(request: NextRequest, { params }: RouteParams) {
  try {
    const user = (request as NextRequest & { user: { id: string } }).user;
    const { id } = await params;

    const proxy = await prisma.proxy.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!proxy) {
      return NextResponse.json(
        { error: "代理不存在" },
        { status: 404 }
      );
    }

    if (proxy.userId !== user.id) {
      return NextResponse.json(
        { error: "无权删除此代理" },
        { status: 403 }
      );
    }

    await prisma.proxy.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "代理删除成功",
    });
  } catch (error) {
    console.error("删除代理错误:", error);
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
    const { name, host, port, username, password, protocol, isActive } = body;

    const proxy = await prisma.proxy.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!proxy) {
      return NextResponse.json(
        { error: "代理不存在" },
        { status: 404 }
      );
    }

    if (proxy.userId !== user.id) {
      return NextResponse.json(
        { error: "无权修改此代理" },
        { status: 403 }
      );
    }

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
        id: { not: id },
      },
    });

    if (existingProxy) {
      return NextResponse.json(
        { error: "该代理名称已存在" },
        { status: 400 }
      );
    }

    const updated = await prisma.proxy.update({
      where: { id },
      data: {
        name,
        host,
        port: portNum,
        username: username || null,
        password: password || null,
        protocol: proxyProtocol,
        isActive: isActive !== undefined ? isActive : true,
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
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "代理更新成功",
      proxy: updated,
    });
  } catch (error) {
    console.error("更新代理错误:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

export const DELETE = withAuthParams(deleteHandler);
export const PUT = withAuthParams(putHandler);