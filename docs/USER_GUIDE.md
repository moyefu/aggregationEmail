# 用户使用手册

欢迎使用 aggregation-email 邮件聚合发送平台！本手册将帮助您快速上手并熟练使用平台的各项功能。

---

## 快速开始

aggregation-email 是一个邮件聚合发送平台，让您能够：

- 绑定多个 SMTP 邮箱账户
- 通过统一的 API 接口发送邮件
- 管理 API 密钥并控制权限
- 查看邮件发送记录

### 使用流程概览

```
注册账号 → 登录系统 → 添加邮箱账户 → 创建 API 密钥 → 调用 API 发送邮件
```

---

## 注册和登录

### 注册新账号

1. 访问平台首页，点击「注册」按钮
2. 填写邮箱地址
3. 点击「发送验证码」按钮
4. 查收邮箱，输入收到的 6 位验证码
5. 填写密码和昵称
6. 点击「注册」完成账号创建

**验证码说明**：
- 验证码有效期为 10 分钟
- 验证码为 6 位数字
- 同一邮箱 1 分钟内最多发送 3 次

**密码要求**：
- 至少 8 个字符
- 包含至少一个大写字母
- 包含至少一个小写字母
- 包含至少一个数字

### 登录系统

1. 访问平台首页，点击「登录」按钮
2. 输入注册邮箱和密码
3. 点击「登录」进入系统

### 忘记密码

如果您忘记了密码，可以通过以下步骤重置：

1. 在登录页面点击「忘记密码？」链接
2. 输入您的注册邮箱
3. 点击「发送重置链接」
4. 查收邮箱，点击重置链接
5. 在重置页面输入新密码
6. 点击「重置密码」完成

**重置链接说明**：
- 重置链接有效期为 1 小时
- 重置成功后需使用新密码登录

---

## 添加邮箱账户

登录后，您需要添加 SMTP 邮箱账户才能发送邮件。

### 操作步骤

1. 点击导航栏的「邮箱管理」
2. 点击「添加邮箱」按钮
3. 填写 SMTP 配置信息
4. 点击「验证并保存」

### 配置字段说明

| 字段 | 说明 | 示例 |
|------|------|------|
| SMTP 服务器 | 邮件服务商的 SMTP 地址 | smtp.gmail.com |
| SMTP 端口 | SMTP 服务端口 | 587 |
| SMTP 用户名 | 通常为邮箱地址 | user@gmail.com |
| SMTP 密码 | 邮箱密码或应用专用密码 | xxxxxxxx |
| 发件人邮箱 | 显示的发件人地址 | user@gmail.com |
| 发件人名称 | 发件人显示名称（可选） | 张三 |

---

## 常见 SMTP 配置示例

### Gmail

| 配置项 | 值 |
|--------|-----|
| SMTP 服务器 | smtp.gmail.com |
| SMTP 端口 | 587 |
| SMTP 用户名 | 您的 Gmail 地址 |
| SMTP 密码 | 应用专用密码 |

> **重要**：Gmail 需要使用「应用专用密码」，而非您的 Google 账号密码。

**获取 Gmail 应用专用密码**：
1. 访问 Google 账户设置
2. 开启两步验证
3. 在「安全性」→「应用专用密码」中生成新密码
4. 使用生成的 16 位密码作为 SMTP 密码

### QQ 邮箱

| 配置项 | 值 |
|--------|-----|
| SMTP 服务器 | smtp.qq.com |
| SMTP 端口 | 587 或 465 |
| SMTP 用户名 | 您的 QQ 邮箱地址 |
| SMTP 密码 | 授权码 |

> **重要**：QQ 邮箱需要使用「授权码」，而非 QQ 密码。

**获取 QQ 邮箱授权码**：
1. 登录 QQ 邮箱网页版
2. 进入「设置」→「账户」
3. 开启「POP3/SMTP 服务」
4. 按提示获取授权码

### 163 邮箱

