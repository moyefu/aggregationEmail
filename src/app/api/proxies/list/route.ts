import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/middleware/auth";

async function GET(request: NextRequest) {
  try {
    const user = (request as NextRequest & { user: { id: string } }).user;

    const proxies = await prisma.proxy.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        host: true,
        port: true,
        protocol: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ proxies });
  } catch (error) {
    console.error("获取代理列表错误:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

export const GET_handler = withAuth(GET);
export { GET_handler as GET };