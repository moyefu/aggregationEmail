# Docker 部署指南

本文档详细介绍如何使用 Docker 和 Docker Compose 部署 aggregation-email 项目。

---

## 目录

1. [前置要求](#前置要求)
2. [快速开始](#快速开始)
3. [源码部署](#源码部署)
4. [Docker 部署](#docker-部署)
5. [Docker Compose 部署](#docker-compose-部署)
6. [生产环境配置](#生产环境配置)
7. [数据备份与恢复](#数据备份与恢复)
8. [常见问题解答](#常见问题解答)

---

## 前置要求

### 软件要求

| 软件 | 版本要求 | 说明 |
|------|----------|------|
| Docker | 20.x+ | 容器运行时 |
| Docker Compose | 2.x+ | 容器编排工具 |
| Node.js | 18.x+ | 源码部署需要 |
| npm/yarn/pnpm | 最新稳定版 | 源码部署需要 |

### 硬件要求

| 配置项 | 最低要求 | 推荐配置 |
|--------|----------|----------|
| CPU | 1 核 | 2 核+ |
| 内存 | 1 GB | 2 GB+ |
| 存储 | 10 GB | 20 GB+ SSD |

---

## 快速开始

### 使用 Docker Compose 一键部署

```bash
# 克隆项目
git clone https://github.com/your-repo/aggregation-email.git
cd aggregation-email

# 启动服务（默认使用 SQLite 数据库，数据存储在 Docker 卷中）
docker-compose up -d
```

服务将在以下端口启动：
- Web 界面：http://localhost:3000
- SMTP 服务：localhost:2525
- 数据库：SQLite（存储在 Docker 数据卷 `app_data`）

> **提示**：默认配置使用 SQLite，数据持久化在 Docker 卷中。如需 PostgreSQL，请参考 [生产环境配置](#生产环境配置) 章节。

---

## 源码部署

### 1. 安装 Node.js

**Ubuntu/Debian**

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

**CentOS/RHEL**

```bash
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

### 2. 克隆项目

```bash
git clone https://github.com/your-repo/aggregation-email.git
cd aggregation-email
```

### 3. 安装依赖

```bash
npm ci
```

### 4. 配置环境变量

创建 `.env` 文件：

```env
# 数据库配置
DATABASE_URL="postgresql://user:password@localhost:5432/aggregation_email"

# 安全密钥
JWT_SECRET="your-super-secret-jwt-key-at-least-32-characters-long"
ENCRYPTION_KEY="your-32-character-encryption-key"

# SMTP 服务配置
SMTP_HOST=0.0.0.0
SMTP_PORT=2525

# 站点 SMTP 配置（用于发送验证码、密码重置邮件）
SITE_SMTP_HOST=smtp.example.com
SITE_SMTP_PORT=465
SITE_SMTP_USER=noreply@example.com
SITE_SMTP_PASSWORD=your-smtp-password
SITE_SMTP_FROM=noreply@example.com

# API 密钥数量限制
MAX_API_KEYS_PER_USER=10

# 管理员账户
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-admin-password
```

### 5. 生成安全密钥

```bash
# 生成 JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 生成 ENCRYPTION_KEY（必须为 32 字符）
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

### 6. 初始化数据库

```bash
# 同步数据库结构
npx prisma db push

# 生成 Prisma Client
npx prisma generate

# 初始化种子数据
npm run db:seed
```

### 7. 构建应用

```bash
npm run build
```

### 8. 使用 PM2 管理进程

安装 PM2：

```bash
npm install -g pm2
```

创建 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [
    {
      name: 'aggregation-email',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        SMTP_PORT: 2525,
        SMTP_HOST: '0.0.0.0'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    }
  ]
}
```

启动应用：

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 9. 配置 Nginx 反向代理

创建 Nginx 配置：

```bash
sudo nano /etc/nginx/sites-available/aggregation-email
```

配置内容：

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

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/aggregation-email /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 10. 配置 HTTPS（推荐）

使用 Let's Encrypt：

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Docker 部署

### 构建 Docker 镜像

项目提供了完整的 Dockerfile，支持多阶段构建。

**使用 npm 脚本构建：**

```bash
npm run docker:build
```

**或手动构建：**

```bash
docker build -t moyefu/aggregation_email:latest .
```

**指定版本标签：**

```bash
docker build -t moyefu/aggregation_email:1.0.0 .
```

### 运行 Docker 容器

**基本运行：**

```bash
docker run -d \
  --name aggregation-email \
  -p 3000:3000 \
  -p 2525:2525 \
  --env-file .env \
  moyefu/aggregation_email:latest
```

**使用环境变量运行（默认 SQLite）：**

```bash
docker run -d \
  --name aggregation-email \
  -p 3000:3000 \
  -p 2525:2525 \
  -e DATABASE_URL="file:./data/prod.db" \
  -e JWT_SECRET="your-jwt-secret" \
  -e ENCRYPTION_KEY="your-32-char-encryption-key" \
  -e SMTP_HOST=0.0.0.0 \
  -e SMTP_PORT=2525 \
  -v $(pwd)/data:/app/data \
  moyefu/aggregation_email:latest
```

**挂载数据卷（SQLite）：**

```bash
docker run -d \
  --name aggregation-email \
  -p 3000:3000 \
  -p 2525:2525 \
  -v $(pwd)/data:/app/data \
  moyefu/aggregation_email:latest
```

### 推送到 Docker Hub

```bash
# 登录 Docker Hub
docker login

# 推送镜像
npm run docker:push

# 或手动推送
docker push moyefu/aggregation_email:latest
```

### Docker 常用命令

```bash
# 查看容器日志
docker logs aggregation-email

# 实时查看日志
docker logs -f aggregation-email

# 进入容器
docker exec -it aggregation-email sh

# 停止容器
docker stop aggregation-email

# 启动容器
docker start aggregation-email

# 删除容器
docker rm aggregation-email

# 删除镜像
docker rmi moyefu/aggregation_email:latest
```

---

## Docker Compose 部署

### 开发环境部署

使用 `docker-compose.yml` 进行开发环境部署：

```bash
docker-compose up -d
```

配置说明：

- 使用 SQLite 数据库（数据存储在 Docker 数据卷 `app_data`）
- 端口映射：3000（Web）、2525（SMTP）
- 数据持久化：Docker 数据卷

### 生产环境部署

使用 `docker-compose.prod.yml` 进行生产环境部署（默认 SQLite）：

```bash
# 启动服务
docker-compose -f docker-compose.prod.yml up -d
```

**可选：配置环境变量文件 `.env.prod`：**

```env
# 安全密钥（建议修改）
JWT_SECRET=your-super-secret-jwt-key-at-least-64-characters-long
ENCRYPTION_KEY=your-32-character-encryption-key

# 站点 SMTP 配置（用于发送验证码等）
SITE_SMTP_HOST=smtp.example.com
SITE_SMTP_PORT=465
SITE_SMTP_USER=noreply@example.com
SITE_SMTP_PASSWORD=your-smtp-password
SITE_SMTP_FROM=noreply@example.com

# API 密钥限制
MAX_API_KEYS_PER_USER=10

# 管理员账户
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-admin-password
```

**使用自定义环境变量启动：**

```bash
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
```
POSTGRES_USER=admin
**查看服务状态：**

```bash
docker-compose -f docker-compose.prod.yml ps
```

**查看日志：**

```bash
docker-compose -f docker-compose.prod.yml logs -f
```

**停止服务：**

```bash
docker-compose -f docker-compose.prod.yml down
```

### Docker Compose 配置详解

**docker-compose.prod.yml 结构（默认 SQLite）：**

```yaml
version: '3.8'

services:
  app:
    image: moyefu/aggregation_email:latest
    ports:
      - "3000:3000"    # Web 端口
      - "2525:2525"    # SMTP 端口
    environment:
      - DATABASE_URL=file:./data/prod.db
      - JWT_SECRET=${JWT_SECRET:-your-jwt-secret-change-in-production}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY:-your-32-character-encryption-key}
      - SMTP_HOST=0.0.0.0
      - SMTP_PORT=2525
      - SITE_SMTP_HOST=${SITE_SMTP_HOST}
      - SITE_SMTP_PORT=${SITE_SMTP_PORT}
      - SITE_SMTP_USER=${SITE_SMTP_USER}
      - SITE_SMTP_PASSWORD=${SITE_SMTP_PASSWORD}
      - SITE_SMTP_FROM=${SITE_SMTP_FROM}
      - MAX_API_KEYS_PER_USER=${MAX_API_KEYS_PER_USER:-10}
      - ADMIN_USERNAME=${ADMIN_USERNAME:-admin}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD:-admin123}
      - NODE_ENV=production
    volumes:
      - app_data:/app/data
    restart: always

volumes:
  app_data:
```

---

## 生产环境配置

### 1. 环境变量配置

**必需环境变量：**

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| DATABASE_URL | 数据库连接字符串 | file:./data/prod.db (SQLite) |
| JWT_SECRET | JWT 签名密钥 | 需修改为强随机字符串 |
| ENCRYPTION_KEY | AES-256 加密密钥 | 需修改为 32 字符字符串 |

**可选环境变量：**

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| SMTP_HOST | SMTP 绑定地址 | 0.0.0.0 |
| SMTP_PORT | SMTP 端口 | 2525 |
| MAX_API_KEYS_PER_USER | 每用户 API 密钥上限 | 10 |
| SITE_SMTP_HOST | 站点 SMTP 服务器 | - |
| SITE_SMTP_PORT | 站点 SMTP 端口 | - |
| SITE_SMTP_USER | 站点 SMTP 用户 | - |
| SITE_SMTP_PASSWORD | 站点 SMTP 密码 | - |
| SITE_SMTP_FROM | 站点发件人地址 | - |
| ADMIN_USERNAME | 管理员用户名 | - |
| ADMIN_PASSWORD | 管理员密码 | - |

### 2. 端口配置

| 端口 | 服务 | 说明 |
|------|------|------|
| 3000 | Web 服务 | HTTP API 和前端界面 |
| 2525 | SMTP 服务 | 邮件接收服务（开发端口） |
| 25 | SMTP 服务 | 标准 SMTP 端口（生产环境） |
| 587 | SMTP 服务 | SMTP 提交端口（推荐） |

**生产环境 SMTP 端口映射：**

```yaml
ports:
  - "3000:3000"
  - "587:2525"    # 将容器 2525 映射到主机 587
```

### 3. 数据持久化

**PostgreSQL 数据卷：**

```yaml
volumes:
  postgres_data:
```

**SQLite 数据卷（开发环境）：**

```yaml
volumes:
  - ./data:/app/prisma
```

### 4. 健康检查

添加健康检查配置：

```yaml
services:
  app:
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### 5. 资源限制

配置容器资源限制：

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### 6. 日志配置

```yaml
services:
  app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 7. 网络配置

创建独立网络：

```yaml
networks:
  app-network:
    driver: bridge

services:
  app:
    networks:
      - app-network
  postgres:
    networks:
      - app-network
```

---

## 数据备份与恢复

### SQLite 备份（默认）

**从 Docker 卷备份：**

```bash
# 方法一：使用 docker cp 复制数据库文件
docker cp aggregation-email:/app/data/prod.db ./backup/prod_$(date +%Y%m%d_%H%M%S).db

# 方法二：通过临时容器备份整个卷
docker run --rm \
  -v aggregation-email_app_data:/data \
  -v $(pwd)/backup:/backup \
  alpine cp /data/prod.db /backup/prod_$(date +%Y%m%d_%H%M%S).db
```

**自动备份脚本：**

创建 `backup.sh`：

```bash
#!/bin/bash
BACKUP_DIR="./backup"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 从 Docker 卷复制数据库
docker cp aggregation-email:/app/data/prod.db "$BACKUP_DIR/prod_$DATE.db"

# 压缩备份
gzip "$BACKUP_DIR/prod_$DATE.db"

# 删除 7 天前的备份
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: prod_$DATE.db.gz"
```

配置定时任务：

```bash
chmod +x backup.sh
crontab -e

# 每天凌晨 2 点执行备份
0 2 * * * /path/to/backup.sh >> /var/log/backup.log 2>&1
```

### SQLite 恢复

**恢复到 Docker 卷：**

```bash
# 方法一：使用 docker cp 恢复
docker cp ./backup/prod_20240101.db aggregation-email:/app/data/prod.db

# 方法二：通过临时容器恢复整个卷
docker run --rm \
  -v aggregation-email_app_data:/data \
  -v $(pwd)/backup:/backup \
  alpine cp /backup/prod_20240101.db /data/prod.db

# 重启服务使数据库生效
docker-compose restart
```

**从压缩文件恢复：**

```bash
gunzip -c ./backup/prod_20240101.db.gz | docker run --rm \
  -v aggregation-email_app_data:/data \
  -v $(pwd)/backup:/backup \
  alpine sh -c "cat > /data/prod.db"
```

### Docker 卷管理

**查看数据卷：**

```bash
# 列出所有卷
docker volume ls

# 查看卷详情
docker volume inspect aggregation-email_app_data
```

**备份整个数据卷：**

```bash
docker run --rm \
  -v aggregation-email_app_data:/data \
  -v $(pwd)/backup:/backup \
  alpine tar czf /backup/volume_$(date +%Y%m%d).tar.gz /data
```

**恢复数据卷：**

```bash
docker run --rm \
  -v aggregation-email_app_data:/data \
  -v $(pwd)/backup:/backup \
  alpine tar xzf /backup/volume_20240101.tar.gz -C /
```

### PostgreSQL 备份（可选）

如需使用 PostgreSQL，备份方式如下：

**手动备份：**

```bash
docker exec aggregation-email-db pg_dump -U admin aggregation_email > backup_$(date +%Y%m%d).sql
```

**恢复：**

```bash
cat backup_20240101.sql | docker exec -i aggregation-email-db psql -U admin aggregation_email
```

### Docker 卷备份

```bash
# 备份卷
docker run --rm \
  -v aggregation-email_postgres_data:/data \
  -v $(pwd)/backup:/backup \
  alpine tar czf /backup/volume_backup_$(date +%Y%m%d).tar.gz /data

# 恢复卷
docker run --rm \
  -v aggregation-email_postgres_data:/data \
  -v $(pwd)/backup:/backup \
  alpine tar xzf /backup/volume_backup_20240101.tar.gz -C /
```

---

## 常见问题解答

### Q1: Docker 容器无法启动

**问题：** 容器启动后立即退出

**解决方案：**

```bash
# 查看容器日志
docker logs aggregation-email

# 常见原因：
# 1. 数据库连接失败 - 检查 DATABASE_URL
# 2. 环境变量缺失 - 检查 .env 文件
# 3. 端口冲突 - 检查端口占用
```

### Q2: 数据库连接失败

**问题：** `Error: Can't reach database server`

**解决方案：**

```bash
# 检查数据库容器状态
docker-compose -f docker-compose.prod.yml ps

# 检查网络连接
docker-compose -f docker-compose.prod.yml exec app ping postgres

# 确保数据库已启动
docker-compose -f docker-compose.prod.yml up -d postgres

# 等待数据库就绪后再启动应用
docker-compose -f docker-compose.prod.yml up -d --wait postgres
docker-compose -f docker-compose.prod.yml up -d app
```

### Q3: SMTP 服务无法接收邮件

**问题：** 邮件发送到 SMTP 端口但无法接收

**解决方案：**

```bash
# 检查 SMTP 端口是否监听
docker-compose -f docker-compose.prod.yml exec app netstat -tlnp | grep 2525

# 检查防火墙
sudo ufw allow 2525/tcp

# 测试 SMTP 连接
telnet localhost 2525

# 检查日志
docker-compose -f docker-compose.prod.yml logs -f app | grep SMTP
```

### Q4: 如何更新 Docker 镜像

**解决方案：**

```bash
# 拉取最新镜像
docker pull moyefu/aggregation_email:latest

# 停止并删除旧容器
docker-compose -f docker-compose.prod.yml down

# 启动新容器
docker-compose -f docker-compose.prod.yml up -d
```

### Q5: 如何查看容器内日志

**解决方案：**

```bash
# 查看所有日志
docker-compose -f docker-compose.prod.yml logs app

# 实时查看日志
docker-compose -f docker-compose.prod.yml logs -f app

# 查看最近 100 行
docker-compose -f docker-compose.prod.yml logs --tail=100 app
```

### Q6: 如何进入容器调试

**解决方案：**

```bash
# 进入容器
docker-compose -f docker-compose.prod.yml exec app sh

# 检查数据库连接
docker-compose -f docker-compose.prod.yml exec app npx prisma db pull

# 运行数据库迁移
docker-compose -f docker-compose.prod.yml exec app npx prisma db push
```

### Q7: 如何重置管理员密码

**解决方案：**

```bash
# 进入容器
docker-compose -f docker-compose.prod.yml exec app sh

# 运行种子脚本重置管理员
npx tsx prisma/seed.ts
```

### Q8: 内存不足问题

**问题：** 容器内存占用过高

**解决方案：**

```yaml
# 在 docker-compose.prod.yml 中添加资源限制
services:
  app:
    deploy:
      resources:
        limits:
          memory: 1G
```

或设置 Node.js 内存限制：

```yaml
environment:
  - NODE_OPTIONS=--max-old-space-size=512
```

### Q9: 如何配置 HTTPS

**解决方案：**

使用 Nginx 反向代理：

```yaml
# 添加 Nginx 服务
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - app
```

### Q10: 数据库迁移问题

**问题：** 切换数据库后数据丢失

**解决方案：**

SQLite 和 PostgreSQL 数据不互通，切换数据库需要：

1. 备份旧数据库数据
2. 修改 DATABASE_URL
3. 重新启动容器（会自动创建表结构）
4. 手动迁移数据

---

## 附录

### 完整 docker-compose.prod.yml 示例（SQLite）

```yaml
version: '3.8'

services:
  app:
    image: moyefu/aggregation_email:latest
    container_name: aggregation-email
    ports:
      - "3000:3000"
      - "2525:2525"
    environment:
      - DATABASE_URL=file:./data/prod.db
      - JWT_SECRET=${JWT_SECRET:-your-jwt-secret-change-in-production}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY:-your-32-character-encryption-key}
      - SMTP_HOST=0.0.0.0
      - SMTP_PORT=2525
      - SITE_SMTP_HOST=${SITE_SMTP_HOST}
      - SITE_SMTP_PORT=${SITE_SMTP_PORT}
      - SITE_SMTP_USER=${SITE_SMTP_USER}
      - SITE_SMTP_PASSWORD=${SITE_SMTP_PASSWORD}
      - SITE_SMTP_FROM=${SITE_SMTP_FROM}
      - MAX_API_KEYS_PER_USER=${MAX_API_KEYS_PER_USER:-10}
      - ADMIN_USERNAME=${ADMIN_USERNAME:-admin}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD:-admin123}
      - NODE_ENV=production
    volumes:
      - app_data:/app/data
    restart: always
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

volumes:
  app_data:
```

### 完整 .env.prod 示例（可选配置）

```env
# 安全密钥（建议修改）
JWT_SECRET=your-super-secret-jwt-key-at-least-64-characters-long-random-string
ENCRYPTION_KEY=your-32-character-encryption-key

# SMTP 服务配置
SMTP_HOST=0.0.0.0
SMTP_PORT=2525

# 站点 SMTP 配置（用于发送验证码等）
SITE_SMTP_HOST=smtp.example.com
SITE_SMTP_PORT=465
SITE_SMTP_USER=noreply@example.com
SITE_SMTP_PASSWORD=your-smtp-password
SITE_SMTP_FROM=noreply@example.com

# API 密钥限制
MAX_API_KEYS_PER_USER=10

# 管理员账户
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-admin-password

# 环境
NODE_ENV=production
```