| 配置项 | 值 |
|--------|-----|
| SMTP 服务器 | smtp.163.com |
| SMTP 端口 | 465 或 25 |
| SMTP 用户名 | 您的 163 邮箱地址 |
| SMTP 密码 | 授权码 |

**获取 163 邮箱授权码**：
1. 登录 163 邮箱网页版
2. 进入「设置」→「POP3/SMTP/IMAP」
3. 开启「SMTP 服务」
4. 获取客户端授权码

### 阿里企业邮箱

| 配置项 | 值 |
|--------|-----|
| SMTP 服务器 | smtp.qiye.aliyun.com |
| SMTP 端口 | 465 |
| SMTP 用户名 | 您的企业邮箱地址 |
| SMTP 密码 | 邮箱密码 |

### 腾讯企业邮箱

| 配置项 | 值 |
|--------|-----|
| SMTP 服务器 | smtp.exmail.qq.com |
| SMTP 端口 | 465 |
| SMTP 用户名 | 您的企业邮箱地址 |
| SMTP 密码 | 邮箱密码 |

### Outlook/Hotmail

| 配置项 | 值 |
|--------|-----|
| SMTP 服务器 | smtp-mail.outlook.com |
| SMTP 端口 | 587 |
| SMTP 用户名 | 您的 Outlook 邮箱地址 |
| SMTP 密码 | 应用专用密码 |

---

## 代理管理

代理管理功能允许您配置代理服务器，用于 SMTP 邮件发送。当您的服务器网络受限，无法直接连接外部 SMTP 服务器时，可以通过代理转发邮件。

### 功能介绍

代理管理提供以下功能：

- **添加代理**：配置 HTTP、HTTPS 或 SOCKS5 代理服务器
- **编辑代理**：修改代理配置信息
- **删除代理**：删除不再使用的代理
- **测试连通性**：验证代理是否可用
- **全部测试**：一键测试所有代理的连通状态
- **邮箱关联**：将代理与邮箱账户绑定，发送邮件时自动使用代理

### 支持的代理协议

| 协议 | 说明 |
|------|------|
| HTTP | HTTP 代理，适用于普通代理场景 |
| HTTPS | HTTPS 代理，支持加密传输 |
| SOCKS5 | SOCKS5 代理，支持 TCP 连接转发 |

### 使用场景

- 服务器位于内网，无法直接访问外部 SMTP 服务器
- 需要通过特定 IP 地址发送邮件（如海外邮件服务商）
- 企业网络有访问限制，需通过代理转发

---

### 添加代理

#### 操作步骤

1. 点击导航栏的「代理管理」
2. 点击「添加代理」按钮
3. 填写代理配置信息
4. 点击「测试连接」验证代理可用性
5. 点击「添加代理」保存

#### 配置字段说明

| 字段 | 说明 | 必填 | 示例 |
|------|------|------|------|
| 代理名称 | 用于识别代理用途 | 是 | 香港代理 |
| 协议类型 | 代理协议 | 是 | HTTP / HTTPS / SOCKS5 |
| 主机地址 | 代理服务器地址 | 是 | 192.168.1.1 或 proxy.example.com |
| 端口 | 代理服务端口 | 是 | 1080 |
| 用户名 | 代理认证用户名（可选） | 否 | user1 |
| 密码 | 代理认证密码（可选） | 否 | xxxxxx |

---

### 测试代理连通性

添加代理前或编辑代理时，可以测试代理是否可用。

#### 在添加/编辑表单中测试

1. 填写代理的主机地址和端口
2. 点击「测试连接」按钮
3. 系统会尝试通过代理连接测试地址
4. 显示测试结果：
   - **成功**：显示连接延迟（如：连接成功，延迟: 150ms）
   - **失败**：显示错误原因（如：连接失败: 连接超时）

#### 在代理列表中测试单个代理

1. 在代理列表中找到目标代理
2. 点击该代理行的「测试」按钮
3. 等待测试完成
4. 在「测试结果」列查看结果

