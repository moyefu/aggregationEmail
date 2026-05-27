# 更新日志 (CHANGELOG)

所有重要的更改都将记录在此文件中。

## [1.2.0] - 2026-05-25

### 新增功能

#### 邮箱验证码功能
- 注册时需验证邮箱验证码
- 验证码有效期 10 分钟
- 发送验证码 API：POST /api/auth/send-code

#### 忘记密码功能
- 登录页添加"忘记密码"入口
- 通过邮箱发送重置链接
- 重置链接有效期 1 小时
- 新增页面：/forgot-password、/reset-password

#### API Key 数量限制
- 每用户默认最多 10 个 API Key
- 可通过 MAX_API_KEYS_PER_USER 环境变量配置
- 达到上限时禁用创建按钮

#### 邮箱唯一性检查
- 同一用户不能添加相同的邮箱地址
- 数据库层面添加唯一约束

#### 循环请求检测
- 检测是否使用本服务的 SMTP 服务器
- 检测是否使用本服务的 API Key 作为密码
- 防止邮件发送循环

#### 用户登录记录
- 记录最后登录时间
- 记录最后登录 IP
- 记录最后登录 User-Agent

#### 管理员创建用户
- 管理后台可直接创建用户
- 无需邮箱验证
- 可指定用户等级

#### 多数据库支持
- 自动识别 DATABASE_URL 格式
- 支持 SQLite、MySQL、PostgreSQL
- 自动调整 schema.prisma 配置

#### 站点 SMTP 配置
- 新增 SITE_SMTP_* 环境变量
- 用于发送验证码、密码重置邮件

#### UI 优化
- 统一页脚组件
- 所有按钮添加 cursor-pointer
- API Keys 页面 H5 响应式布局优化
- 弹窗 z-index 修复

### 环境变量
- 新增 SITE_SMTP_HOST
- 新增 SITE_SMTP_PORT
- 新增 SITE_SMTP_USER
- 新增 SITE_SMTP_PASSWORD
- 新增 SITE_SMTP_FROM
- 新增 MAX_API_KEYS_PER_USER

### API 接口
- 新增 POST /api/auth/send-code
- 新增 POST /api/auth/forgot-password
- 新增 POST /api/auth/reset-password
- 新增 POST /api/admin/users

### 数据库变更
- 新增 VerificationCode 表
- User 表新增 lastLoginAt 字段
- User 表新增 lastLoginIp 字段
- User 表新增 lastLoginUserAgent 字段
- EmailAccount 表添加唯一约束 @@unique([userId, fromEmail])

## [1.1.0] - 2026-05-25

### 新增功能

#### 超级管理后台
- **管理后台入口**：新增 `/admin` 路径，管理员可通过独立入口访问
- **管理员认证**：独立的管理员登录系统，支持环境变量配置管理员账户
- **仪表盘**：展示用户总数、邮箱总数、API 密钥总数、邮件发送统计等数据
- **用户管理**：
  - 查看所有用户列表（支持分页、搜索、状态筛选）
  - 启用/禁用用户账户
  - 修改用户等级
- **等级管理**：
  - 创建、编辑、删除用户等级
  - 配置每个等级的邮箱数量限制
  - 查看每个等级下的用户数量

#### 用户等级系统
- **等级模型**：新增 `Level` 数据模型，支持自定义等级名称、描述和邮箱数量限制
- **用户关联等级**：每个用户关联一个等级，决定其邮箱数量配额
- **默认等级**：新注册用户自动分配默认等级
- **等级限制检查**：添加邮箱时自动检查用户等级限制

#### 邮箱数量限制
- **配额管理**：根据用户等级限制可添加的邮箱数量
- **配额提示**：邮箱管理页面显示当前已用数量和总配额
- **超限拦截**：达到上限时阻止继续添加邮箱，并给出提示

#### 用户禁用功能
- **状态管理**：用户状态分为「正常」和「已禁用」
- **禁用效果**：
  - 禁用用户无法登录
  - 禁用用户的 API 密钥无法发送邮件
  - 禁用用户的 SMTP 认证会被拒绝
- **管理操作**：管理员可在后台一键启用/禁用用户

### 环境变量
- 新增 `ADMIN_USERNAME`：超级管理员用户名
- 新增 `ADMIN_PASSWORD`：超级管理员密码

