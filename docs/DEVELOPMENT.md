# 开发文档

## 项目概述

**aggregation-email** 是一个邮件聚合发送平台，提供统一的 API 接口来管理多个 SMTP 邮箱账户，并通过 API 密钥认证实现安全的邮件发送服务。

### 核心功能

- 用户注册与登录认证
- 邮箱验证码注册流程
- 忘记密码/重置密码功能
- 多邮箱账户管理（支持绑定多个 SMTP 邮箱）
- API 密钥管理（支持全权访问和指定邮箱访问）
- API Key 数量限制
- 邮箱唯一性检查
- 循环请求检测
- 用户登录记录（IP、User-Agent）
- 管理员创建用户
- 通过 API 发送邮件（支持 HTML、附件、抄送等）
- 通过 SMTP 协议发送邮件（支持标准 SMTP 客户端）
- 邮件发送日志记录

---

## 技术栈说明

### 前端技术

| 技术 | 版本 | 说明 |
|------|------|------|
| Next.js | 16.x | React 全栈框架，支持 SSR 和 API Routes |
| React | 19.x | 用户界面构建库 |
| Tailwind CSS | 4.x | 原子化 CSS 框架 |
| TypeScript | 5.x | JavaScript 类型超集 |

### 后端技术

| 技术 | 版本 | 说明 |
|------|------|------|
| Next.js API Routes | - | 服务端 API 实现 |
| Prisma | 5.x | ORM 数据库工具 |
| SQLite | - | 开发环境数据库 |
| JWT | 9.x | 用户认证令牌 |
| bcryptjs | 3.x | 密码加密 |
| Nodemailer | 8.x | 邮件发送库 |

### 开发工具

| 工具 | 说明 |
|------|------|
| ESLint | 代码质量检查 |
| Prettier | 代码格式化 |

---