#### 全部测试功能

当您有多个代理时，可以使用「全部测试」功能一键测试所有代理：

1. 点击代理列表上方的「全部测试」按钮
2. 系统依次测试每个代理
3. 测试过程中显示「测试中...」状态
4. 测试完成后显示汇总结果：
   - 共 X 个代理，成功 X 个，失败 X 个

#### 测试结果说明

| 结果 | 说明 |
|------|------|
| 成功 (XXXms) | 代理可用，显示连接延迟 |
| 失败: 连接超时 | 代理服务器响应超时（10秒内未响应） |
| 失败: 无法连接到代理服务器 | 无法建立与代理的连接 |
| 失败: 代理认证失败 | 用户名或密码错误 |
| 失败: 代理返回状态码: XXX | 代理连接成功但返回异常状态 |

---

### 邮箱账户关联代理

将代理与邮箱账户绑定后，该邮箱发送邮件时会自动通过代理转发。

#### 在添加邮箱时关联代理

1. 进入「邮箱管理」页面
2. 点击「添加邮箱」按钮
3. 填写 SMTP 配置信息
4. 在「发送代理（可选）」下拉框中选择已添加的代理
5. 点击「验证并保存」

> **提示**：选择「不使用代理」则直接连接 SMTP 服务器。

#### 在编辑邮箱时关联代理

1. 进入「邮箱管理」页面
2. 点击邮箱账户的「编辑」按钮
3. 在「发送代理」下拉框中选择或更换代理
4. 点击「保存」

#### 代理显示信息

在邮箱列表中，每个邮箱账户会显示关联的代理信息：

- 格式：`代理名称 (主机:端口 - 协议)`
- 未关联代理时显示：`无`

#### 解除代理关联

1. 编辑邮箱账户
2. 在「发送代理」下拉框中选择「不使用代理」
3. 点击「保存」

---

### 删除代理

删除代理时需要注意：

1. 点击代理行的「删除」按钮
2. 确认删除提示
3. 删除后，使用此代理的邮箱账户将自动解除关联
4. 解除关联的邮箱将改为直接连接 SMTP 服务器

> **警告**：如果您的服务器网络受限，删除代理后可能导致邮箱无法正常发送邮件。

---

### 代理使用流程

```
添加代理 → 测试连通性 → 验证可用 → 关联邮箱账户 → 发送邮件时自动使用代理
```

---

## 创建 API 密钥

添加邮箱后，您需要创建 API 密钥来调用发送邮件接口。

### 操作步骤

1. 点击导航栏的「API 密钥」
2. 点击「创建密钥」按钮
3. 填写密钥信息：
   - **名称**：用于识别密钥用途（如「生产环境密钥」）
   - **权限范围**：
     - `全部邮箱`：可使用所有绑定的邮箱发送
     - `指定邮箱`：只能使用选定的邮箱发送
4. 点击「创建」

### 重要提示

创建成功后，系统会显示完整的 API 密钥（格式：`ea_live_xxx`）。

**请务必立即复制并妥善保管！密钥仅显示一次，关闭后将无法再次查看。**

### 密钥管理

- **查看密钥列表**：在 API 密钥页面可以看到所有密钥（密钥值已脱敏）
- **查看使用统计**：每个密钥显示已发送邮件数量
- **删除密钥**：点击删除按钮可删除不再使用的密钥

### API 密钥数量限制

每个用户最多可创建 10 个 API 密钥（可通过环境变量调整）。

- 达到上限后，创建按钮将被禁用
- 如需创建新密钥，请先删除不需要的密钥
- 管理员可全局调整此限制（MAX_API_KEYS_PER_USER）

---

## 使用 API 发送邮件

创建 API 密钥后，您可以通过 HTTP 请求发送邮件。

### 基础信息

