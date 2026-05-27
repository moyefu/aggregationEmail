import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth";
import { prisma } from "@/lib/prisma";
import { verifySmtpConnection } from "@/lib/smtp";
import { decrypt } from "@/lib/crypto";

async function POST(request: NextRequest) {
  try {
    const user = (request as NextRequest & { user: { id: string } }).user;

    const emailAccounts = await prisma.emailAccount.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        smtpHost: true,
        smtpPort: true,
        smtpUser: true,
        smtpPassword: true,
      },
    });

    if (emailAccounts.length === 0) {
      return NextResponse.json({
        total: 0,
        success: 0,
        failed: 0,
      });
    }

    let successCount = 0;
    let failedCount = 0;

    for (const account of emailAccounts) {
      try {
        const decryptedPassword = decrypt(account.smtpPassword);
        
        const result = await verifySmtpConnection({
          host: account.smtpHost,
          port: account.smtpPort,
          user: account.smtpUser,
          password: decryptedPassword,
        });

        await prisma.emailAccount.update({
          where: { id: account.id },
          data: { isVerified: result.success },
        });

        if (result.success) {
          successCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        console.error(`验证邮箱 ${account.smtpUser} 失败:`, error);
        await prisma.emailAccount.update({
          where: { id: account.id },
          data: { isVerified: false },
        });
        failedCount++;
      }
    }

    return NextResponse.json({
      total: emailAccounts.length,
      success: successCount,
      failed: failedCount,
    });
  } catch (error) {
    console.error("验证所有邮箱错误:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

export const POST_handler = withAuth(POST);
export { POST_handler as POST };
