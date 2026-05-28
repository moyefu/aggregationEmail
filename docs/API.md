# API 接口文档

本文档描述了 aggregation-email 平台的所有 API 接口。

## 基础信息

- **基础 URL**: `http://localhost:3000/api`（开发环境）
- **内容类型**: `application/json`
- **字符编码**: `UTF-8`

## 认证方式

### JWT 认证（Web 界面）

用于 Web 页面登录后的 API 调用，支持两种方式：

1. **Cookie 方式**：登录后 Token 自动存储在 Cookie 中
2. **Authorization Header**：`Authorization: Bearer <token>`

### API Key 认证（外部调用）

用于通过 API 发送邮件等操作：

```
Authorization: Bearer ea_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 通用响应格式

### 成功响应

```json
{
  "message": "操作成功",
  "data": { }
}
```

### 错误响应

```json
{
  "error": "错误信息描述"
}
```

### 分页响应

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

---

## 一、认证相关 API

### 1.1 用户注册

注册新用户账户。

**请求**

```
POST /api/auth/register
```

**请求头**

| 参数 | 值 | 必填 |
|------|-----|------|
| Content-Type | application/json | 是 |

**请求体**

```json
{
  "email": "user@example.com",
  "password": "Password123",
  "name": "用户名",
  "code": "123456"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 邮箱地址，需符合邮箱格式 |
| password | string | 是 | 密码，至少 8 位，包含大小写字母和数字 |
| name | string | 否 | 用户昵称 |
| code | string | 是 | 邮箱验证码 |

**成功响应** (201)

```json
{
  "message": "注册成功",
  "user": {
    "id": "clxxx...",
    "email": "user@example.com",
    "name": "用户名",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**错误响应**

| 状态码 | 错误信息 | 说明 |
|--------|----------|------|
| 400 | 邮箱和密码为必填项 | 缺少必填字段 |
| 400 | 邮箱格式不正确 | 邮箱格式验证失败 |
| 400 | 密码长度至少为 8 个字符 | 密码长度不足 |
| 400 | 密码必须包含至少一个大写字母 | 密码复杂度要求 |
| 400 | 密码必须包含至少一个小写字母 | 密码复杂度要求 |
| 400 | 密码必须包含至少一个数字 | 密码复杂度要求 |
| 409 | 该邮箱已被注册 | 邮箱已存在 |
| 500 | 服务器内部错误 | 服务器异常 |

---

### 1.2 用户登录

用户登录获取 JWT Token。

**请求**

```
POST /api/auth/login
```

**请求头**

| 参数 | 值 | 必填 |
|------|-----|------|
| Content-Type | application/json | 是 |

**请求体**

```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 注册邮箱 |
| password | string | 是 | 密码 |

**成功响应** (200)

```json
{
  "message": "登录成功",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clxxx...",
    "email": "user@example.com",
    "name": "用户名"
  }
}
```

**错误响应**

| 状态码 | 错误信息 | 说明 |
|--------|----------|------|
| 400 | 邮箱和密码为必填项 | 缺少必填字段 |
| 401 | 邮箱或密码错误 | 邮箱不存在或密码错误 |
| 500 | 服务器内部错误 | 服务器异常 |

---

### 1.3 用户登出

用户登出账户。

**请求**

```
POST /api/auth/logout
```

**请求头**

| 参数 | 值 | 必填 |
|------|-----|------|
| Content-Type | application/json | 是 |
| Authorization | Bearer \<token\> | 是 |

**成功响应** (200)

```json
{
  "message": "登出成功"
}
```

---

### 1.4 发送验证码

发送邮箱验证码，用于注册验证或密码重置。

**请求**

```
POST /api/auth/send-code
```

**请求头**

| 参数 | 值 | 必填 |
|------|-----|------|
| Content-Type | application/json | 是 |

**请求体**

```json
{
  "email": "user@example.com",
  "type": "REGISTER"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 邮箱地址 |
| type | string | 是 | 验证码类型：`REGISTER`（注册）或 `RESET_PASSWORD`（重置密码） |

**成功响应** (200)

```json
{
  "message": "验证码已发送"
}
```

**错误响应**

| 状态码 | 错误信息 | 说明 |
|--------|----------|------|
| 400 | 验证码类型无效 | type 参数不是 REGISTER 或 RESET_PASSWORD |
| 400 | 该邮箱已注册 | REGISTER 类型时邮箱已存在 |
| 400 | 该邮箱不存在 | RESET_PASSWORD 类型时邮箱不存在 |
| 429 | 发送频率过高，请稍后再试 | 验证码发送过于频繁 |

---

### 1.5 忘记密码

申请密码重置链接。

**请求**

```
POST /api/auth/forgot-password
```

**请求头**

| 参数 | 值 | 必填 |
|------|-----|------|
| Content-Type | application/json | 是 |

**请求体**

```json
{
  "email": "user@example.com"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 注册邮箱地址 |

**成功响应** (200)

```json
{
  "message": "密码重置链接已发送到您的邮箱"
}
```

**错误响应**

| 状态码 | 错误信息 | 说明 |
|--------|----------|------|
| 400 | 邮箱为必填项 | 未提供邮箱 |
| 400 | 邮箱格式不正确 | 邮箱格式验证失败 |

---

### 1.6 重置密码

通过重置链接设置新密码。

**请求**

```
POST /api/auth/reset-password
```

**请求头**

| 参数 | 值 | 必填 |
|------|-----|------|
| Content-Type | application/json | 是 |

**请求体**

```json
{
  "email": "user@example.com",
  "token": "reset-token-from-email",
  "password": "NewPassword123"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 邮箱地址 |
| token | string | 是 | 邮件中的重置令牌 |
| password | string | 是 | 新密码，至少 8 位，包含大小写字母和数字 |

**成功响应** (200)

```json
{
  "message": "密码重置成功"
}
```

**错误响应**

| 状态码 | 错误信息 | 说明 |
|--------|----------|------|
| 400 | 重置链接无效或已过期 | token 无效或已过期 |
| 400 | 密码长度至少为 8 个字符 | 密码长度不足 |
| 400 | 密码必须包含至少一个大写字母 | 密码复杂度要求 |
| 400 | 密码必须包含至少一个小写字母 | 密码复杂度要求 |
| 400 | 密码必须包含至少一个数字 | 密码复杂度要求 |

---

## 二、邮箱管理 API

> 以下接口需要 JWT 认证

### 2.1 获取邮箱列表

获取当前用户的所有邮箱账户。

**请求**

```
GET /api/email-accounts
```

**请求头**

| 参数 | 值 | 必填 |
|------|-----|------|
| Authorization | Bearer \<token\> | 是 |

**查询参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| limit | number | 否 | 10 | 每页数量 |

**成功响应** (200)

```json
{
  "emailAccounts": [
    {
      "id": "clxxx...",
      "smtpHost": "smtp.gmail.com",
      "smtpPort": 587,
      "smtpUser": "user@gmail.com",
      "fromEmail": "user@gmail.com",
      "fromName": "发件人名称",
      "isVerified": true,
      "proxy": {
        "id": "clyyy...",
        "name": "香港代理",
        "host": "proxy.example.com",
        "port": 1080,
        "protocol": "HTTP"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

> **说明**：`proxy` 字段表示该邮箱账户关联的代理配置，若未关联代理则为 `null`。

**错误响应**

| 状态码 | 错误信息 | 说明 |
|--------|----------|------|
| 401 | 未授权访问，请先登录 | Token 无效或过期 |
| 500 | 服务器内部错误 | 服务器异常 |

---

### 2.2 添加邮箱账户

添加新的 SMTP 邮箱账户。

**请求**

```
POST /api/email-accounts
```

**请求头**

| 参数 | 值 | 必填 |
|------|-----|------|
| Content-Type | application/json | 是 |
| Authorization | Bearer \<token\> | 是 |

**请求体**

```json
{
  "smtpHost": "smtp.gmail.com",
  "smtpPort": 587,
  "smtpUser": "user@gmail.com",
  "smtpPassword": "your-app-password",
  "fromEmail": "user@gmail.com",
  "fromName": "发件人名称",
  "proxyId": "clyyy..."
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| smtpHost | string | 是 | SMTP 服务器地址 |
| smtpPort | number | 是 | SMTP 端口（1-65535） |
| smtpUser | string | 是 | SMTP 用户名（通常为邮箱地址） |
| smtpPassword | string | 是 | SMTP 密码或应用专用密码 |
| fromEmail | string | 是 | 发件人邮箱地址 |
| fromName | string | 否 | 发件人显示名称 |
| proxyId | string | 否 | 关联的代理 ID，不指定则不使用代理 |

**成功响应** (200)

```json
{
  "message": "邮箱账户添加成功",
  "emailAccount": {
    "id": "clxxx...",
    "smtpHost": "smtp.gmail.com",
    "smtpPort": 587,
    "smtpUser": "user@gmail.com",
    "fromEmail": "user@gmail.com",
    "fromName": "发件人名称",
    "isVerified": true,
    "proxy": {
      "id": "clyyy...",
      "name": "香港代理",
      "host": "proxy.example.com",
      "port": 1080,
      "protocol": "HTTP"
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**错误响应**

| 状态码 | 错误信息 | 说明 |
|--------|----------|------|
| 400 | 缺少必填字段 | 未提供必要参数 |
| 400 | 发件人邮箱格式不正确 | 邮箱格式验证失败 |
| 400 | 端口号必须是 1-65535 之间的有效数字 | 端口范围错误 |
| 400 | SMTP 验证失败: xxx | SMTP 连接验证失败 |
| 400 | 该邮箱账户已存在 | 重复添加 |
| 401 | 未授权访问，请先登录 | Token 无效或过期 |
| 500 | 服务器内部错误 | 服务器异常 |

---

### 2.3 编辑邮箱账户

编辑指定的邮箱账户信息。

**请求**

```
PUT /api/email-accounts/{id}
```

**请求头**

| 参数 | 值 | 必填 |
|------|-----|------|
| Content-Type | application/json | 是 |
| Authorization | Bearer \<token\> | 是 |

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 邮箱账户 ID |

**请求体**

```json
{
  "smtpHost": "smtp.gmail.com",
  "smtpPort": 587,
  "smtpUser": "user@gmail.com",
  "smtpPassword": "new-app-password",
  "fromEmail": "user@gmail.com",
  "fromName": "新发件人名称",
  "proxyId": "clyyy..."
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| smtpHost | string | 是 | SMTP 服务器地址 |
| smtpPort | number | 是 | SMTP 端口（1-65535） |
| smtpUser | string | 是 | SMTP 用户名（通常为邮箱地址） |
| smtpPassword | string | 否 | SMTP 密码或应用专用密码，不传则保持原密码 |
| fromEmail | string | 是 | 发件人邮箱地址 |
| fromName | string | 否 | 发件人显示名称 |
| proxyId | string | 否 | 关联的代理 ID，传 null 清除代理关联 |

**成功响应** (200)

```json
{
  "message": "邮箱账户更新成功",
  "emailAccount": {
    "id": "clxxx...",
    "smtpHost": "smtp.gmail.com",
    "smtpPort": 587,
    "smtpUser": "user@gmail.com",
    "fromEmail": "user@gmail.com",
    "fromName": "新发件人名称",
    "isVerified": true,
    "proxy": {
      "id": "clyyy...",
      "name": "香港代理",
      "host": "proxy.example.com",
      "port": 1080,
      "protocol": "HTTP"
    },
    "updatedAt": "2024-01-15T00:00:00.000Z"
  }
}
```

**错误响应**

| 状态码 | 错误信息 | 说明 |
|--------|----------|------|
| 400 | 缺少必填字段 | 未提供必要参数 |
| 400 | 发件人邮箱格式不正确 | 邮箱格式验证失败 |
| 400 | 端口号必须是 1-65535 之间的有效数字 | 端口范围错误 |
| 400 | SMTP 验证失败: xxx | SMTP 连接验证失败 |
| 401 | 未授权访问，请先登录 | Token 无效或过期 |
| 403 | 无权编辑此邮箱账户 | 非账户所有者 |
| 404 | 邮箱账户不存在 | 账户不存在 |
| 500 | 服务器内部错误 | 服务器异常 |

---

### 2.4 删除邮箱账户

删除指定的邮箱账户。

**请求**

```
DELETE /api/email-accounts/{id}
```

**请求头**

| 参数 | 值 | 必填 |
|------|-----|------|
| Authorization | Bearer \<token\> | 是 |

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 邮箱账户 ID |

**成功响应** (200)

```json
{
  "message": "邮箱账户删除成功"
}
```

**错误响应**

| 状态码 | 错误信息 | 说明 |
|--------|----------|------|
| 401 | 未授权访问，请先登录 | Token 无效或过期 |
| 403 | 无权删除此邮箱账户 | 非账户所有者 |
| 404 | 邮箱账户不存在 | 账户不存在 |
| 500 | 服务器内部错误 | 服务器异常 |

---

## 三、代理管理 API

> 以下接口需要 JWT 认证

### 3.1 获取代理列表

获取当前用户的所有代理配置（分页）。

**请求**

```
GET /api/proxies
```

**请求头**

| 参数 | 值 | 必填 |
|------|-----|------|
| Authorization | Bearer \<token\> | 是 |

**查询参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| limit | number | 否 | 10 | 每页数量 |

**成功响应** (200)

```json
{
  "proxies": [
    {
      "id": "clxxx...",
      "name": "香港代理",
      "host": "proxy.example.com",
      "port": 1080,
      "username": "user1",
      "password": null,
      "protocol": "HTTP",
      "isActive": true,
      "lastTestAt": "2024-01-01T00:00:00.000Z",
      "lastTestResult": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

**错误响应**

| 状态码 | 错误信息 | 说明 |
|--------|----------|------|
| 401 | 未授权访问，请先登录 | Token 无效或过期 |
| 500 | 服务器内部错误 | 服务器异常 |

---

### 3.2 添加代理

添加新的代理配置。

**请求**

```
POST /api/proxies
```

**请求头**

| 参数 | 值 | 必填 |
|------|-----|------|
| Content-Type | application/json | 是 |
| Authorization | Bearer \<token\> | 是 |

**请求体**

```json
{
  "name": "香港代理",
  "host": "proxy.example.com",
  "port": 1080,
  "username": "user1",
  "password": "pass123",
  "protocol": "HTTP"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 代理名称，用于识别 |
| host | string | 是 | 代理服务器地址 |
| port | number | 是 | 代理端口（1-65535） |
| username | string | 否 | 代理认证用户名 |
| password | string | 否 | 代理认证密码 |
| protocol | string | 是 | 代理协议：`HTTP`、`HTTPS` 或 `SOCKS5` |

**成功响应** (200)

```json
{
  "message": "代理添加成功",
  "proxy": {
    "id": "clxxx...",
    "name": "香港代理",
    "host": "proxy.example.com",
    "port": 1080,
    "username": "user1",
    "password": null,
    "protocol": "HTTP",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**错误响应**

| 状态码 | 错误信息 | 说明 |
|--------|----------|------|
| 400 | 缺少必填字段 | 未提供必要参数 |
| 400 | 端口号必须是 1-65535 之间的有效数字 | 端口范围错误 |
| 400 | 代理协议必须是 HTTP、HTTPS 或 SOCKS5 | protocol 值错误 |
| 401 | 未授权访问，请先登录 | Token 无效或过期 |
| 500 | 服务器内部错误 | 服务器异常 |

---

### 3.3 编辑代理

编辑指定的代理配置。

**请求**

```
PUT /api/proxies/{id}
```

**请求头**

| 参数 | 值 | 必填 |
|------|-----|------|
| Content-Type | application/json | 是 |
| Authorization | Bearer \<token\> | 是 |

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 代理 ID |

**请求体**

```json
{
  "name": "香港代理-更新",
  "host": "proxy2.example.com",
  "port": 1081,
  "username": "user2",
  "password": "newpass",
  "protocol": "SOCKS5",
  "isActive": true
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 代理名称 |
| host | string | 是 | 代理服务器地址 |
| port | number | 是 | 代理端口（1-65535） |
| username | string | 否 | 代理认证用户名 |
| password | string | 否 | 代理认证密码 |
| protocol | string | 是 | 代理协议：`HTTP`、`HTTPS` 或 `SOCKS5` |
| isActive | boolean | 是 | 是否启用 |

**成功响应** (200)

```json
{
  "message": "代理更新成功",
  "proxy": {
    "id": "clxxx...",
    "name": "香港代理-更新",
    "host": "proxy2.example.com",
    "port": 1081,
    "username": "user2",
    "password": null,
    "protocol": "SOCKS5",
    "isActive": true,
    "updatedAt": "2024-01-15T00:00:00.000Z"
  }
}
```

**错误响应**

| 状态码 | 错误信息 | 说明 |
|--------|----------|------|
| 400 | 缺少必填字段 | 未提供必要参数 |
| 400 | 端口号必须是 1-65535 之间的有效数字 | 端口范围错误 |
| 400 | 代理协议必须是 HTTP、HTTPS 或 SOCKS5 | protocol 值错误 |
| 401 | 未授权访问，请先登录 | Token 无效或过期 |
| 403 | 无权编辑此代理 | 非代理所有者 |
| 404 | 代理不存在 | 代理不存在 |
| 500 | 服务器内部错误 | 服务器异常 |

---

### 3.4 删除代理

删除指定的代理配置。

**请求**

```
DELETE /api/proxies/{id}
```

**请求头**

| 参数 | 值 | 必填 |
|------|-----|------|
| Authorization | Bearer \<token\> | 是 |

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 代理 ID |

**成功响应** (200)

```json
{
  "message": "代理删除成功"
}
```

**错误响应**

| 状态码 | 错误信息 | 说明 |
|--------|----------|------|
| 401 | 未授权访问，请先登录 | Token 无效或过期 |
| 403 | 无权删除此代理 | 非代理所有者 |
| 404 | 代理不存在 | 代理不存在 |
| 500 | 服务器内部错误 | 服务器异常 |

---

### 3.5 测试已保存代理

测试已保存的代理配置是否可用。

**请求**

```
POST /api/proxies/{id}/test
```

**请求头**

| 参数 | 值 | 必填 |
|------|-----|------|
| Authorization | Bearer \<token\> | 是 |

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 代理 ID |

**成功响应** (200)

```json
{
  "success": true,
  "latency": 150,
  "error": null
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| success | boolean | 测试是否成功 |
| latency | number | 延迟时间（毫秒），失败时为 null |
| error | string | 错误信息，成功时为 null |

**错误响应**

| 状态码 | 错误信息 | 说明 |
|--------|----------|------|
| 401 | 未授权访问，请先登录 | Token 无效或过期 |
| 403 | 无权测试此代理 | 非代理所有者 |
| 404 | 代理不存在 | 代理不存在 |
| 500 | 服务器内部错误 | 服务器异常 |

---

### 3.6 测试代理配置（预测试）

在保存前测试代理配置是否可用。

**请求**

```
POST /api/proxies/test
```

**请求头**

| 参数 | 值 | 必填 |
|------|-----|------|
| Content-Type | application/json | 是 |
| Authorization | Bearer \<token\> | 是 |

**请求体**

```json
{
  "host": "proxy.example.com",
  "port": 1080,
  "username": "user1",
  "password": "pass123",
  "protocol": "HTTP"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| host | string | 是 | 代理服务器地址 |
| port | number | 是 | 代理端口（1-65535） |
| username | string | 否 | 代理认证用户名 |
| password | string | 否 | 代理认证密码 |
| protocol | string | 是 | 代理协议：`HTTP`、`HTTPS` 或 `SOCKS5` |

**成功响应** (200)

```json
{
  "success": true,
  "latency": 150,
  "error": null
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| success | boolean | 测试是否成功 |
| latency | number | 延迟时间（毫秒），失败时为 null |
| error | string | 错误信息，成功时为 null |

**错误响应**

| 状态码 | 错误信息 | 说明 |
|--------|----------|------|
| 400 | 缺少必填字段 | 未提供必要参数 |
| 400 | 端口号必须是 1-65535 之间的有效数字 | 端口范围错误 |
| 400 | 代理协议必须是 HTTP、HTTPS 或 SOCKS5 | protocol 值错误 |
| 401 | 未授权访问，请先登录 | Token 无效或过期 |
| 500 | 服务器内部错误 | 服务器异常 |

---

### 3.7 获取活跃代理列表

获取当前用户所有活跃状态的代理配置（不分页）。

**请求**

```
GET /api/proxies/list
```

**请求头**

| 参数 | 值 | 必填 |
|------|-----|------|
| Authorization | Bearer \<token\> | 是 |

**成功响应** (200)

```json
{
  "proxies": [
    {
      "id": "clxxx...",
      "name": "香港代理",
      "host": "proxy.example.com",
      "port": 1080,
      "protocol": "HTTP",
      "isActive": true
    }
  ]
}
```

**错误响应**

| 状态码 | 错误信息 | 说明 |
|--------|----------|------|
| 401 | 未授权访问，请先登录 | Token 无效或过期 |
| 500 | 服务器内部错误 | 服务器异常 |

---

## 四、API 密钥管理 API

> 以下接口需要 JWT 认证

### 4.1 获取密钥列表

获取当前用户的所有 API 密钥。

**请求**

```
GET /api/api-keys
```

**请求头**

| 参数 | 值 | 必填 |
|------|-----|------|
| Authorization | Bearer \<token\> | 是 |

**成功响应** (200)

```json
{
  "apiKeys": [
    {
      "id": "clxxx...",
      "name": "生产环境密钥",
      "keyMasked": "ea_live_...xxxx",
      "scope": "ALL",
      "allowedEmailAccountIds": null,
      "lastUsedAt": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "emailLogCount": 100
    }
  ]
}
```

| 字段 | 说明 |
|------|------|
| keyMasked | 脱敏后的密钥，仅显示前 8 位和后 4 位 |
| scope | 权限范围：`ALL`（全部邮箱）或 `SPECIFIC`（指定邮箱） |
| emailLogCount | 使用该密钥发送的邮件数量 |

**错误响应**

| 状态码 | 错误信息 | 说明 |
|--------|----------|------|
| 401 | 未授权访问，请先登录 | Token 无效或过期 |
| 500 | 获取 API 密钥列表失败 | 服务器异常 |

---

### 4.2 创建密钥

创建新的 API 密钥。

**请求**

```
POST /api/api-keys
```

**请求头**

| 参数 | 值 | 必填 |
|------|-----|------|
| Content-Type | application/json | 是 |
| Authorization | Bearer \<token\> | 是 |

**请求体**

```json
{
  "name": "生产环境密钥",
  "scope": "ALL"
}
```

或指定邮箱权限：

```json
{
  "name": "测试环境密钥",
  "scope": "SPECIFIC",
  "allowedEmailAccountIds": ["clxxx...", "clyyy..."]
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 密钥名称，用于识别用途 |
| scope | string | 是 | 权限范围：`ALL` 或 `SPECIFIC` |
| allowedEmailAccountIds | string[] | scope=SPECIFIC 时必填 | 允许使用的邮箱账户 ID 列表 |

**成功响应** (200)

```json
{
  "id": "clxxx...",
  "name": "生产环境密钥",
  "key": "ea_live_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  "scope": "ALL",
  "allowedEmailAccountIds": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "message": "API 密钥创建成功，请妥善保管，此密钥仅显示一次"
}
```

> **重要提示**：`key` 字段仅在创建时返回一次，请务必妥善保管！

**错误响应**

| 状态码 | 错误信息 | 说明 |
|--------|----------|------|
| 400 | 密钥名称不能为空 | 未提供名称 |
| 400 | 权限范围必须是 ALL 或 SPECIFIC | scope 值错误 |
| 400 | 指定邮箱权限范围需要选择至少一个邮箱账户 | SPECIFIC 模式未指定邮箱 |
| 400 | 部分邮箱账户不存在或不属于当前用户 | 邮箱 ID 无效 |
| 401 | 未授权访问，请先登录 | Token 无效或过期 |
| 500 | 创建 API 密钥失败 | 服务器异常 |

---

### 4.3 获取密钥详情

获取指定 API 密钥的详细信息。

**请求**

```
GET /api/api-keys/{id}
```

**请求头**

| 参数 | 值 | 必填 |
|------|-----|------|
| Authorization | Bearer \<token\> | 是 |

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | API 密钥 ID |

**成功响应** (200)

```json
{
  "id": "clxxx...",
  "name": "生产环境密钥",
  "keyMasked": "ea_live_...xxxx",
  "scope": "ALL",
  "allowedEmailAccountIds": null,
  "lastUsedAt": "2024-01-01T00:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "emailLogCount": 100
}
```

**错误响应**

| 状态码 | 错误信息 | 说明 |
|--------|----------|------|
| 401 | 未授权访问，请先登录 | Token 无效或过期 |
| 403 | 无权访问此 API 密钥 | 非密钥所有者 |
| 404 | API 密钥不存在 | 密钥不存在 |
| 500 | 获取 API 密钥详情失败 | 服务器异常 |

---

### 4.4 删除密钥

删除指定的 API 密钥。

**请求**

```
DELETE /api/api-keys/{id}
```

**请求头**

| 参数 | 值 | 必填 |
|------|-----|------|
| Authorization | Bearer \<token\> | 是 |

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | API 密钥 ID |

**成功响应** (200)

```json
{
  "message": "API 密钥已删除"
}
```

**错误响应**

| 状态码 | 错误信息 | 说明 |
|--------|----------|------|
| 401 | 未授权访问，请先登录 | Token 无效或过期 |
| 403 | 无权删除此 API 密钥 | 非密钥所有者 |
| 404 | API 密钥不存在 | 密钥不存在 |
| 500 | 删除 API 密钥失败 | 服务器异常 |

---

## 五、邮件发送 API

> 此接口使用 API Key 认证

### 5.1 发送邮件

通过 API 发送邮件。

**请求**

```
POST /api/send
```

**请求头**

| 参数 | 值 | 必填 |
|------|-----|------|
| Content-Type | application/json | 是 |
| Authorization | Bearer \<api-key\> | 是 |

**请求体**

基础请求：

```json
{
  "from": "sender@example.com",
  "to": "recipient@example.com",
  "subject": "邮件主题",
  "text": "纯文本内容"
}
```

完整请求：

```json
{
  "from": "sender@example.com",
  "to": ["recipient1@example.com", "recipient2@example.com"],
  "subject": "邮件主题",
  "html": "<h1>HTML 内容</h1><p>这是邮件正文</p>",
  "cc": "cc@example.com",
  "bcc": ["bcc1@example.com", "bcc2@example.com"],
  "attachments": [
    {
      "filename": "document.pdf",
      "content": "base64-encoded-content",
      "contentType": "application/pdf"
    }
  ]
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| from | string | 是 | 发件人邮箱（必须是已绑定的邮箱） |
| to | string \| string[] | 是 | 收件人邮箱 |
| subject | string | 是 | 邮件主题 |
| text | string | 否* | 纯文本内容 |
| html | string | 否* | HTML 内容 |
| cc | string \| string[] | 否 | 抄送 |
| bcc | string \| string[] | 否 | 密送 |
| attachments | array | 否 | 附件列表 |

> *`text` 和 `html` 至少提供一个

**附件对象**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| filename | string | 是 | 文件名 |
| content | string | 是 | Base64 编码的文件内容 |
| encoding | string | 否 | 编码方式，默认 `base64` |
| contentType | string | 否 | MIME 类型 |

**成功响应** (200)

```json
{
  "success": true,
  "messageId": "<xxx@xxx.com>",
  "message": "邮件发送成功"
}
```

**错误响应**

| 状态码 | 错误信息 | 说明 |
|--------|----------|------|
| 400 | 缺少必填字段：from, to, subject | 缺少必要参数 |
| 400 | 邮件内容不能为空，请提供 text 或 html | 未提供邮件内容 |
| 401 | 缺少 API 密钥 | 未提供 Authorization 头 |
| 401 | 无效的 API 密钥格式 | 密钥格式错误 |
| 401 | API 密钥不存在或已失效 | 密钥无效 |
| 403 | 该 API 密钥无权使用此邮箱账户发送邮件 | 权限不足 |
| 403 | 发件人邮箱未绑定或不存在 | 邮箱未绑定 |
| 404 | 邮箱账户不存在 | 邮箱账户被删除 |
| 500 | 邮箱账户密码解密失败 | 配置错误 |
| 500 | 发送邮件时发生错误 | SMTP 发送失败 |

---

## 六、日志查询 API

> 以下接口需要 JWT 认证

### 6.1 获取认证日志

获取当前用户的认证日志列表。

**请求**

```
GET /api/logs/api
```

**请求头**

| 参数 | 值 | 必填 |
|------|-----|------|
| Authorization | Bearer \<token\> | 是 |

**成功响应** (200)

```json
{
  "logs": [
    {
      "id": "clxxx...",
      "username": "user@example.com",
      "success": true,
      "error": null,
      "remoteIp": "192.168.1.1",
      "source": "SMTP",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "apiKeyName": "生产环境密钥"
    },
    {
      "id": "clyyy...",
      "username": "生产环境密钥",
      "success": true,
      "error": null,
      "remoteIp": "192.168.1.2",
      "source": "API",
      "createdAt": "2024-01-02T00:00:00.000Z",
      "apiKeyName": "生产环境密钥"
    }
  ]
}
```

**返回字段说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 日志唯一标识符 |
| username | string | 认证时使用的用户名（SMTP 认证时为邮箱地址，API 认证时为 API 密钥名称） |
| success | boolean | 认证是否成功 |
| error | string | 认证失败时的错误信息，成功时为 null |
| remoteIp | string | 客户端 IP 地址 |
| source | string | 认证来源：`API`（HTTP API 调用）或 `SMTP`（SMTP 协议认证） |
| createdAt | string | 认证时间 |
| apiKeyName | string \| null | API 密钥名称，直接存储于日志记录中（非外键关联）。即使 API Key 被删除，历史日志中仍保留名称；鉴权失败但匹配到用户时也会记录 |

> **source 字段说明**：
> - `API`：通过 HTTP API 发送邮件时产生的认证日志，记录 API 密钥调用情况
> - `SMTP`：通过 SMTP 协议认证时产生的日志，记录 SMTP 客户端的认证尝试
>
> **apiKeyName 说明**：
> - 该字段为直接存储的字符串值，不通过外键关联 ApiKey 表
> - 无论认证成功或失败（只要能匹配到用户），均会记录 apiKeyName
> - 若 API Key 已被删除，历史日志中的 apiKeyName 仍可正常显示

**错误响应**

| 状态码 | 错误信息 | 说明 |
|--------|----------|------|
| 401 | 未授权访问，请先登录 | Token 无效或过期 |
| 500 | 服务器内部错误 | 服务器异常 |

---

## 七、错误码汇总

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 资源创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（未登录或 Token 无效） |
| 403 | 禁止访问（权限不足） |
| 404 | 资源不存在 |
| 409 | 资源冲突（如邮箱已注册） |
| 500 | 服务器内部错误 |

---

## 八、请求示例

### cURL 示例

**用户登录**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password123"}'
```

**添加邮箱**

```bash
curl -X POST http://localhost:3000/api/email-accounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "smtpHost": "smtp.gmail.com",
    "smtpPort": 587,
    "smtpUser": "user@gmail.com",
    "smtpPassword": "your-app-password",
    "fromEmail": "user@gmail.com"
  }'
```

**发送邮件**

```bash
curl -X POST http://localhost:3000/api/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ea_live_xxx" \
  -d '{
    "from": "user@gmail.com",
    "to": "recipient@example.com",
    "subject": "测试邮件",
    "html": "<h1>Hello</h1><p>这是一封测试邮件</p>"
  }'
```

### JavaScript 示例

```javascript
const API_BASE = 'http://localhost:3000/api';

async function login(email, password) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return response.json();
}

async function sendEmail(apiKey, emailData) {
  const response = await fetch(`${API_BASE}/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(emailData)
  });
  return response.json();
}
```

### Python 示例

```python
import requests

API_BASE = 'http://localhost:3000/api'

def login(email, password):
    response = requests.post(
        f'{API_BASE}/auth/login',
        json={'email': email, 'password': password}
    )
    return response.json()

def send_email(api_key, email_data):
    response = requests.post(
        f'{API_BASE}/send',
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}'
        },
        json=email_data
    )
    return response.json()
```

---

## 九、SMTP 协议接口

除了 HTTP API 外，平台还提供标准 SMTP 协议接口，允许使用任何 SMTP 客户端发送邮件。

### 基础信息

| 配置项 | 值 |
|--------|-----|
| SMTP 服务器地址 | your-domain.com |
| SMTP 端口 | 2525（默认）/ 25 / 587（生产环境） |
| 认证方式 | AUTH LOGIN |
| 加密方式 | STARTTLS（可选） |

### 认证方式

SMTP 认证使用邮箱地址和 API 密钥作为凭据：

```
用户名: your-email@example.com（您绑定的邮箱地址）
密码: ea_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx（您的 API 密钥）
```

> **说明**：用户名必须是您在系统中绑定的邮箱地址，密码是对应的 API 密钥。系统会验证该邮箱是否属于 API 密钥所属用户，以及 API 密钥是否有权使用该邮箱。

### 支持的 SMTP 命令

| 命令 | 说明 |
|------|------|
| EHLO | 开始会话，声明客户端身份 |
| AUTH | 进行身份认证（支持 AUTH LOGIN） |
| MAIL FROM | 指定发件人邮箱地址 |
| RCPT TO | 指定收件人邮箱地址 |
| DATA | 开始输入邮件内容 |
| STARTTLS | 升级为 TLS 加密连接（需配置证书） |
| QUIT | 结束会话 |
| RSET | 重置当前会话状态 |
| NOOP | 空操作，保持连接 |
| HELP | 获取帮助信息 |

### 连接示例

#### 使用 telnet 测试连接

```bash
telnet localhost 2525
```

交互示例：

```
Trying 127.0.0.1...
Connected to localhost.
Escape character is '^]'.
220 aggregation-email SMTP Server Ready

EHLO client.example.com
250-Hello client.example.com
250-AUTH LOGIN
250-STARTTLS
250 8BITMIME

AUTH LOGIN
334 VXNlcm5hbWU6

dXNlckBleGFtcGxlLmNvbQ==
334 UGFzc3dvcmQ6

ZWFfbGl2ZV94eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4
235 Authentication successful

MAIL FROM:<user@example.com>
250 OK

RCPT TO:<recipient@example.com>
250 OK

DATA
354 End data with <CR><LF>.<CR><LF>

Subject: Test Email
From: user@example.com
To: recipient@example.com

This is a test email sent via SMTP.
.
250 OK: Message accepted

QUIT
221 Bye
Connection closed by foreign host.
```

> 注意：用户名和密码需要使用 Base64 编码。上例中 `dXNlckBleGFtcGxlLmNvbQ==` 是 `user@example.com` 的 Base64 编码，`ZWFfbGl2ZV94eHh4...` 是 API 密钥的 Base64 编码。

#### 使用 openssl 测试 TLS 连接

```bash
openssl s_client -connect localhost:2525 -starttls smtp
```

### 发件人邮箱要求

- MAIL FROM 指定的邮箱必须是用户已绑定的邮箱账户
- 如果 API 密钥权限为「指定邮箱」，则只能使用被授权的邮箱
- 发件人邮箱不存在或无权限时，将返回错误：`550 Sender not allowed`

### 错误响应

| 响应码 | 说明 |
|--------|------|
| 235 | 认证成功 |
| 421 | 服务不可用 |
| 450 | 邮箱操作失败（临时） |
| 500 | 命令语法错误 |
| 501 | 参数语法错误 |
| 503 | 命令顺序错误 |
| 535 | 认证失败 |
| 550 | 请求的操作未执行（发件人不存在或无权限） |
| 551 | 用户不在本地服务器 |
| 552 | 存储空间不足 |
| 553 | 邮箱名不可用 |
| 554 | 事务失败 |

### 与 HTTP API 的区别

| 特性 | HTTP API | SMTP 协议 |
|------|----------|-----------|
| 端口 | 3000（Web）/ 443（HTTPS） | 2525 / 25 / 587 |
| 认证方式 | Bearer Token | AUTH LOGIN |
| 请求格式 | JSON | SMTP 命令 |
| 附件支持 | Base64 编码 | MIME 格式 |
| 适用场景 | 应用集成、API 调用 | 邮件客户端、传统系统集成 |

---

## 十、管理后台 API

> 以下接口需要管理员认证（通过 `/api/admin/auth/login` 登录后获取的管理员 Token）

### 9.1 管理员登录

管理员登录获取管理后台访问权限。

**请求**

```
POST /api/admin/auth/login
```

**请求头**

| 参数 | 值 | 必填 |
|------|-----|------|
| Content-Type | application/json | 是 |

**请求体**

```json
{
  "username": "admin",
  "password": "your-admin-password"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 管理员用户名 |
| password | string | 是 | 管理员密码 |

**成功响应** (200)

```json
{
  "message": "登录成功",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**错误响应**

| 状态码 | 错误信息 | 说明 |
|--------|----------|------|
| 400 | 用户名和密码为必填项 | 缺少必填字段 |
| 401 | 用户名或密码错误 | 凭据无效 |

---

### 9.2 管理员登出

管理员登出账户。

**请求**

```
POST /api/admin/auth/logout
```

**请求头**

| 参数 | 值 | 必填 |
|------|-----|------|
| Authorization | Bearer \<token\> | 是 |

**成功响应** (200)

```json
{
  "message": "登出成功"
}
```

---

### 9.3 获取仪表盘统计数据

获取管理后台仪表盘的统计数据。

**请求**

```
GET /api/admin/dashboard/stats
```

**请求头**

| 参数 | 值 | 必填 |
|------|-----|------|
| Authorization | Bearer \<token\> | 是 |

**成功响应** (200)

```json
{
  "users": {
    "total": 100,
    "active": 95,
    "disabled": 5
  },
  "emailAccounts": {
    "total": 250,
    "verified": 240
  },
  "apiKeys": {
    "total": 150,
    "active": 145
  },
  "emailLogs": {
    "total": 10000,
    "success": 9500,
    "failed": 500,
    "today": 100
  }
}
```

**错误响应**

| 状态码 | 错误信息 | 说明 |
|--------|----------|------|
| 401 | 未授权访问 | Token 无效或非管理员 |

---

### 9.4 获取用户列表

获取所有用户列表（分页）。

**请求**

```
GET /api/admin/users
```

**请求头**

| 参数 | 值 | 必填 |
|------|-----|------|
| Authorization | Bearer \<token\> | 是 |

**查询参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| limit | number | 否 | 10 | 每页数量 |
| search | string | 否 | - | 搜索关键词（邮箱/姓名） |
| status | string | 否 | - | 状态筛选：`active` / `disabled` |

**成功响应** (200)

```json
{
  "users": [
    {
      "id": "clxxx...",
      "email": "user@example.com",
      "name": "用户名",
      "status": "active",
      "level": {
        "id": "clyyy...",
        "name": "专业版",
        "maxEmailAccounts": 20
      },
      "emailAccountCount": 5,
      "apiKeyCount": 3,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "lastLoginAt": "2024-01-15T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

**错误响应**

| 状态码 | 错误信息 | 说明 |
|--------|----------|------|
| 401 | 未授权访问 | Token 无效或非管理员 |

---

### 9.5 切换用户状态

启用或禁用用户账户。

**请求**

```
POST /api/admin/users/{id}/toggle-status
```

**请求头**

| 参数 | 值 | 必填 |
|------|-----|------|
| Authorization | Bearer \<token\> | 是 |

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 用户 ID |

**成功响应** (200)

```json
{
  "message": "用户已禁用",
  "user": {
    "id": "clxxx...",
    "status": "disabled"
  }
}
```

或

```json
{
  "message": "用户已启用",
  "user": {
    "id": "clxxx...",
    "status": "active"
  }
}
```

**错误响应**

| 状态码 | 错误信息 | 说明 |
|--------|----------|------|
| 401 | 未授权访问 | Token 无效或非管理员 |
| 404 | 用户不存在 | 用户 ID 无效 |

---

### 9.6 修改用户等级

修改指定用户的等级。

**请求**

```
PUT /api/admin/users/{id}/level
```

**请求头**

| 参数 | 值 | 必填 |
|------|-----|------|
| Content-Type | application/json | 是 |
| Authorization | Bearer \<token\> | 是 |

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 用户 ID |

**请求体**

```json
{
  "levelId": "clyyy..."
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| levelId | string | 是 | 等级 ID |

**成功响应** (200)

```json
{
  "message": "用户等级已更新",
  "user": {
    "id": "clxxx...",
    "level": {
      "id": "clyyy...",
      "name": "专业版",
      "maxEmailAccounts": 20
    }
  }
}
```

**错误响应**

| 状态码 | 错误信息 | 说明 |
|--------|----------|------|
| 400 | 等级 ID 为必填项 | 缺少 levelId |
| 401 | 未授权访问 | Token 无效或非管理员 |
| 404 | 用户不存在 | 用户 ID 无效 |
| 404 | 等级不存在 | 等级 ID 无效 |

---

### 9.7 获取等级列表

获取所有用户等级列表。

**请求**

```
GET /api/admin/levels
```

**请求头**

| 参数 | 值 | 必填 |
|------|-----|------|
| Authorization | Bearer \<token\> | 是 |

**成功响应** (200)

```json
{
  "levels": [
    {
      "id": "clxxx...",
      "name": "免费用户",
      "description": "默认注册用户的等级",
      "maxEmailAccounts": 2,
      "userCount": 80,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "clyyy...",
      "name": "专业版",
      "description": "专业用户",
      "maxEmailAccounts": 20,
      "userCount": 15,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**错误响应**

| 状态码 | 错误信息 | 说明 |
|--------|----------|------|
| 401 | 未授权访问 | Token 无效或非管理员 |

---

### 9.8 创建等级

创建新的用户等级。

**请求**

```
POST /api/admin/levels
```

**请求头**

| 参数 | 值 | 必填 |
|------|-----|------|
| Content-Type | application/json | 是 |
| Authorization | Bearer \<token\> | 是 |

**请求体**

```json
{
  "name": "企业版",
  "description": "企业用户专属等级",
  "maxEmailAccounts": 100
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 等级名称 |
| description | string | 否 | 等级描述 |
| maxEmailAccounts | number | 是 | 最大邮箱数量限制 |

**成功响应** (201)

```json
{
  "message": "等级创建成功",
  "level": {
    "id": "clxxx...",
    "name": "企业版",
    "description": "企业用户专属等级",
    "maxEmailAccounts": 100,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**错误响应**

| 状态码 | 错误信息 | 说明 |
|--------|----------|------|
| 400 | 等级名称和邮箱数量限制为必填项 | 缺少必填字段 |
| 400 | 等级名称已存在 | 名称重复 |
| 401 | 未授权访问 | Token 无效或非管理员 |

---

### 9.9 更新等级

更新指定等级的信息。

**请求**

```
PUT /api/admin/levels/{id}
```

**请求头**

| 参数 | 值 | 必填 |
|------|-----|------|
| Content-Type | application/json | 是 |
| Authorization | Bearer \<token\> | 是 |

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 等级 ID |

**请求体**

```json
{
  "name": "企业版 Pro",
  "description": "企业高级用户",
  "maxEmailAccounts": 150
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 等级名称 |
| description | string | 否 | 等级描述 |
| maxEmailAccounts | number | 否 | 最大邮箱数量限制 |

**成功响应** (200)

```json
{
  "message": "等级更新成功",
  "level": {
    "id": "clxxx...",
    "name": "企业版 Pro",
    "description": "企业高级用户",
    "maxEmailAccounts": 150,
    "updatedAt": "2024-01-15T00:00:00.000Z"
  }
}
```

**错误响应**

| 状态码 | 错误信息 | 说明 |
|--------|----------|------|
| 400 | 等级名称已存在 | 名称重复 |
| 401 | 未授权访问 | Token 无效或非管理员 |
| 404 | 等级不存在 | 等级 ID 无效 |

---

### 9.11 创建用户

管理员直接创建用户。

**请求**

```
POST /api/admin/users
```

**请求头**

| 参数 | 值 | 必填 |
|------|-----|------|
| Content-Type | application/json | 是 |
| Authorization | Bearer \<token\> | 是 |

**请求体**

```json
{
  "email": "user@example.com",
  "password": "Password123",
  "name": "用户名",
  "levelId": "clxxx..."
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 邮箱地址，需符合邮箱格式 |
| password | string | 是 | 密码，至少 8 位，包含大小写字母和数字 |
| name | string | 否 | 用户昵称 |
| levelId | string | 否 | 用户等级 ID，不指定则使用默认等级 |

**成功响应** (201)

```json
{
  "message": "用户创建成功",
  "user": {
    "id": "clxxx...",
    "email": "user@example.com",
    "name": "用户名",
    "status": "active",
    "level": {
      "id": "clyyy...",
      "name": "专业版",
      "maxEmailAccounts": 20
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**错误响应**

| 状态码 | 错误信息 | 说明 |
|--------|----------|------|
| 400 | 邮箱和密码为必填项 | 缺少必填字段 |
| 400 | 邮箱格式不正确 | 邮箱格式验证失败 |
| 400 | 密码长度至少为 8 个字符 | 密码长度不足 |
| 400 | 密码必须包含至少一个大写字母 | 密码复杂度要求 |
| 400 | 密码必须包含至少一个小写字母 | 密码复杂度要求 |
| 400 | 密码必须包含至少一个数字 | 密码复杂度要求 |
| 401 | 未授权访问 | Token 无效或非管理员 |
| 404 | 等级不存在 | 等级 ID 无效 |
| 409 | 该邮箱已被注册 | 邮箱已存在 |

---

### 9.10 删除等级

删除指定的用户等级。

**请求**

```
DELETE /api/admin/levels/{id}
```

**请求头**

| 参数 | 值 | 必填 |
|------|-----|------|
| Authorization | Bearer \<token\> | 是 |

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 等级 ID |

**成功响应** (200)

```json
{
  "message": "等级删除成功"
}
```

**错误响应**

| 状态码 | 错误信息 | 说明 |
|--------|----------|------|
| 400 | 无法删除默认等级 | 默认等级不可删除 |
| 400 | 该等级下仍有用户，无法删除 | 存在关联用户 |
| 401 | 未授权访问 | Token 无效或非管理员 |
| 404 | 等级不存在 | 等级 ID 无效 |