- **接口地址**：`POST /api/send`
- **认证方式**：`Authorization: Bearer ea_live_xxx`
- **内容类型**：`application/json`

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| from | string | 是 | 发件人邮箱（必须是已绑定的邮箱） |
| to | string/array | 是 | 收件人邮箱 |
| subject | string | 是 | 邮件主题 |
| text | string | 否* | 纯文本内容 |
| html | string | 否* | HTML 内容 |
| cc | string/array | 否 | 抄送 |
| bcc | string/array | 否 | 密送 |
| attachments | array | 否 | 附件列表 |

> *`text` 和 `html` 至少提供一个

---

### cURL 示例

**发送纯文本邮件**

```bash
curl -X POST https://your-domain.com/api/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ea_live_your_api_key_here" \
  -d '{
    "from": "sender@gmail.com",
    "to": "recipient@example.com",
    "subject": "测试邮件",
    "text": "这是一封测试邮件，来自 aggregation-email 平台。"
  }'
```

**发送 HTML 邮件**

```bash
curl -X POST https://your-domain.com/api/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ea_live_your_api_key_here" \
  -d '{
    "from": "sender@gmail.com",
    "to": "recipient@example.com",
    "subject": "HTML 邮件测试",
    "html": "<h1>你好！</h1><p>这是一封 <strong>HTML</strong> 格式的邮件。</p>"
  }'
```

**发送给多个收件人**

```bash
curl -X POST https://your-domain.com/api/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ea_live_your_api_key_here" \
  -d '{
    "from": "sender@gmail.com",
    "to": ["user1@example.com", "user2@example.com"],
    "subject": "群发邮件测试",
    "html": "<p>这封邮件将发送给多个收件人</p>"
  }'
```

**发送带附件的邮件**

```bash
curl -X POST https://your-domain.com/api/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ea_live_your_api_key_here" \
  -d '{
    "from": "sender@gmail.com",
    "to": "recipient@example.com",
    "subject": "带附件的邮件",
    "html": "<p>请查收附件</p>",
    "attachments": [
      {
        "filename": "document.pdf",
        "content": "JVBERi0xLjQK...",
        "contentType": "application/pdf"
      }
    ]
  }'
```

---

### JavaScript/Node.js 示例

**基础封装**

```javascript
const API_URL = 'https://your-domain.com/api';
const API_KEY = 'ea_live_your_api_key_here';

async function sendEmail({ from, to, subject, text, html }) {
  const response = await fetch(`${API_URL}/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({ from, to, subject, text, html })
  });

  return response.json();
}

// 使用示例
const result = await sendEmail({
  from: 'sender@gmail.com',
  to: 'recipient@example.com',
  subject: 'Node.js 发送测试',
  html: '<h1>Hello from Node.js!</h1>'
});

