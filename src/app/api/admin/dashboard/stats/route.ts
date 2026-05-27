import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/middleware/adminAuth";
import { prisma } from "@/lib/prisma";

async function getStats(request: NextRequest) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [userCount, emailAccountCount, apiKeyCount, emailLogCount] = await Promise.all([
    prisma.user.count(),
    prisma.emailAccount.count(),
    prisma.apiKey.count(),
    prisma.emailLog.count(),
  ]);

  const emailLogsByDay = await prisma.emailLog.groupBy({
    by: ["createdAt"],
    where: {
      createdAt: {
        gte: sevenDaysAgo,
      },
    },
    _count: true,
  });

  const usersByDay = await prisma.user.groupBy({
    by: ["createdAt"],
    where: {
      createdAt: {
        gte: sevenDaysAgo,
      },
    },
    _count: true,
  });

  const dailyEmailStats = getDailyStats(emailLogsByDay, sevenDaysAgo, now);
  const dailyUserStats = getDailyStats(usersByDay, sevenDaysAgo, now);

  return NextResponse.json({
    userCount,
    emailAccountCount,
    apiKeyCount,
    emailLogCount,
    dailyEmailStats,
    dailyUserStats,
  });
}

function getDailyStats(
  data: { createdAt: Date; _count: number }[],
  startDate: Date,
  endDate: Date
): { date: string; count: number }[] {
  const dayMap = new Map<string, number>();

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    dayMap.set(dateStr, 0);
  }

  for (const item of data) {
    const dateStr = item.createdAt.toISOString().split("T")[0];
    if (dayMap.has(dateStr)) {
      dayMap.set(dateStr, (dayMap.get(dateStr) || 0) + item._count);
    }
  }

  return Array.from(dayMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export const GET = withAdminAuth(getStats);
