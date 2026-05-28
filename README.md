# 邮件聚合服务 (Email Aggregation Service)

一个统一的邮件发送服务平台，支持 HTTP API（JSON / multipart/form-data）和 SMTP 协议两种方式发送邮件，可以管理多个邮箱账户、API 密钥和代理配置。

## 功能特性

- 🔐 **用户认证**：支持用户注册、登录、JWT 令牌认证
- 📧 **多邮箱管理**：绑定多个 SMTP 邮箱账户，支持连接验证与批量验证
- 🌐 **代理管理**：支持 HTTP/HTTPS/SOCKS5 代理，邮箱账户可配置独立代理发送邮件
- 🔑 **API 密钥管理**：创建多个 API 密钥，支持 ALL/SPECIFIC 权限范围配置
- 📨 **双格式发送**：HTTP API 支持 JSON 和 multipart/form-data 两种格式，SMTP 协议原生支持
- 📎 **附件上传**：form-data 方式直接上传文件，JSON 方式支持 Base64 / Data URL
- 📝 **日志系统**：邮件发送日志（分页/筛选）+ 认证日志（API/SMTP 来源区分）
- 🔒 **安全加密**：SMTP 密码 AES-256 加密存储
- 👤 **用户等级系统**：支持多级用户权限，不同等级拥有不同的邮箱数量限制
- 🛡️ **超级管理后台**：管理员可管理用户、配置等级、查看统计数据
- ✉️ **邮箱验证码注册**：注册流程需要邮箱验证码验证，确保邮箱有效性
- 🔑 **忘记密码功能**：支持通过邮箱验证码重置密码
- 🧪 **发送测试页面**：Web 端测试邮件发送，支持文件选择（form-data 格式）
- 🔄 **循环请求检测**：防止用户使用本服务的 SMTP 或 API Key 发送邮件到本服务
- 📮 **站点 SMTP 配置**：支持配置站点级 SMTP 用于发送验证码等系统邮件
- 🗄️ **多数据库自动识别**：自动识别支持 SQLite/MySQL/PostgreSQL

## 技术栈

| 层面 | 技术 |
|------|------|
| 前端框架 | Next.js 16 (App Router) + TypeScript |
| 样式方案 | Tailwind CSS |
| 后端 API | Next.js API Routes + Prisma ORM |
| 数据库 | SQLite（开发）/ PostgreSQL / MySQL（生产） |
| 用户认证 | JWT + bcryptjs |
| 邮件发送 | Nodemailer（HTTP API）/ smtp-server（SMTP 协议） |
| 代理支持 | socks-proxy-agent + https-proxy-agent |
| 加密存储 | AES-256（Node.js crypto） |

## 快速开始

### 方式一：源码部署

#### 环境要求

- Node.js 18+
- npm 或 yarn 或 pnpm

#### 安装依赖

```bash
git clone https://github.com/your-repo/aggregation-email.git
cd aggregation-email
npm install
```

#### 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-jwt-secret"
ENCRYPTION_KEY="your-32-byte-encryption-key"
SMTP_PORT=2525
SMTP_HOST=0.0.0.0
```

#### 初始化数据库

```bash
npx prisma db push
```

#### 启动服务

```bash
# 启动 Web 服务（端口 3000）
npm run dev

# 另开终端启动 SMTP 服务（端口 2525）
npm run start:smtp
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