console.log(result);
```

**完整工具类**

```javascript
class EmailClient {
  constructor(apiUrl, apiKey) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  async send(options) {
    const response = await fetch(`${this.apiUrl}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(options)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '发送失败');
    }

    return response.json();
  }

  async sendText(from, to, subject, text) {
    return this.send({ from, to, subject, text });
  }

  async sendHtml(from, to, subject, html) {
    return this.send({ from, to, subject, html });
  }
}

// 使用示例
const client = new EmailClient(
  'https://your-domain.com/api',
  'ea_live_your_api_key_here'
);

await client.sendHtml(
  'sender@gmail.com',
  'recipient@example.com',
  '欢迎邮件',
  '<h1>欢迎注册！</h1><p>感谢您的支持。</p>'
);
```

---

### Python 示例

**基础示例**

```python
import requests

API_URL = 'https://your-domain.com/api'
API_KEY = 'ea_live_your_api_key_here'

def send_email(from_email, to, subject, text=None, html=None):
    response = requests.post(
        f'{API_URL}/send',
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {API_KEY}'
        },
        json={
            'from': from_email,
            'to': to,
            'subject': subject,
            'text': text,
            'html': html
        }
    )
    return response.json()

# 使用示例
result = send_email(
    from_email='sender@gmail.com',
    to='recipient@example.com',
    subject='Python 发送测试',
    html='<h1>Hello from Python!</h1>'
)
print(result)
```

**完整工具类**

```python
import requests
from typing import Optional, Union, List

class EmailClient:
    def __init__(self, api_url: str, api_key: str):
        self.api_url = api_url
        self.api_key = api_key
        self.headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}'
        }

    def send(
        self,
        from_email: str,
        to: Union[str, List[str]],
        subject: str,
        text: Optional[str] = None,
        html: Optional[str] = None,
        cc: Optional[Union[str, List[str]]] = None,
        bcc: Optional[Union[str, List[str]]] = None
    ) -> dict:
        data = {
            'from': from_email,
            'to': to,
            'subject': subject
        }

        if text:
            data['text'] = text
        if html:
            data['html'] = html
        if cc:
            data['cc'] = cc
        if bcc:
            data['bcc'] = bcc

        response = requests.post(
            f'{self.api_url}/send',
            headers=self.headers,
            json=data
        )
        response.raise_for_status()
        return response.json()

# 使用示例
client = EmailClient(
    api_url='https://your-domain.com/api',
    api_key='ea_live_your_api_key_here'
)

result = client.send(
    from_email='sender@gmail.com',
    to='recipient@example.com',
    subject='欢迎邮件',
    html='<h1>欢迎注册！</h1><p>感谢您的支持。</p>'
)
print(result)
```

---

## 使用 SMTP 协议发送邮件

除了 HTTP API，您还可以使用标准 SMTP 协议发送邮件。这种方式兼容所有支持 SMTP 的邮件客户端和库。

### SMTP 服务器配置

| 配置项 | 值 |
|--------|-----|
| 服务器地址 | your-domain.com |
| 端口 | 2525（默认）/ 25 / 587 |
| 认证方式 | AUTH LOGIN |
| 加密 | STARTTLS（可选） |

### 认证方式

使用邮箱地址和 API 密钥进行认证：

```
用户名: your-email@example.com（您绑定的邮箱地址）
密码: ea_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx（您的 API 密钥）
```

> **说明**：用户名必须是您在系统中绑定的邮箱地址，密码是对应的 API 密钥。MAIL FROM 地址必须与认证时使用的邮箱一致。

---

### Python smtplib 示例

**基础示例**

```python
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr

SMTP_HOST = 'your-domain.com'
SMTP_PORT = 2525
FROM_EMAIL = 'your-email@example.com'  # 您绑定的邮箱地址
API_KEY = 'ea_live_your_api_key_here'

def send_email(to_email, subject, content, html=False):
    msg = MIMEMultipart('alternative')
    msg['From'] = FROM_EMAIL
    msg['To'] = to_email
    msg['Subject'] = subject

    if html:
        msg.attach(MIMEText(content, 'html', 'utf-8'))
    else:
        msg.attach(MIMEText(content, 'plain', 'utf-8'))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.login(FROM_EMAIL, API_KEY)
        server.sendmail(FROM_EMAIL, to_email, msg.as_string())

send_email(
    to_email='recipient@example.com',
    subject='Python SMTP 测试',
    content='<h1>Hello</h1><p>这是一封通过 SMTP 发送的邮件</p>',
    html=True
)
```

**发送带附件的邮件**

```python
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication

def send_email_with_attachment(to_email, subject, text, file_path):
    msg = MIMEMultipart()
    msg['From'] = FROM_EMAIL
    msg['To'] = to_email
    msg['Subject'] = subject

    msg.attach(MIMEText(text, 'plain', 'utf-8'))

    with open(file_path, 'rb') as f:
        attachment = MIMEApplication(f.read())
        attachment.add_header('Content-Disposition', 'attachment', filename='document.pdf')
        msg.attach(attachment)

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.login(FROM_EMAIL, API_KEY)
        server.sendmail(FROM_EMAIL, to_email, msg.as_string())

send_email_with_attachment(
    to_email='recipient@example.com',
    subject='带附件的邮件',
    text='请查收附件',
    file_path='./document.pdf'
)
```

**使用 TLS 加密连接**

```python
import smtplib

def send_email_tls(to_email, subject, content):
    msg = MIMEText(content, 'html', 'utf-8')
    msg['From'] = FROM_EMAIL
    msg['To'] = to_email
    msg['Subject'] = subject

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(FROM_EMAIL, API_KEY)
        server.sendmail(FROM_EMAIL, to_email, msg.as_string())
```

---

### Node.js nodemailer 示例

**安装 nodemailer**

```bash
npm install nodemailer
```

**基础示例**

```javascript
const nodemailer = require('nodemailer');

const FROM_EMAIL = 'your-email@example.com';  // 您绑定的邮箱地址
const API_KEY = 'ea_live_your_api_key_here';

const transporter = nodemailer.createTransport({
  host: 'your-domain.com',
  port: 2525,
  auth: {
    user: FROM_EMAIL,
    pass: API_KEY
  }
});

async function sendEmail() {
  const info = await transporter.sendMail({
    from: FROM_EMAIL,
    to: 'recipient@example.com',
    subject: 'Node.js SMTP 测试',
    html: '<h1>Hello</h1><p>这是一封通过 SMTP 发送的邮件</p>'
  });

  console.log('Message sent:', info.messageId);
}

sendEmail().catch(console.error);
```

**发送带附件的邮件**

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'your-domain.com',
  port: 2525,
  auth: {
    user: FROM_EMAIL,
    pass: API_KEY
  }
});

async function sendEmailWithAttachment() {
  const info = await transporter.sendMail({
    from: FROM_EMAIL,
    to: 'recipient@example.com',
    subject: '带附件的邮件',
    text: '请查收附件',
    attachments: [
      {
        filename: 'document.pdf',
        path: './document.pdf'
      },
      {
        filename: 'report.xlsx',
        content: Buffer.from('...') // 或使用 Buffer
      }
    ]
  });

  console.log('Message sent:', info.messageId);
}

sendEmailWithAttachment().catch(console.error);
```

**使用 TLS 加密连接**

```javascript
const transporter = nodemailer.createTransport({
  host: 'your-domain.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: FROM_EMAIL,
    pass: API_KEY
  }
});
```

---

### curl 发送邮件示例

使用 curl 通过 SMTP 协议发送邮件：

**基础示例**

```bash
curl --url 'smtp://your-domain.com:2525' \
  --mail-from 'sender@example.com' \
  --mail-rcpt 'recipient@example.com' \
  --user 'sender@example.com:ea_live_your_api_key_here' \
  --upload-file email.txt
