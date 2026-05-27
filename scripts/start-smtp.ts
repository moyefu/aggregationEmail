/**
 * SMTP 服务器独立启动脚本
 * 
 * 本脚本用于独立启动 SMTP 服务器，不依赖 Web 服务。
 * 支持通过命令行 `npm run start:smtp` 运行。
 * 
 * @module scripts/start-smtp
 */

import * as dotenv from "dotenv";
import * as path from "path";

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import {
  startSmtpServer,
  stopSmtpServer,
  ParsedEmail,
  SmtpServerConfig,
} from "../src/lib/smtp-server";
import { processIncomingMail } from "../src/lib/smtp-mail-handler";
import { SMTPServerSession } from "smtp-server";

/** TLS 证书路径 */
const tlsCertPath = process.env.TLS_CERT_PATH;
/** TLS 密钥路径 */
const tlsKeyPath = process.env.TLS_KEY_PATH;

/** SMTP 服务器配置 */
const config: SmtpServerConfig = {
  port: parseInt(process.env.SMTP_PORT || "2525", 10),
  host: process.env.SMTP_HOST || "0.0.0.0",
  secure: false,
  authOptional: false,
  allowInsecureAuth: true,
  tlsOptions:
    tlsCertPath && tlsKeyPath
      ? {
          cert: tlsCertPath,
          key: tlsKeyPath,
        }
      : undefined,
};

/**
 * 处理接收到的邮件
 * 
 * 当 SMTP 服务器收到邮件时调用此函数。
 * 打印邮件信息并调用 processIncomingMail 进行处理。
 * 
 * @param email - 解析后的邮件对象
 * @param email.from - 发件人地址
 * @param email.to - 收件人地址列表
 * @param email.cc - 抄送地址列表
 * @param email.subject - 邮件主题
 * @param email.text - 纯文本正文
 * @param email.attachments - 附件列表
 * @param session - SMTP 会话对象
 * @throws {Error} 邮件处理失败时抛出错误
 */
async function handleMailReceived(email: ParsedEmail, session: SMTPServerSession): Promise<void> {
  console.log("\n========== 收到新邮件 ==========");
  console.log(`发件人: ${email.from}`);
  console.log(`收件人: ${email.to.join(", ")}`);
  if (email.cc?.length) {
    console.log(`抄送: ${email.cc.join(", ")}`);
  }
  console.log(`主题: ${email.subject || "(无主题)"}`);
  if (email.text) {
    console.log(`\n正文 (纯文本):\n${email.text.substring(0, 500)}${email.text.length > 500 ? "..." : ""}`);
  }
  if (email.attachments?.length) {
    console.log(`\n附件数量: ${email.attachments.length}`);
    email.attachments.forEach((att, i) => {
      console.log(`  ${i + 1}. ${att.filename || "未命名"} (${att.contentType})`);
    });
  }
  console.log("================================\n");

  const result = await processIncomingMail(email, session);

  if (result.success) {
    console.log("[SMTP] 邮件处理成功");
  } else {
    // 邮件处理失败，抛出错误让 smtp-server 捕获并返回给 SMTP 客户端
    console.error(`[SMTP] 邮件处理失败: ${result.error}`);
    const error = new Error(result.error || "邮件处理失败");
    // 设置响应码为 550（永久失败），让客户端知道这是业务错误而非临时错误
    (error as any).responseCode = 550;
    throw error;
  }
}

/**
 * 主函数 - 启动 SMTP 服务器
 * 
 * 初始化并启动 SMTP 服务器，监听配置的端口。
 * 服务器启动后将持续运行，直到收到终止信号。
 */
async function main(): Promise<void> {
  console.log("====================================");
  console.log("  SMTP 服务器启动中...");
  console.log("====================================\n");

  console.log("配置信息:");
  console.log(`  端口: ${config.port}`);
  console.log(`  主机: ${config.host}`);
  console.log(`  TLS: ${config.tlsOptions ? "已配置" : "未配置"}`);
  console.log(`  认证: ${config.authOptional ? "可选" : "必需"}`);
  console.log("");

  try {
    await startSmtpServer(config, {
      onMailReceived: handleMailReceived,
      onError: (error) => {
        console.error("[SMTP Error]", error.message);
      },
    });

    console.log("SMTP 服务器已启动，按 Ctrl+C 停止\n");
    console.log("使用说明:");
    console.log("  1. 用户名：填写您绑定的邮箱地址");
    console.log("  2. 密码：填写您的 API 密钥 (ea_live_xxx)");
    console.log("  3. MAIL FROM 地址可以是您绑定的任意邮箱地址");
    console.log("");

    // 保持进程运行
    await new Promise(() => {});
  } catch (error) {
    console.error("SMTP 服务器启动失败:", error);
    process.exit(1);
  }
}

/**
 * 处理 SIGINT 信号 (Ctrl+C)
 * 优雅关闭 SMTP 服务器
 */
process.on("SIGINT", async () => {
  console.log("\n正在关闭 SMTP 服务器...");
  await stopSmtpServer();
  process.exit(0);
});

/**
 * 处理 SIGTERM 信号
 * 优雅关闭 SMTP 服务器
 */
process.on("SIGTERM", async () => {
  console.log("\n正在关闭 SMTP 服务器...");
  await stopSmtpServer();
  process.exit(0);
});

// 启动服务器
main();