### API 接口
- 新增 `POST /api/admin/auth/login`：管理员登录
- 新增 `POST /api/admin/auth/logout`：管理员登出
- 新增 `GET /api/admin/dashboard/stats`：获取仪表盘统计数据
- 新增 `GET /api/admin/users`：获取用户列表
- 新增 `POST /api/admin/users/[id]/toggle-status`：切换用户状态
- 新增 `PUT /api/admin/users/[id]/level`：修改用户等级
- 新增 `GET /api/admin/levels`：获取等级列表
- 新增 `POST /api/admin/levels`：创建等级
- 新增 `PUT /api/admin/levels/[id]`：更新等级
- 新增 `DELETE /api/admin/levels/[id]`：删除等级

### 数据库变更
- 新增 `Level` 表：存储用户等级信息
- `User` 表新增 `levelId` 字段：关联用户等级
- `User` 表新增 `status` 字段：用户状态（active/disabled）

## [1.0.0] - 2026-05-25

### 新增功能

#### 核心功能
- **用户认证系统**：支持用户注册、登录、登出，JWT 令牌认证
- **邮箱管理**：支持绑定多个 SMTP 邮箱账户，SMTP 连接验证，批量验证所有邮箱
- **API 密钥管理**：支持创建多个 API 密钥，权限范围配置（全部邮箱/指定邮箱），查看密钥功能（需密码验证）
- **邮件发送**：支持 HTTP API 和 SMTP 协议两种方式发送邮件，支持 HTML、附件、抄送、密送
- **发送日志**：记录所有邮件发送状态，支持查看发送历史

#### SMTP 服务器
- 独立的 SMTP 服务器，监听 2525 端口（可配置）
- 支持 AUTH LOGIN/PLAIN 认证
- 支持 STARTTLS 加密
- 根据 MAIL FROM 地址自动路由到用户绑定的邮箱账户

#### 用户界面
- **控制台首页**：显示邮箱账户数量、API 密钥数量、发送测试入口
- **邮箱管理页面**：添加、编辑、删除邮箱账户，发送测试邮件，批量验证
- **API 密钥管理页面**：创建、查看、删除 API 密钥
- **发送测试页面**：测试邮件发送功能
- **账号设置页面**：修改姓名、修改密码
- **统一导航栏**：用户下拉菜单，支持跳转账号设置和退出登录

#### 安全特性
- 密码复杂度验证（至少8位，包含大小写字母和数字）
- SMTP 密码 AES-256 加密存储
- 编辑邮箱账户需验证登录密码
- 查看 API 密钥需验证登录密码
- 已登录用户自动跳转到控制台

#### 文档
- **开发文档** (DEVELOPMENT.md)：架构设计、技术选型、目录结构
- **API 文档** (API.md)：HTTP API 和 SMTP 协议接口说明
- **数据库设计文档** (DATABASE.md)：ER 图、表结构、关系说明
- **部署指南** (DEPLOYMENT.md)：Docker 部署、PM2 管理、TLS 配置
- **用户使用手册** (USER_GUIDE.md)：SMTP 配置示例、API 调用示例

### 技术栈
- **前端**：Next.js 16 + TypeScript + Tailwind CSS
- **后端**：Next.js API Routes + Prisma ORM
- **数据库**：SQLite（开发）/ PostgreSQL（生产）
- **认证**：JWT + bcryptjs
- **邮件**：Nodemailer + smtp-server

### 项目结构
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
│   ├── start-smtp.ts        # SMTP 服务启动
│   ├── generate-cert.sh     # TLS 证书生成
│   └── generate-cert.ps1
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/             # API 路由
│   │   ├── dashboard/       # 控制台首页
│   │   ├── email-accounts/  # 邮箱管理
│   │   ├── api-keys/        # API 密钥管理
│   │   ├── send-test/       # 发送测试
│   │   ├── profile/         # 账号设置
│   │   ├── login/           # 登录页
│   │   └── register/        # 注册页
│   ├── components/          # React 组件
│   │   ├── auth/            # 认证相关组件
│   │   ├── email-accounts/  # 邮箱管理组件
│   │   ├── api-keys/        # API 密钥组件
│   │   ├── send-test/       # 发送测试组件
│   │   └── layout/          # 布局组件
│   ├── lib/                 # 工具库
│   │   ├── prisma.ts        # Prisma 客户端
│   │   ├── email.ts         # 邮件发送服务
│   │   ├── smtp.ts          # SMTP 验证
│   │   ├── smtp-server.ts   # SMTP 服务器
│   │   ├── smtp-auth.ts     # SMTP 认证
│   │   ├── smtp-mail-handler.ts
│   │   └── crypto.ts        # 加密工具
│   ├── middleware/          # 中间件
│   │   ├── auth.ts          # JWT 认证中间件
│   │   └── apiKeyAuth.ts    # API 密钥认证
│   └── types/               # 类型定义
└── CHANGELOG.md             # 更新日志
```