```

**email.txt 文件内容**

```
Subject: curl SMTP 测试
From: sender@example.com
To: recipient@example.com
Content-Type: text/html; charset=utf-8

<h1>Hello</h1>
<p>这是一封通过 curl 发送的邮件</p>
```

**发送给多个收件人**

```bash
curl --url 'smtp://your-domain.com:2525' \
  --mail-from 'sender@example.com' \
  --mail-rcpt 'recipient1@example.com' \
  --mail-rcpt 'recipient2@example.com' \
  --user 'sender@example.com:ea_live_your_api_key_here' \
  --upload-file email.txt
```

---

### 常见问题

#### Q: 端口配置问题

**问题**：连接 SMTP 服务器失败

**解决方案**：
1. 检查 SMTP 服务器是否启动
2. 确认端口是否正确（默认 2525）
3. 检查防火墙是否放行端口
4. 生产环境建议使用 25 或 587 端口

```bash
# 测试端口连通性
telnet your-domain.com 2525

# 或使用 nc
nc -zv your-domain.com 2525
```

#### Q: TLS 配置问题

**问题**：STARTTLS 失败或证书错误

**解决方案**：
1. 确认服务器已配置 TLS 证书
2. 检查证书路径是否正确
3. 开发环境可以跳过证书验证

```python
# Python 跳过证书验证（仅开发环境）
import ssl
context = ssl.create_default_context()
context.check_hostname = False
context.verify_mode = ssl.CERT_NONE