访问 [http://localhost:3000/admin](http://localhost:3000/admin) 进入管理后台。

---

### 方式二：Docker 部署（推荐）

#### 环境要求

- Docker 20.10+

#### 拉取镜像

```bash
docker pull moyefu/aggregation_email:latest
```

#### 创建数据目录

```bash
mkdir -p ./data
```

#### 启动容器

```bash
docker run -d \
  --name aggregation-email \
  --restart always \
  -p 3000:3000 \
  -p 2525:2525 \
  -v $(pwd)/data:/app/data \
  -e DATABASE_URL="file:./data/prod.db" \
  -e JWT_SECRET="your-jwt-secret-change-in-production" \
  -e ENCRYPTION_KEY="your-32-character-encryption-key" \
  -e SMTP_HOST=0.0.0.0 \
  -e SMTP_PORT=2525 \
  -e NODE_ENV=production \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD=admin123 \
  -e MAX_API_KEYS_PER_USER=10 \
  moyefu/aggregation_email:latest
```

> **提示**：如需配置站点 SMTP（验证码邮件），在上述命令中追加以下参数：
> ```bash
>   -e SITE_SMTP_HOST="smtp.example.com" \
>   -e SITE_SMTP_PORT=587 \
>   -e SITE_SMTP_USER="user@example.com" \
>   -e SITE_SMTP_PASSWORD="your-password" \
>   -e SITE_SMTP_FROM="noreply@example.com" \
> ```

#### 验证运行状态

```bash
docker ps | grep aggregation-email
```

| 端口 | 说明 |
|------|------|
| `3000` | 访问控制台和 HTTP API |
| `2525` | 接收 SMTP 协议邮件 |

访问 [http://localhost:3000](http://localhost:3000) 查看应用，使用上方配置的 `ADMIN_USERNAME` 和 `ADMIN_PASSWORD` 登录管理后台。

#### 使用其他数据库

默认使用 SQLite（`file:./data/prod.db`），数据存储在容器内 `./data` 目录。如需使用 PostgreSQL 或 MySQL，修改 `-e DATABASE_URL` 参数并确保应用容器能访问目标数据库。

##### 使用 PostgreSQL

**1. （可选）安装 PostgreSQL 数据库 **

```bash
docker run -d \
  --name aggregation-email-db \
  --restart always \
  -e POSTGRES_USER=aggregation \
  -e POSTGRES_PASSWORD=your-db-password \
  -e POSTGRES_DB=aggregation_email \
  -v $(pwd)/postgres-data:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:16
```

**2. 启动应用容器（连接 PostgreSQL）**

```bash
docker run -d \
  --name aggregation-email \
  --restart always \
  -p 3000:3000 \
  -p 2525:2525 \
  -e DATABASE_URL="postgresql://aggregation:your-db-password@host.docker.internal:5432/aggregation_email?schema=public" \
  -e JWT_SECRET="your-jwt-secret-change-in-production" \
  -e ENCRYPTION_KEY="your-32-character-encryption-key" \
  -e SMTP_HOST=0.0.0.0 \
  -e SMTP_PORT=2525 \
  -e NODE_ENV=production \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD=admin123 \
  -e MAX_API_KEYS_PER_USER=10 \
  moyefu/aggregation_email:latest
```

> **注意**：`host.docker.internal` 用于容器访问宿主机上的服务。如果 PostgreSQL 运行在另一台服务器上，请将 `host.docker.internal:5432` 替换为实际地址，例如 `192.168.1.100:5432`。

##### 使用 MySQL

**1. （可选）安装 MySQL 数据库**

```bash
docker run -d \
  --name aggregation-email-db \
  --restart always \
  -e MYSQL_ROOT_PASSWORD=root-password \
  -e MYSQL_USER=aggregation \
  -e MYSQL_PASSWORD=your-db-password \
  -e MYSQL_DATABASE=aggregation_email \
  -v $(pwd)/mysql-data:/var/lib/mysql \
  -p 3306:3306 \
  mysql:8.0
```

**2. 启动应用容器（连接 MySQL）**

```bash
docker run -d \
  --name aggregation-email \
  --restart always \
  -p 3000:3000 \
  -p 2525:2525 \
  -e DATABASE_URL="mysql://aggregation:your-db-password@host.docker.internal:3306/aggregation_email" \
  -e JWT_SECRET="your-jwt-secret-change-in-production" \
  -e ENCRYPTION_KEY="your-32-character-encryption-key" \
  -e SMTP_HOST=0.0.0.0 \
  -e SMTP_PORT=2525 \
  -e NODE_ENV=production \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD=admin123 \
  -e MAX_API_KEYS_PER_USER=10 \
  moyefu/aggregation_email:latest
```

##### 数据库连接字符串格式

| 数据库 | 连接字符串模板 |
|--------|---------------|
| SQLite | `file:./data/prod.db` |
| PostgreSQL | `postgresql://user:password@host:5432/dbname?schema=public` |
| MySQL | `mysql://user:password@host:3306/dbname` |

#### 常用运维命令

```bash
# 查看日志
docker logs -f aggregation-email

# 停止容器
docker stop aggregation-email

# 启动容器
docker start aggregation-email

# 重启容器
docker restart aggregation-email

# 删除容器（数据保留在 ./data 目录）
docker rm -f aggregation-email

# 更新到最新版本
docker pull moyefu/aggregation_email:latest && \
docker rm -f aggregation-email && \
docker run -d \
  --name aggregation-email \
  --restart always \
  -p 3000:3000 \
  -p 2525:2525 \
  -v $(pwd)/data:/app/data \
  -e DATABASE_URL="file:./data/prod.db" \
  -e JWT_SECRET="your-jwt-secret-change-in-production" \
  -e ENCRYPTION_KEY="your-32-character-encryption-key" \
  -e SMTP_HOST=0.0.0.0 \
  -e SMTP_PORT=2525 \
  -e NODE_ENV=production \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD=admin123 \
  -e MAX_API_KEYS_PER_USER=10 \
  moyefu/aggregation_email:latest
```

## 项目结构

```
aggregation-email/
├── docs/                        # 文档目录
│   ├── API.md                   # API 接口文档（含 JSON / form-data / SMTP 三种方式）
│   ├── DATABASE.md              # 数据库设计（含代理、认证日志表）
│   ├── DEVELOPMENT.md           # 开发文档
│   ├── DEPLOYMENT.md            # 部署指南
│   ├── DOCKER_DEPLOYMENT.md     # Docker 部署详解
│   └── USER_GUIDE.md            # 用户手册
├── prisma/                      # 数据库模型与迁移
│   └── schema.prisma            # Prisma Schema（User/EmailAccount/ApiKey/Proxy/Log 等）
├── scripts/                 # 脚本文件
├── src/
│   ├── app/                     # Next.js App Router（页面 + API 路由）
│   │   ├── api/                 # API 路由
│   │   │   ├── send/            # 邮件发送（JSON + form-data 双格式）
│   │   │   ├── auth/            # 认证（注册/登录/登出/验证码/密码重置）
│   │   │   ├── email-accounts/  # 邮箱账户 CRUD + 测试 + 批量验证
│   │   │   ├── api-keys/        # API 密钥 CRUD + 查看 Key
│   │   │   ├── proxies/         # 代理 CRUD + 测试 + 列表
│   │   │   ├── logs/            # 日志查询（邮件发送日志 / 认证日志）
│   │   │   └── admin/           # 管理后台 API（用户/等级/统计）
│   │   ├── dashboard/           # 控制台首页
│   │   ├── email-accounts/      # 邮箱管理页面
│   │   ├── api-keys/            # API 密钥管理页面
│   │   ├── proxies/             # 代理管理页面
│   │   ├── send-test/           # 发送测试页面（支持文件上传）
│   │   ├── logs/                # 日志查看页面
│   │   ├── profile/             # 个人设置页面
│   │   ├── admin/               # 管理后台页面
│   │   ├── login/               # 登录页
│   │   ├── register/            # 注册页
│   │   └── ...                  # 其他页面（forgot-password/reset-password）
│   ├── components/              # React 组件
│   │   ├── auth/                # 登录/注册表单
│   │   ├── email-accounts/      # 邮箱表单、列表、密码验证弹窗
│   │   ├── api-keys/            # 密钥列表、创建表单
│   │   ├── send-test/           # 发送测试表单（form-data + 文件选择）
│   │   └── layout/              # 布局组件（Footer/UserMenu）
│   ├── lib/                     # 核心工具库
│   │   ├── email.ts             # 邮件发送核心（nodemailer 封装）
│   │   ├── smtp-server.ts       # SMTP 服务器启动与配置
│   │   ├── smtp-mail-handler.ts # SMTP 邮件处理（认证/收发/代理）
│   │   ├── smtp-auth.ts         # 认证日志记录（AuthenticationLog）
│   │   ├── proxy.ts             # 代理模块（创建 Agent / 连接测试）
│   │   ├── crypto.ts            # AES-256 加密解密
│   │   ├── site-smtp.ts         # 站点 SMTP 配置（系统邮件）
│   │   ├── admin-auth.ts        # 管理员认证中间件
│   │   └── prisma.ts            # Prisma 客户端实例
│   ├── middleware/               # 请求中间件
│   │   ├── auth.ts              # JWT 认证
│   │   ├── apiKeyAuth.ts        # API Key 认证 + 权限校验
│   │   └── adminAuth.ts         # 管理员认证
│   └── types/                   # TypeScript 类型定义
├── CHANGELOG.md                 # 版本更新日志
├── .env.example                 # 环境变量示例
├── .dockerignore                # Docker 构建排除规则
└── README.md                    # 项目说明
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

### 方式一：JSON 格式发送

```bash
curl -X POST http://localhost:3000/api/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ea_live_xxx" \
  -d '{
    "from": "sender@example.com",
    "to": ["recipient@example.com"],
    "subject": "测试邮件",
    "html": "<h1>Hello</h1><p>这是一封测试邮件</p>"
  }'
```

### 方式二：multipart/form-data 发送（支持文件上传）

```bash
curl -X POST http://localhost:3000/api/send \
  -H "Authorization: Bearer ea_live_xxx" \
  -F "from=sender@example.com" \
  -F "to=recipient@example.com" \
  -F "subject=带附件的测试邮件" \
  -F "html=<p>请查收附件</p>" \
  -F "attachments=@./report.pdf"
```

### SMTP 协议发送

```python
import smtplib

smtp = smtplib.SMTP('localhost', 2525)
smtp.login('xxx@example.com', 'ea_live_xxx')
smtp.sendmail('sender@example.com', ['recipient@example.com'], 'Subject: Test\n\nHello!')
smtp.quit()
```

> 完整 API 文档请查看 [docs/API.md](./docs/API.md)，包含两种格式的字段说明、附件处理、错误码等详细内容。

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

- [API 接口文档](./docs/API.md) - HTTP API（JSON / form-data）和 SMTP 协议接口完整说明
- [数据库设计](./docs/DATABASE.md) - ER 图、表结构、关系说明（含代理、认证日志）
- [开发文档](./docs/DEVELOPMENT.md) - 架构设计、技术选型、开发规范
- [部署指南](./docs/DEPLOYMENT.md) - PM2 管理、TLS 配置、生产环境优化
- [Docker 部署](./docs/DOCKER_DEPLOYMENT.md) - Docker Compose、数据持久化、数据库配置
- [用户手册](./docs/USER_GUIDE.md) - SMTP 配置示例、API 调用示例、代理使用指南

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

## 代理管理

系统支持代理功能，允许用户配置 HTTP/HTTPS/SOCKS5 代理，邮箱账户可通过代理发送邮件。

### 功能特性

- **多协议支持**：HTTP、HTTPS、SOCKS5 三种代理协议
- **代理认证**：支持用户名密码认证的代理服务器
- **连接测试**：添加代理前可测试连通性和延迟
- **批量测试**：一键测试所有代理的连接状态
- **独立配置**：每个邮箱账户可独立配置使用的代理

### 使用场景

- 绕过 IP 限制，提高邮件送达率
- 通过企业代理服务器发送邮件
- 使用海外代理发送国际邮件
- 保护发送邮件的真实 IP 地址

### 配置方式

1. 在控制台点击「代理管理」进入代理列表
2. 点击「添加代理」填写代理信息：
   - 代理名称（便于识别）
   - 协议类型（HTTP/HTTPS/SOCKS5）
   - 主机地址和端口
   - 认证用户名和密码（可选）
3. 测试代理连通性后保存
4. 在邮箱账户设置中选择使用的代理

## 更新日志

查看 [CHANGELOG.md](./CHANGELOG.md) 了解版本更新历史。

## 许可证

MIT
