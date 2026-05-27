/**
 * Prisma 客户端模块
 * 
 * 提供全局单例的 Prisma 客户端实例。
 * 在开发环境下避免热重载时创建多个连接。
 * 
 * @module lib/prisma
 * 
 * @example
 * ```typescript
 * import { prisma } from '@/lib/prisma';
 * 
 * const users = await prisma.user.findMany();
 * ```
 */

import { PrismaClient } from "@prisma/client";

/**
 * 全局 Prisma 客户端类型声明
 * 
 * 用于在开发环境下保持 Prisma 客户端实例的唯一性，
 * 避免热重载时创建过多的数据库连接。
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Prisma 客户端实例
 * 
 * 使用单例模式，确保整个应用只创建一个数据库连接。
 * 在开发环境下，将实例保存到 globalThis 以支持热重载。
 */
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// 在开发环境下保存实例到 globalThis，避免热重载时重复创建
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
