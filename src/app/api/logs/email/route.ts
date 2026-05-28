import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/middleware/auth";

async function GET(request: NextRequest) {
  try {
    const user = (request as NextRequest & { user: { id: string } }).user;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const emailAccountId = searchParams.get("emailAccountId");
    const status = searchParams.get("status");

    const where: {
      userId: string;
      createdAt?: { gte?: Date; lte?: Date };
      emailAccountId?: string;
      status?: string;
    } = {
      userId: user.id,
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    if (emailAccountId) {
      where.emailAccountId = emailAccountId;
    }

    if (status) {
      where.status = status.toUpperCase();
    }

    const [logs, total] = await Promise.all([
      prisma.emailLog.findMany({
        where,
        select: {
          id: true,
          to: true,
          subject: true,
          status: true,
          error: true,
          source: true,
          createdAt: true,
          emailAccount: {
            select: {
              fromEmail: true,
              fromName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.emailLog.count({ where }),
    ]);

    const normalizedLogs = logs.map((log) => ({
      ...log,
      status: log.status.toUpperCase(),
    }));

    return NextResponse.json({
      logs: normalizedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("获取邮件日志错误:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

export const GET_handler = withAuth(GET);

export { GET_handler as GET };