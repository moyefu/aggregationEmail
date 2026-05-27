# 邮件聚合服务 (Email Aggregation Service)

一个统一的邮件发送服务平台，支持 HTTP API 和 SMTP 协议两种方式发送邮件，可以管理多个邮箱账户和 API 密钥。

## 功能特性

- 🔐 **用户认证**：支持用户注册、登录、JWT 令牌认证
- 📧 **多邮箱管理**：绑定多个 SMTP 邮箱账户，支持连接验证
- 🔑 **API 密钥管理**：创建多个 API 密钥，支持权限范围配置
- 📨 **双协议支持**：HTTP API 和 SMTP 协议两种发送方式
- 📝 **发送日志**：记录所有邮件发送状态
- 🔒 **安全加密**：SMTP 密码 AES-256 加密存储
- 👤 **用户等级系统**：支持多级用户权限，不同等级拥有不同的邮箱数量限制
- 🛡️ **超级管理后台**：管理员可管理用户、配置等级、查看统计数据
- ✉️ **邮箱验证码注册**：注册流程需要邮箱验证码验证，确保邮箱有效性
- 🔑 **忘记密码功能**：支持通过邮箱验证码重置密码
- 📊 **API Key 数量限制**：每用户 API Key 数量上限可配置（默认 MAX_API_KEYS_PER_USER=10）
- 🔍 **邮箱唯一性检查**：同一用户不能添加相同的邮箱地址
- 🔄 **循环请求检测**：防止用户使用本服务的 SMTP 或 API Key 发送邮件到本服务
- 📝 **用户登录记录**：记录用户登录 IP、User-Agent 等信息
- 👨‍💼 **管理员创建用户**：管理员可直接创建用户账户
- 🗄️ **多数据库自动识别**：自动识别支持 SQLite/MySQL/PostgreSQL
- 📮 **站点 SMTP 配置**：支持配置站点级 SMTP 用于发送验证码等系统邮件

## 技术栈

- **前端**：Next.js 16 + TypeScript + Tailwind CSS
- **后端**：Next.js API Routes + Prisma ORM
- **数据库**：SQLite（开发）/ PostgreSQL（生产）
- **认证**：JWT + bcryptjs
- **邮件**：Nodemailer + smtp-server

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn 或 pnpm

### 安装依赖

```bash
npm install
```

### 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-jwt-secret"
ENCRYPTION_KEY="your-32-byte-encryption-key"
SMTP_PORT=2525
SMTP_HOST=0.0.0.0
```

### 初始化数据库

```bash
npx prisma db push
```

### 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 启动 SMTP 服务器

```bash
npm run start:smtp
```

SMTP 服务器默认监听 2525 端口。

## 项目结构

```
aggregation-email/
├── docs/                    # 文档目录
│   ├── DEVELOPMENT.md       # 开发文档
│   ├── API.md               # API 文档
│   ├── DATABASE.md          # 数据库设计
│   ├── DEPLOYMENT.md        # 部署指南
│   └── USER_GUIDE.md        # 用户手册
├── prisma/                  # 数据库模型
│   └── schema.prisma
├── scripts/                 # 脚本文件
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/             # API 路由
│   │   ├── dashboard/       # 控制台首页
│   │   ├── email-accounts/  # 邮箱管理
│   │   ├── api-keys/        # API 密钥管理
│   │   ├── send-test/       # 发送测试
│   │   ├── profile/         # 账号设置
│   │   ├── forgot-password/ # 忘记密码
│   │   └── reset-password/  # 重置密码
│   ├── components/          # React 组件
│   │   └── layout/
│   │       └── Footer.tsx   # 页脚组件
│   ├── lib/                 # 工具库
│   │   └── site-smtp.ts     # 站点 SMTP 配置
│   └── middleware/          # 中间件
├── CHANGELOG.md             # 更新日志
└── README.md                # 项目说明
```

## 常用命令

```bash
# 开发模式
npm run dev

# 构建
npm run build

# 启动生产服务
npm start

# 启动 SMTP 服务器
npm run start:smtp