FROM_EMAIL = 'your-email@example.com'  # 您绑定的邮箱地址
API_KEY = 'ea_live_your_api_key_here'

with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
    server.starttls(context=context)
    server.login(FROM_EMAIL, API_KEY)
```

```javascript
// Node.js 跳过证书验证（仅开发环境）
const FROM_EMAIL = 'your-email@example.com';  // 您绑定的邮箱地址
const API_KEY = 'ea_live_your_api_key_here';

const transporter = nodemailer.createTransport({
  host: 'your-domain.com',
  port: 2525,
  secure: false,
  tls: {
    rejectUnauthorized: false
  },
  auth: {
    user: FROM_EMAIL,
    pass: API_KEY
  }
});
```

#### Q: 认证失败

**问题**：SMTP 认证返回 535 错误

**解决方案**：
1. 确认用户名是否为您绑定的邮箱地址
2. 确认密码是否为有效的 API 密钥（以 `ea_live_` 开头）
3. 检查 API 密钥是否已删除或禁用
4. 确认该邮箱账户是否属于您的账号
5. 检查 API 密钥是否有权限使用该邮箱账户

---

## 常见问题解答

### Q1: 添加邮箱时提示「SMTP 验证失败」怎么办？

**可能原因及解决方案**：

1. **用户名或密码错误**
   - 确认 SMTP 用户名是否正确（通常为邮箱地址）
   - Gmail/QQ/163 等邮箱需要使用「应用专用密码」或「授权码」

2. **SMTP 服务器地址或端口错误**
   - 检查 SMTP 服务器地址是否正确
   - 尝试更换端口（常见端口：25、465、587）

3. **网络问题**
   - 检查服务器是否能访问外部网络
   - 部分云服务商可能封禁了 25 端口，请尝试使用 465 或 587

4. **SSL/TLS 设置**
   - 端口 465 通常使用 SSL
   - 端口 587 通常使用 TLS（STARTTLS）

### Q2: 发送邮件时提示「发件人邮箱未绑定或不存在」？

确保请求中的 `from` 字段与您绑定的邮箱账户中的 `fromEmail` 完全一致。

### Q3: API 密钥忘记了怎么办？

API 密钥创建后仅显示一次，无法再次查看。如果忘记了密钥，请删除旧密钥并创建新密钥。

### Q4: 如何限制 API 密钥只能使用特定邮箱？

创建密钥时选择「指定邮箱」权限范围，然后勾选允许使用的邮箱账户。

### Q5: 邮件发送失败但没有错误信息？

1. 检查 SMTP 配置是否正确
2. 查看邮箱账户是否被删除
3. 检查 API 密钥是否有权限使用该邮箱
4. 查看服务器日志获取详细错误信息

### Q6: 如何发送带附件的邮件？

附件需要使用 Base64 编码：

```javascript
const fs = require('fs');
const fileContent = fs.readFileSync('document.pdf');
const base64Content = fileContent.toString('base64');

const emailData = {
  from: 'sender@gmail.com',
  to: 'recipient@example.com',
  subject: '带附件的邮件',
  html: '<p>请查收附件</p>',
  attachments: [{
    filename: 'document.pdf',
    content: base64Content,
    contentType: 'application/pdf'
  }]
};
```

### Q7: 邮件发送成功但收件人没收到？

1. 检查收件人邮箱地址是否正确
2. 检查邮件是否被归类到垃圾邮件
3. 检查发件人邮箱是否有发送限制
4. 联系收件人确认是否设置了邮件过滤规则

### Q8: 如何批量发送邮件？

循环调用发送接口，或使用收件人数组：

```javascript
// 方式一：收件人数组（同时发送给多人）
{
  "to": ["user1@example.com", "user2@example.com", "user3@example.com"],
  "subject": "群发邮件"
}

