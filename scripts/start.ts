/**
 * 邮件聚合服务统一启动脚本
 * 
 * 本脚本用于统一启动所有服务：
 * 1. 同步数据库结构
 * 2. 启动 SMTP 服务器
 * 3. 启动 Web 服务器
 * 
 * 支持通过命令行 `npm start` 运行。
 * 
 * @module scripts/start
 */

import * as dotenv from "dotenv";
import * as path from "path";
import { spawn, ChildProcess } from "child_process";
import * as fs from "fs";

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, "../.env") });

/** 是否为 Windows 系统 */
const isWindows = process.platform === "win32";

/** SMTP 服务进程 */
let smtpProcess: ChildProcess | null = null;

/** Web 服务进程 */
let webProcess: ChildProcess | null = null;

/**
 * 输出带时间戳和前缀的日志
 * 
 * @param prefix - 日志前缀，用于标识日志来源
 * @param message - 日志消息内容
 */
function log(prefix: string, message: string): void {
  const timestamp = new Date().toLocaleTimeString("zh-CN", { hour12: false });
  console.log(`[${timestamp}] [${prefix}] ${message}`);
}

/**
 * 执行 shell 命令
 * 
 * @param command - 要执行的命令
 * @param args - 命令参数列表
 * @returns Promise，成功时返回退出码，失败时抛出错误
 */
function runCommand(command: string, args: string[] = []): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: path.resolve(__dirname, ".."),
      shell: true,
      stdio: "inherit",
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`命令执行失败，退出码: ${code}`));
      }
    });

    child.on("error", (error) => {
      reject(error);
    });
  });
}

/**
 * 根据 DATABASE_URL 检测数据库类型
 * 
 * @param databaseUrl - 数据库连接字符串
 * @returns 数据库 provider 类型
 */
function detectDatabaseProvider(databaseUrl: string): string {
  if (databaseUrl.startsWith("file:")) {
    return "sqlite";
  }
  if (databaseUrl.startsWith("mysql://")) {
    return "mysql";
  }
  if (databaseUrl.startsWith("postgresql://") || databaseUrl.startsWith("postgres://")) {
    return "postgresql";
  }
  return "sqlite";
}

/**
 * 更新 schema.prisma 中的数据库 provider
 * 
 * 根据 DATABASE_URL 自动设置正确的数据库类型，
 * 同时调整数据库特定字段类型以兼容不同数据库。
 * 
 * @param provider - 数据库 provider 类型
 */
function updateSchemaProvider(provider: string): void {
  const schemaPath = path.resolve(__dirname, "../prisma/schema.prisma");
  const schemaContent = fs.readFileSync(schemaPath, "utf-8");
  
  const providerRegex = /provider\s*=\s*"(\w+)"/;
  const currentProvider = schemaContent.match(providerRegex)?.[1];
  
  if (currentProvider !== provider) {
    log("Database", `检测到数据库类型变更: ${currentProvider} -> ${provider}`);
    
    let updatedContent = schemaContent.replace(
      providerRegex,
      `provider = "${provider}"`
    );

    // 处理数据库特定字段类型
    if (provider === "sqlite") {
      // SQLite 不支持 @db.VarChar，移除所有数据库特定类型
      updatedContent = updatedContent.replace(/\s*@db\.\w+(\((\d+)?\))?/g, "");
    } else if (provider === "mysql") {
      // MySQL String 默认只有 191，需要为长字段添加 @db.Text 或 @db.VarChar
      // smtpPassword 字段需要更长长度
      if (!updatedContent.includes("smtpPassword String     @db")) {
        updatedContent = updatedContent.replace(
          /smtpPassword String/,
          "smtpPassword String     @db.Text"
        );
      }
    } else if (provider === "postgresql") {
      // PostgreSQL 使用 @db.Text
      updatedContent = updatedContent.replace(/\s*@db\.\w+\(\d+\)/g, "");
      if (!updatedContent.includes("smtpPassword String     @db")) {
        updatedContent = updatedContent.replace(
          /smtpPassword String/,
          "smtpPassword String     @db.Text"
        );
      }
    }
    
    fs.writeFileSync(schemaPath, updatedContent, "utf-8");
    log("Database", "schema.prisma 已更新");
  }
}

/**
 * 同步数据库结构
 * 
 * 根据 DATABASE_URL 自动识别数据库类型并更新 schema.prisma，
 * 然后执行 prisma db push 同步结构。
 */
async function syncDatabase(): Promise<void> {
  log("Database", "检查数据库状态...");

  const databaseUrl = process.env.DATABASE_URL || "file:./dev.db";
  const provider = detectDatabaseProvider(databaseUrl);
  
  log("Database", `数据库类型: ${provider}`);
  
  // 自动更新 schema.prisma 中的 provider
  updateSchemaProvider(provider);

  try {
    // 先重新生成 Prisma Client，确保与数据库类型匹配
    log("Database", "正在生成 Prisma Client...");
    await runCommand("npx", ["prisma", "generate"]);
    log("Database", "Prisma Client 生成完成");

    // 同步数据库结构
    await runCommand("npx", ["prisma", "db", "push", "--skip-generate"]);
    log("Database", "数据库同步完成");
  } catch (error) {
    log("Database", `数据库同步失败: ${error instanceof Error ? error.message : error}`);
    throw error;
  }
}

/**
 * 初始化默认用户等级
 * 
 * 确保数据库中存在 id=1 的默认用户等级，
 * 用于新用户注册时的默认等级关联。
 * 
 * 使用动态导入确保使用最新生成的 Prisma Client。
 */