# 数据库管理
npx prisma studio    # 打开数据库管理界面
npx prisma db push   # 同步数据库结构

# 代码检查
npm run lint
```

## API 使用示例

### HTTP API 发送邮件

```bash
curl -X POST http://localhost:3000/api/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ea_live_xxx" \
  -d '{
    "from": "sender@example.com",
    "to": ["recipient@example.com"],
    "subject": "测试邮件",
    "text": "这是一封测试邮件"
  }'
```

### SMTP 协议发送邮件

```python
import smtplib

smtp = smtplib.SMTP('localhost', 2525)
smtp.login('ea_live_xxx', 'ea_live_xxx')
smtp.sendmail('sender@example.com', ['recipient@example.com'], 'Subject: Test\n\nHello!')
smtp.quit()
```

## 环境变量说明

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `DATABASE_URL` | 数据库连接字符串 | `file:./dev.db` |
| `JWT_SECRET` | JWT 密钥 | - |
| `ENCRYPTION_KEY` | AES 加密密钥（32字节） | - |
| `SMTP_PORT` | SMTP 服务器端口 | `2525` |
| `SMTP_HOST` | SMTP 服务器监听地址 | `0.0.0.0` |
| `TLS_CERT_PATH` | TLS 证书路径 | - |
| `TLS_KEY_PATH` | TLS 密钥路径 | - |
| `ADMIN_USERNAME` | 超级管理员用户名 | - |
| `ADMIN_PASSWORD` | 超级管理员密码 | - |
| `SITE_SMTP_HOST` | 站点 SMTP 服务器地址 | - |
| `SITE_SMTP_PORT` | 站点 SMTP 端口 | - |
| `SITE_SMTP_USER` | 站点 SMTP 用户名 | - |
| `SITE_SMTP_PASSWORD` | 站点 SMTP 密码 | - |
| `SITE_SMTP_FROM` | 站点发件人地址 | - |
| `MAX_API_KEYS_PER_USER` | 每用户 API Key 数量上限 | `10` |

> **注意**：`ADMIN_USERNAME` 和 `ADMIN_PASSWORD` 用于配置超级管理员账户。首次启动时，如果数据库中没有管理员账户，系统会自动创建。

## 文档

- [开发文档](./docs/DEVELOPMENT.md) - 架构设计、技术选型、目录结构
- [API 文档](./docs/API.md) - HTTP API 和 SMTP 协议接口说明
- [数据库设计](./docs/DATABASE.md) - ER 图、表结构、关系说明
- [部署指南](./docs/DEPLOYMENT.md) - Docker 部署、PM2 管理、TLS 配置
- [用户手册](./docs/USER_GUIDE.md) - SMTP 配置示例、API 调用示例

## 超级管理后台

系统提供超级管理后台，管理员可以通过 `/admin` 路径访问。

### 功能列表

- **仪表盘**：查看用户总数、邮箱总数、API 密钥总数、邮件发送统计
- **用户管理**：
  - 查看所有用户列表
  - 启用/禁用用户账户
  - 修改用户等级
- **等级管理**：
  - 创建、编辑、删除用户等级
  - 配置每个等级的邮箱数量限制
  - 设置等级名称和描述

### 访问方式

1. 配置环境变量 `ADMIN_USERNAME` 和 `ADMIN_PASSWORD`
2. 启动应用后访问 `/admin` 路径
3. 使用配置的管理员账户登录

## 用户等级系统

系统支持用户等级功能，不同等级的用户拥有不同的邮箱数量限制。

### 默认等级

| 等级名称 | 邮箱数量限制 | 说明 |
|----------|--------------|------|
| 免费用户 | 2 | 默认注册用户的等级 |
| 基础版 | 5 | 基础付费用户 |
| 专业版 | 20 | 专业用户 |
| 企业版 | 100 | 企业用户 |

### 功能说明

- 新注册用户默认分配最低等级
- 管理员可在后台创建自定义等级
- 管理员可为用户分配任意等级
- 用户添加邮箱时会检查等级限制

## 更新日志

查看 [CHANGELOG.md](./CHANGELOG.md) 了解版本更新历史。

## 许可证

MIT