// 方式二：循环发送（分别发送）
const recipients = ['user1@example.com', 'user2@example.com'];
for (const to of recipients) {
  await sendEmail({ from, to, subject, html });
}
```

### Q9: Gmail 提示「应用专用密码」是什么？

出于安全考虑，Google 不再支持使用账号密码直接登录第三方应用。您需要：

1. 开启 Google 账户的两步验证
2. 在「安全性」设置中生成「应用专用密码」
3. 使用生成的 16 位密码作为 SMTP 密码

### Q10: 如何查看邮件发送记录？

目前系统会记录所有邮件发送日志。后续版本将提供日志查询界面。

---

## 技术支持

如果您在使用过程中遇到问题，请：

1. 查阅本文档和 API 文档
2. 检查系统日志获取详细错误信息
3. 联系技术支持团队

---

## 更新日志

### v1.3.0（当前版本）

- 新增代理管理功能
- 支持添加、编辑、删除代理配置
- 支持 HTTP、HTTPS、SOCKS5 代理协议
- 新增代理连通性测试功能（单个测试、全部测试）
- 邮箱账户可关联代理，发送邮件时自动使用代理转发
- 优化发送日志显示代理信息

### v1.2.0

- 新增邮箱验证码注册功能
- 新增忘记密码重置功能
- 新增 API 密钥数量限制功能
- 优化用户注册流程安全性

### v1.1.0

- 新增用户等级系统
- 新增邮箱数量限制功能
- 新增账户禁用功能
- 新增超级管理后台

### v0.1.0

- 用户注册与登录
- SMTP 邮箱账户管理
- API 密钥管理
- 邮件发送 API
- 邮件发送日志记录

---

## 用户等级说明

系统采用用户等级制度，不同等级的用户拥有不同的邮箱数量限制。

### 等级与权限

| 等级名称 | 邮箱数量限制 | 说明 |
|----------|--------------|------|
| 免费用户 | 2 | 默认注册用户的等级 |
| 基础版 | 5 | 基础付费用户 |
| 专业版 | 20 | 专业用户 |
| 企业版 | 100 | 企业用户 |

### 查看当前等级

登录后，在「账号设置」页面可以查看您当前的等级和邮箱数量限制。

### 升级等级

如需升级等级，请联系管理员进行处理。

---

## 邮箱数量限制

### 限制规则

- 每个用户可添加的邮箱数量由其等级决定
- 添加邮箱时会自动检查是否达到上限
- 达到上限后，需要删除已有邮箱或升级等级才能继续添加

### 查看剩余配额

在「邮箱管理」页面顶部会显示当前已用数量和总配额，例如：`已添加 3/5 个邮箱`

### 常见问题

**Q: 我已经达到邮箱数量上限，还想添加更多邮箱怎么办？**

A: 您可以：
1. 删除不再使用的邮箱账户
2. 联系管理员升级您的等级

**Q: 删除邮箱后，相关的 API 密钥还能使用吗？**

A: 如果 API 密钥的权限范围是「指定邮箱」，且删除的邮箱在授权列表中，则该密钥将无法使用已删除的邮箱发送邮件。

---

## 账户状态说明

### 账户状态类型

| 状态 | 说明 |
|------|------|
| 正常 | 账户可正常使用所有功能 |
| 已禁用 | 账户已被管理员禁用，无法登录和使用 |

### 账户被禁用的表现

如果您的账户被管理员禁用，将会出现以下情况：

1. **无法登录**：登录时会提示「您的账户已被禁用，请联系管理员」
2. **API 调用失败**：使用您的 API 密钥发送邮件时会返回错误
3. **SMTP 认证失败**：通过 SMTP 协议发送邮件时认证会被拒绝

### 如何恢复账户

如果您的账户被禁用，请联系系统管理员了解原因并申请恢复。