## 项目架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        客户端 (Browser)                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Next.js 应用 (全栈)                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    前端页面 (React)                    │   │
│  │    /login  /register  /email-accounts  /api-keys    │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                              │
│                              ▼                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  API Routes (后端)                    │   │
│  │    /api/auth/*  /api/email-accounts/*  /api/send    │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                              │
│                              ▼                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   服务层 (Lib)                        │   │
│  │      prisma.ts  email.ts  crypto.ts  smtp.ts        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    数据层 (SQLite/PostgreSQL)                 │
│              User  EmailAccount  ApiKey  EmailLog            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    外部服务 (SMTP 服务器)                      │
│              Gmail  QQ邮箱  163邮箱  企业邮箱等               │
└─────────────────────────────────────────────────────────────┘
```

### SMTP 服务器架构

除了 HTTP API 方式外，项目还提供了独立的 SMTP 服务器，允许用户通过标准 SMTP 协议发送邮件。

```
┌─────────────────────────────────────────────────────────────┐
│                     SMTP 客户端                              │
│          (Python smtplib / Node.js nodemailer / 等)         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   SMTP 服务器 (独立进程)                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   SMTP 协议处理                        │   │
│  │      EHLO  AUTH  MAIL FROM  RCPT TO  DATA  QUIT     │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                              │
│                              ▼                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   API 密钥认证                         │   │
│  │    用户名: API 密钥名称或密钥值                         │   │
│  │    密码: API 密钥值                                    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    数据层 (SQLite/PostgreSQL)                 │
│              验证 API 密钥 → 获取邮箱账户配置                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    外部 SMTP 服务                             │
│              实际发送邮件到目标邮箱                            │
└─────────────────────────────────────────────────────────────┘
```

#### SMTP 服务独立运行

SMTP 服务器作为独立进程运行，与 Web 应用分离：

```bash
# 启动 SMTP 服务器
npm run start:smtp

# 开发模式启动 SMTP 服务器
npm run dev:smtp
```

#### SMTP 端口配置

通过环境变量配置 SMTP 服务器：

| 环境变量 | 说明 | 默认值 |
|---------|------|--------|
| SMTP_PORT | SMTP 服务器监听端口 | 2525 |
| SMTP_HOST | SMTP 服务器绑定地址 | 0.0.0.0 |
| TLS_CERT_PATH | TLS 证书路径（可选） | - |
| TLS_KEY_PATH | TLS 私钥路径（可选） | - |

#### 环境变量配置示例

```env
# SMTP 服务器配置
SMTP_PORT=2525
SMTP_HOST=0.0.0.0

# TLS 配置（生产环境推荐）
TLS_CERT_PATH=/path/to/cert.pem
TLS_KEY_PATH=/path/to/key.pem
```

---

### 认证机制

项目采用双重认证机制：

1. **JWT 认证**：用于 Web 界面用户登录
   - 用户登录后获取 JWT Token
   - Token 存储在 Cookie 或 Authorization Header
   - 有效期默认 7 天

2. **API Key 认证**：用于 API 调用
   - 用户创建 API 密钥后获取 `ea_live_xxx` 格式的密钥
   - 通过 `Authorization: Bearer ea_live_xxx` 请求头认证
   - 支持权限范围控制（全部邮箱 / 指定邮箱）

3. **SMTP AUTH 认证**：用于 SMTP 协议
   - 使用 API 密钥作为认证凭据
   - 支持两种认证方式：
     - 方式一：用户名和密码都使用 API 密钥值
     - 方式二：用户名=API密钥名称，密码=API密钥值

### API 设计原则

- RESTful 风格设计
- 统一的 JSON 响应格式
- 清晰的错误码和错误信息
- 分页查询支持

---

## 目录结构说明

```
aggregation-email/
├── prisma/                    # 数据库相关
│   ├── schema.prisma          # Prisma 模型定义
│   └── dev.db                 # SQLite 开发数据库
├── public/                    # 静态资源
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/               # API 路由
│   │   │   ├── api-keys/      # API 密钥管理
│   │   │   │   ├── route.ts   # 列表/创建
│   │   │   │   └── [id]/      # 查询/删除
│   │   │   ├── auth/          # 认证相关
│   │   │   │   ├── login/     # 登录
│   │   │   │   ├── logout/    # 登出
│   │   │   │   ├── register/  # 注册
│   │   │   │   ├── send-code/    # 发送验证码 API
│   │   │   │   ├── forgot-password/  # 忘记密码 API
│   │   │   │   └── reset-password/   # 重置密码 API
│   │   │   ├── email-accounts/# 邮箱账户管理
│   │   │   │   ├── route.ts   # 列表/添加
│   │   │   │   └── [id]/      # 删除
│   │   │   └── send/          # 发送邮件
│   │   ├── api-keys/          # API 密钥管理页面
│   │   ├── email-accounts/    # 邮箱管理页面
│   │   ├── login/             # 登录页面
│   │   ├── register/          # 注册页面
│   │   ├── forgot-password/   # 忘记密码页面
│   │   ├── reset-password/    # 重置密码页面
│   │   ├── send-test/         # 发送测试页面
│   │   ├── globals.css        # 全局样式
│   │   ├── layout.tsx         # 根布局
│   │   └── page.tsx           # 首页
│   ├── components/            # React 组件
│   │   ├── api-keys/          # API 密钥相关组件
│   │   ├── auth/              # 认证相关组件
│   │   ├── email-accounts/    # 邮箱管理组件
│   │   ├── layout/            # 布局组件
│   │   │   └── Footer.tsx     # 统一页脚组件
│   │   └── send-test/         # 发送测试组件
│   ├── lib/                   # 工具库
│   │   ├── crypto.ts          # 加密工具
│   │   ├── email.ts           # 邮件发送
│   │   ├── prisma.ts          # 数据库客户端
│   │   ├── smtp.ts            # SMTP 验证
│   │   └── site-smtp.ts       # 站点 SMTP 发信服务（验证码、密码重置）
│   ├── middleware/            # 中间件
│   │   ├── apiKeyAuth.ts      # API Key 认证
│   │   └── auth.ts            # JWT 认证
│   └── types/                 # 类型定义
│       └── index.ts
├── .env                       # 环境变量（本地）
├── .env.example               # 环境变量示例
├── .gitignore                 # Git 忽略配置
├── eslint.config.mjs          # ESLint 配置
├── next.config.ts             # Next.js 配置
├── package.json               # 项目依赖
├── postcss.config.mjs         # PostCSS 配置
├── tailwind.config.ts         # Tailwind 配置
└── tsconfig.json              # TypeScript 配置
```

---

## 服务层 (Lib)

### site-smtp.ts - 站点 SMTP 发信服务

用于发送系统邮件（验证码、密码重置）：

| 函数 | 说明 |
|------|------|
| sendVerificationCode() | 发送验证码邮件 |
| sendPasswordResetEmail() | 发送密码重置邮件 |
| sendEmail() | 通用邮件发送 |
| isSiteSmtpConfigured() | 检查 SMTP 是否配置 |

---

## 开发环境搭建步骤

### 环境要求

- Node.js 18.x 或更高版本
- npm 9.x 或更高版本（或 yarn/pnpm）
- Git

### 安装步骤

1. **克隆项目**

```bash
git clone <repository-url>
cd aggregation-email
```

2. **安装依赖**

```bash
npm install
```

3. **配置环境变量**

复制环境变量示例文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置以下变量：

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
ENCRYPTION_KEY="your-32-character-encryption-k"
```

> 注意：
> - `JWT_SECRET` 应该是一个足够复杂的随机字符串
> - `ENCRYPTION_KEY` 必须是 32 个字符，用于 AES-256 加密

4. **初始化数据库**

```bash
npx prisma generate
npx prisma db push
```

5. **启动开发服务器**

```bash
npm run dev
```

6. **访问应用**

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

---

## 本地运行指南

### 开发模式

```bash
npm run dev
```

开发模式支持热重载，修改代码后自动刷新页面。

### 生产构建

```bash
npm run build
npm run start
```

### 数据库管理

查看数据库数据：

```bash
npx prisma studio
```

这将打开 Prisma Studio，提供可视化的数据库管理界面。

### 代码检查

```bash
npm run lint
```

### 代码格式化

```bash
npm run format
```

---

## 代码规范说明

### 文件命名

- 组件文件：PascalCase（如 `LoginForm.tsx`）
- 工具文件：camelCase（如 `prisma.ts`）
- API 路由：小写连字符（如 `email-accounts/`）

### 组件结构

```tsx
import { useState } from "react";

interface ComponentProps {
  title: string;
}

export function Component({ title }: ComponentProps) {
  const [state, setState] = useState<string>("");

  return (
    <div>
      <h1>{title}</h1>
    </div>
  );
}
```

### API 路由结构

```typescript
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth";

async function GET(request: NextRequest) {
  try {
    return NextResponse.json({ data: [] });
  } catch (error) {
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

export const GET_handler = withAuth(GET);
export { GET_handler as GET };
```

### 错误处理

- 使用 try-catch 捕获异常
- 返回统一的错误响应格式
- 记录错误日志到控制台

### 安全规范

1. **密码存储**：使用 bcryptjs 加密，盐值轮数 12
2. **敏感数据加密**：SMTP 密码使用 AES-256-CBC 加密存储
3. **JWT 密钥**：生产环境必须使用强随机密钥
4. **API Key 格式**：`ea_live_` 前缀 + 64 位十六进制字符串

---

## 常用命令速查

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run dev:smtp` | 启动 SMTP 服务器（开发模式） |
| `npm run build` | 构建生产版本 |
| `npm run start` | 启动生产服务器 |
| `npm run start:smtp` | 启动 SMTP 服务器（生产模式） |
| `npm run lint` | 运行代码检查 |
| `npm run format` | 格式化代码 |
| `npx prisma studio` | 打开数据库管理界面 |
| `npx prisma generate` | 生成 Prisma 客户端 |
| `npx prisma db push` | 同步数据库结构 |
| `npx prisma migrate dev` | 创建迁移（PostgreSQL） |
