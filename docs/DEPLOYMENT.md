# 部署指南

本文档介绍如何将 aggregation-email 项目部署到生产环境。

---

## 生产环境要求

### 服务器配置

| 配置项 | 最低要求 | 推荐配置 |
|--------|----------|----------|
| CPU | 1 核 | 2 核+ |
| 内存 | 1 GB | 2 GB+ |
| 存储 | 10 GB | 20 GB+ SSD |
| 操作系统 | Linux (Ubuntu 20.04+) | Linux (Ubuntu 22.04) |

### 软件环境

| 软件 | 版本要求 |
|------|----------|
| Node.js | 18.x 或更高 |
| npm/yarn/pnpm | 最新稳定版 |
| PostgreSQL | 14.x 或更高（可选） |
| Nginx | 1.18+（可选） |
| Docker | 20.x+（可选） |

---

## 环境变量配置

### 必需环境变量

创建 `.env` 文件或配置系统环境变量：

```env
DATABASE_URL="postgresql://user:password@localhost:5432/aggregation_email"
JWT_SECRET="your-super-secret-jwt-key-at-least-32-characters-long"
ENCRYPTION_KEY="your-32-character-encryption-key"
```

### SMTP 服务器环境变量

```env
SMTP_PORT=2525
SMTP_HOST=0.0.0.0
TLS_CERT_PATH=/path/to/cert.pem
TLS_KEY_PATH=/path/to/key.pem
```

### 站点 SMTP 配置（用于发送验证码、密码重置邮件）

```env
SITE_SMTP_HOST=smtp.example.com
SITE_SMTP_PORT=465
SITE_SMTP_USER=noreply@example.com
SITE_SMTP_PASSWORD=your-smtp-password
SITE_SMTP_FROM=noreply@example.com
```

| 变量名 | 说明 | 示例 |
|--------|------|------|
| SITE_SMTP_HOST | 站点 SMTP 服务器地址 | smtp.gmail.com |
| SITE_SMTP_PORT | 站点 SMTP 端口 | 465 |
| SITE_SMTP_USER | 站点 SMTP 用户名 | noreply@example.com |
| SITE_SMTP_PASSWORD | 站点 SMTP 密码 | your-password |
| SITE_SMTP_FROM | 站点发件人地址 | noreply@example.com |

### 环境变量说明

| 变量名 | 说明 | 生成方式 |
|--------|------|----------|
| DATABASE_URL | PostgreSQL 数据库连接字符串 | 根据数据库配置填写 |
| JWT_SECRET | JWT 签名密钥 | 使用强随机字符串（至少 32 字符） |
| ENCRYPTION_KEY | AES-256 加密密钥 | 必须为 32 个字符 |
| SMTP_PORT | SMTP 服务器监听端口 | 默认 2525，生产环境建议 25 或 587 |
| SMTP_HOST | SMTP 服务器绑定地址 | 默认 0.0.0.0 |
| TLS_CERT_PATH | TLS 证书路径 | 用于 SMTP STARTTLS |
| TLS_KEY_PATH | TLS 私钥路径 | 用于 SMTP STARTTLS |

### API 密钥数量限制

```env
MAX_API_KEYS_PER_USER=10
```

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| MAX_API_KEYS_PER_USER | 每用户最多可创建的 API 密钥数量 | 10 |

### 生成安全密钥

**JWT_SECRET**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**ENCRYPTION_KEY**

```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

---

## 数据库迁移（SQLite 到 PostgreSQL）

### 多数据库自动识别

启动脚本会自动根据 DATABASE_URL 格式识别数据库类型：

| DATABASE_URL 格式 | 自动设置 provider |
|---|---|
| file:./dev.db | sqlite |
| mysql://user:pass@host:3306/db | mysql |
| postgresql://user:pass@host:5432/db | postgresql |

只需修改 .env 中的 DATABASE_URL，启动脚本会自动：
1. 更新 schema.prisma 中的 provider
2. 生成对应的 Prisma Client
3. 同步数据库结构

### 步骤 1：安装 PostgreSQL

**Ubuntu/Debian**

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 步骤 2：创建数据库和用户

```bash
sudo -u postgres psql