async function initDefaultLevel(): Promise<void> {
  log("Database", "正在初始化默认用户等级...");

  // 动态导入 PrismaClient，确保使用最新生成的版本
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    const defaultLevel = await prisma.userLevel.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: "普通用户",
        maxEmailAccounts: 5,
      },
    });

    log("Database", `默认等级已就绪: ${defaultLevel.name} (邮箱上限: ${defaultLevel.maxEmailAccounts})`);
  } catch (error) {
    log("Database", `初始化默认等级失败: ${error instanceof Error ? error.message : error}`);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * 启动 SMTP 服务器
 * 
 * 创建子进程运行 SMTP 服务器脚本。
 * 监听标准输出，在服务器启动成功后 resolve。
 * 
 * @returns Promise，服务器启动成功时 resolve，失败时 reject
 */
async function startSmtpServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    log("SMTP", "正在启动 SMTP 服务器...");

    const scriptPath = path.resolve(__dirname, "start-smtp.ts");
    
    smtpProcess = spawn("npx", ["tsx", scriptPath], {
      cwd: path.resolve(__dirname, ".."),
      shell: true,
      stdio: "pipe",
      env: { ...process.env },
    });

    let resolved = false;

    smtpProcess.stdout?.on("data", (data: Buffer) => {
      const output = data.toString();
      console.log(output.trimEnd());

      if (!resolved && output.includes("SMTP 服务器已启动")) {
        resolved = true;
        resolve();
      }
    });

    smtpProcess.stderr?.on("data", (data: Buffer) => {
      console.error(data.toString().trimEnd());
    });

    smtpProcess.on("error", (error) => {
      log("SMTP", `启动失败: ${error.message}`);
      if (!resolved) {
        reject(error);
      }
    });

    smtpProcess.on("close", (code) => {
      if (code !== 0 && !resolved) {
        reject(new Error(`SMTP 服务器异常退出，退出码: ${code}`));
      }
    });

    // 超时保护，5秒后自动认为启动成功
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    }, 5000);
  });
}

/**
 * 启动 Web 服务器
 * 
 * 创建子进程运行 Next.js 服务器。
 * 根据环境变量决定使用开发模式还是生产模式。
 * 
 * @returns Promise，服务器启动成功时 resolve，失败时 reject
 */
async function startWebServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    log("Web", "正在启动 Web 服务器...");

    const isDev = process.env.NODE_ENV !== "production";
    const command = isDev ? "next dev" : "next start";

    webProcess = spawn("npx", command.split(" "), {
      cwd: path.resolve(__dirname, ".."),
      shell: true,
      stdio: "pipe",
      env: { ...process.env },
    });

    let resolved = false;

    webProcess.stdout?.on("data", (data: Buffer) => {
      const output = data.toString();
      console.log(output.trimEnd());

      if (!resolved && (output.includes("Ready") || output.includes("Local:"))) {
        resolved = true;
        resolve();
      }
    });

    webProcess.stderr?.on("data", (data: Buffer) => {
      console.error(data.toString().trimEnd());
    });

    webProcess.on("error", (error) => {
      log("Web", `启动失败: ${error.message}`);
      if (!resolved) {
        reject(error);
      }
    });

    webProcess.on("close", (code) => {
      if (code !== 0 && !resolved) {
        reject(new Error(`Web 服务器异常退出，退出码: ${code}`));
      }
    });

    // 超时保护，10秒后自动认为启动成功
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    }, 10000);
  });
}

/**
 * 清理函数 - 关闭所有服务
 * 
 * 在收到终止信号时调用，优雅关闭 SMTP 和 Web 服务器。
 */
function cleanup(): void {
  log("System", "正在关闭所有服务...");

  if (smtpProcess) {
    smtpProcess.kill();
    log("SMTP", "SMTP 服务器已停止");
  }

  if (webProcess) {
    webProcess.kill();
    log("Web", "Web 服务器已停止");
  }

  process.exit(0);
}

/**
 * 主函数 - 启动所有服务
 * 
 * 按顺序执行：
 * 1. 同步数据库
 * 2. 初始化默认用户等级
 * 3. 启动 SMTP 服务器
 * 4. 启动 Web 服务器
 * 
 * 注册信号处理器以支持优雅关闭。
 */
async function main(): Promise<void> {
  console.log("");
  console.log("====================================");
  console.log("  邮件聚合服务启动器");
  console.log("====================================");
  console.log("");

  // 注册信号处理器
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  try {
    // 步骤 1: 同步数据库
    await syncDatabase();

    // 步骤 2: 初始化默认用户等级
    await initDefaultLevel();

    console.log("");
    console.log("------------------------------------");
    console.log("");

    // 步骤 3: 启动 SMTP 服务器
    await startSmtpServer();

    console.log("");
    console.log("------------------------------------");
    console.log("");

    // 步骤 4: 启动 Web 服务器
    await startWebServer();

    console.log("");
    console.log("====================================");
    console.log("  所有服务已启动");
    console.log("====================================");
    console.log("");
    console.log("服务状态:");
    console.log(`  - SMTP 服务器: 运行中 (端口 ${process.env.SMTP_PORT || 2525})`);
    console.log(`  - Web 服务器: 运行中 (端口 ${process.env.PORT || 3000})`);
    console.log("");
    console.log("按 Ctrl+C 停止所有服务");
    console.log("");

  } catch (error) {
    console.error("");
    console.error("启动失败:", error instanceof Error ? error.message : error);
    cleanup();
    process.exit(1);
  }
}

// 启动服务
main();
