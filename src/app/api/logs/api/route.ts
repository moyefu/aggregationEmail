import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/middleware/auth";

async function GET(request: NextRequest) {
  try {
    const user = (request as NextRequest & { user: { id: string } }).user;

    const logs = await prisma.authenticationLog.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        username: true,
        success: true,
        error: true,
        remoteIp: true,
        source: true,
        apiKeyName: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("获取 API 调用日志错误:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

export const GET_handler = withAuth(GET);

export { GET_handler as GET };