CREATE USER aggregation_user WITH PASSWORD 'your_secure_password';
CREATE DATABASE aggregation_email OWNER aggregation_user;
GRANT ALL PRIVILEGES ON DATABASE aggregation_email TO aggregation_user;
\q
```

### 步骤 3：修改 Prisma 配置

编辑 `prisma/schema.prisma`：

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 步骤 4：更新环境变量

```env
DATABASE_URL="postgresql://aggregation_user:your_secure_password@localhost:5432/aggregation_email"
```

### 步骤 5：执行迁移

```bash
npx prisma generate
npx prisma migrate deploy
```

### 数据迁移（可选）

如果需要从 SQLite 迁移数据到 PostgreSQL：

```bash
npx prisma db pull
npx prisma db push
```

或使用数据导出/导入工具。

---

## 构建和部署步骤

### 方式一：直接部署

#### 1. 安装依赖

```bash
npm ci --production
```

#### 2. 构建

```bash
npm run build
```

#### 3. 启动

```bash
npm run start
```

默认监听 `http://localhost:3000`。

#### 4. 使用 PM2 管理进程

安装 PM2：

```bash
npm install -g pm2
```

创建 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [{
    name: 'aggregation-email',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

启动应用：

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## SMTP 服务部署

SMTP 服务器作为独立进程运行，需要单独部署和管理。

### 端口配置建议

| 环境 | 推荐端口 | 说明 |
|------|----------|------|
| 开发环境 | 2525 | 默认端口，避免权限问题 |
| 生产环境 | 25 | 标准 SMTP 端口，需要 root 权限 |
| 生产环境 | 587 | SMTP 提交端口，推荐使用 |

> **注意**：使用 25 端口需要 root 权限，或使用端口转发。

### 启动 SMTP 服务

**使用 PM2 管理 SMTP 进程**

创建 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [
    {
      name: 'aggregation-email-web',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'aggregation-email-smtp',
      script: 'npm',
      args: 'run start:smtp',
      env: {
        NODE_ENV: 'production',
        SMTP_PORT: 587,
        SMTP_HOST: '0.0.0.0'
      }
    }
  ]
}
```

启动服务：

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Docker 部署 SMTP 服务

更新 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
      - "587:587"    # SMTP 端口
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/aggregation_email
      - JWT_SECRET=${JWT_SECRET}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
      - SMTP_PORT=587
      - SMTP_HOST=0.0.0.0
      - TLS_CERT_PATH=/app/certs/cert.pem
      - TLS_KEY_PATH=/app/certs/key.pem
    volumes:
      - ./certs:/app/certs:ro
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:14-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=aggregation_email
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

### Nginx 配置说明

> **重要**：SMTP 协议不需要通过 Nginx 代理，应直接暴露端口。

Nginx 仅代理 HTTP/HTTPS 流量，SMTP 端口直接对外开放：

```bash
# 检查 SMTP 端口监听状态
netstat -tlnp | grep 587

# 或使用 ss
ss -tlnp | grep 587
```

### TLS 证书配置

#### 使用 Let's Encrypt 证书

SMTP 服务可以复用 Let's Encrypt 证书：

```bash
# 证书路径
TLS_CERT_PATH=/etc/letsencrypt/live/your-domain.com/fullchain.pem
TLS_KEY_PATH=/etc/letsencrypt/live/your-domain.com/privkey.pem
```

配置环境变量：

```env
TLS_CERT_PATH=/etc/letsencrypt/live/your-domain.com/fullchain.pem
TLS_KEY_PATH=/etc/letsencrypt/live/your-domain.com/privkey.pem
```

#### 自签名证书（测试环境）

```bash
# 生成自签名证书
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# 设置权限
chmod 600 key.pem
chmod 644 cert.pem
```

### 防火墙配置

**开放 SMTP 端口**

```bash
# Ubuntu/Debian (ufw)
sudo ufw allow 587/tcp
sudo ufw reload

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-port=587/tcp
sudo firewall-cmd --reload

# 或使用 iptables
sudo iptables -A INPUT -p tcp --dport 587 -j ACCEPT
sudo iptables-save
```

**验证防火墙规则**

```bash
# 检查 ufw 状态
sudo ufw status

# 检查 firewalld 状态
sudo firewall-cmd --list-all
```

### SMTP 安全建议

1. **启用 TLS 加密**
   - 生产环境必须配置 TLS 证书
   - 强制客户端使用 STARTTLS

2. **限制连接速率**
   - 防止 SMTP 滥用
   - 使用 iptables 或应用层限流

3. **监控异常行为**
   - 记录所有 SMTP 连接
   - 监控发送频率异常

4. **反向 DNS 配置**
   - 配置 PTR 记录
   - 提高邮件送达率

---

### 方式二：Docker 部署

#### 1. 创建 Dockerfile

在项目根目录创建 `Dockerfile`：

```dockerfile
FROM node:18-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### 2. 创建 docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/aggregation_email
      - JWT_SECRET=${JWT_SECRET}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:14-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=aggregation_email
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

#### 3. 构建和启动

```bash
docker-compose up -d
```

#### 4. 运行数据库迁移

```bash
docker-compose exec app npx prisma migrate deploy
```

---

## Nginx 反向代理配置

### 基础配置

创建 `/etc/nginx/sites-available/aggregation-email`：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 启用配置

```bash
sudo ln -s /etc/nginx/sites-available/aggregation-email /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### HTTPS 配置（使用 Let's Encrypt）

安装 Certbot：

```bash
sudo apt install certbot python3-certbot-nginx
```

获取证书：

```bash
sudo certbot --nginx -d your-domain.com
```

自动更新证书：

```bash
sudo certbot renew --dry-run
```

完整 HTTPS 配置示例：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 安全建议

### 1. HTTPS 强制使用

- 生产环境必须使用 HTTPS
- 使用 Let's Encrypt 免费证书
- 配置 HTTP 自动跳转 HTTPS

### 2. 密钥管理

- **JWT_SECRET**：使用至少 64 字符的强随机字符串
- **ENCRYPTION_KEY**：必须为 32 字符，妥善保管
- 不要将密钥提交到代码仓库
- 使用环境变量或密钥管理服务

### 3. 数据库安全

- 使用强密码
- 限制数据库访问 IP
- 定期备份数据
- 启用 SSL 连接（PostgreSQL）

### 4. 应用安全

- 定期更新依赖包
- 启用安全响应头
- 配置请求速率限制
- 监控异常访问

### 5. Nginx 安全配置

```nginx
server {
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

### 6. 速率限制配置

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

server {
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://127.0.0.1:3000;
    }
}
```

---

## 监控和日志

### 应用日志

PM2 日志：

```bash
pm2 logs aggregation-email
```

### Nginx 日志

```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 健康检查

创建健康检查脚本：

```bash
curl -f http://localhost:3000/api/health || exit 1
```

---

## 备份策略

### 数据库备份

**PostgreSQL 自动备份脚本**：

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U aggregation_user aggregation_email > "$BACKUP_DIR/aggregation_email_$DATE.sql"
find $BACKUP_DIR -type f -mtime +7 -delete
```

配置定时任务：

```bash
crontab -e
0 2 * * * /path/to/backup.sh
```

### 应用备份

```bash
tar -czvf app_backup_$(date +%Y%m%d).tar.gz /path/to/app
```

---

## 故障排查

### 常见问题

**1. 应用无法启动**

检查日志：
```bash
pm2 logs aggregation-email
```

**2. 数据库连接失败**

检查连接字符串和网络：
```bash
psql -h localhost -U aggregation_user -d aggregation_email
```

**3. 端口被占用**

```bash
lsof -i :3000
kill -9 <PID>
```

**4. 内存不足**

增加服务器内存或配置 Node.js 内存限制：
```bash
NODE_OPTIONS="--max-old-space-size=2048" npm start
```

---

## 更新部署

```bash
git pull origin main
npm ci
npx prisma migrate deploy
npm run build
pm2 restart aggregation-email
```
