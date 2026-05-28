"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SendTestForm from "@/components/send-test/SendTestForm";
import UserMenu from "@/components/layout/UserMenu";

interface EmailAccount {
  id: string;
  fromEmail: string;
  fromName: string | null;
  smtpHost: string;
}

type TabKey = "formdata" | "json" | "smtp";

const tabs: { key: TabKey; label: string }[] = [
  { key: "formdata", label: "Form-Data" },
  { key: "json", label: "JSON" },
  { key: "smtp", label: "SMTP" },
];

export default function SendTestPage() {
  const router = useRouter();
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email: string; name?: string | null } | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<TabKey>("formdata");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      router.push("/login");
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      setUser(userData);
    } catch {
      router.push("/login");
      return;
    }

    fetchEmailAccounts();
  }, [router]);

  const fetchEmailAccounts = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/email-accounts?limit=100", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      const data = await response.json();

      if (response.ok) {
        setEmailAccounts(data.accounts || []);
      } else {
        console.error("获取邮箱列表失败:", data.error);
      }
    } catch (error) {
      console.error("获取邮箱列表错误:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendSuccess = () => {
    console.log("邮件发送成功");
  };

  return (
    <div className="flex-1 bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900 hover:text-blue-600">
                邮箱聚合系统
              </Link>
            </div>
            <div className="flex items-center">
              {user && <UserMenu user={user} />}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">邮件发送测试</h1>
            <p className="mt-1 text-sm text-gray-600">
              使用 API 密钥测试邮件发送功能
            </p>
          </div>

          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">API 密钥</h3>
            <p className="text-sm text-gray-600 mb-4">
              请输入您的 API 密钥用于发送邮件。您可以在{" "}
              <Link href="/api-keys" className="text-blue-600 hover:underline">
                API 密钥管理
              </Link>{" "}
              页面创建和管理密钥。
            </p>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="ea_live_xxxxxxxxxxxxxxxx"
              className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <svg
                className="animate-spin h-8 w-8 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          ) : (
            <div className="bg-white shadow-md rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">发送邮件</h3>
              <SendTestForm
                emailAccounts={emailAccounts}
                apiKey={apiKey}
                onSuccess={handleSendSuccess}
              />
            </div>
          )}

          <div className="mt-6 bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                      activeTab === tab.key
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-5">
              {activeTab === "formdata" && (
                <div className="space-y-3 text-sm text-gray-700">
                  <p className="text-gray-900 font-medium">multipart/form-data 格式（本页面使用）</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div><span className="text-gray-400">请求方式</span> <span className="ml-2 font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">POST</span></div>
                    <div><span className="text-gray-400">请求地址</span> <span className="ml-2 font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">/api/send</span></div>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1.5">请求头</p>
                    <pre className="bg-gray-50 border border-gray-200 p-3 rounded-md text-xs overflow-x-auto leading-relaxed">{`Authorization: Bearer ea_live_xxx`}</pre>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1.5">cURL 示例 - 纯文本</p>
                    <pre className="bg-gray-50 border border-gray-200 p-3 rounded-md text-xs overflow-x-auto leading-relaxed">{`curl -X POST http://localhost:3000/api/send \\
  -H "Authorization: Bearer ea_live_xxx" \\
  -F "from=sender@example.com" \\
  -F "to=recipient@example.com" \\
  -F "subject=测试邮件" \\
  -F "html=<h1>Hello</h1>"`}</pre>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1.5">cURL 示例 - 带附件</p>
                    <pre className="bg-gray-50 border border-gray-200 p-3 rounded-md text-xs overflow-x-auto leading-relaxed">{`curl -X POST http://localhost:3000/api/send \\
  -H "Authorization: Bearer ea_live_xxx" \\
  -F "from=sender@example.com" \\
  -F "to=recipient@example.com" \\
  -F "subject=带附件的邮件" \\
  -F "html=<p>请查收附件</p>" \\
  -F "attachments=@./report.pdf" \\
  -F "attachments=@./image.png"`}</pre>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1.5">cURL 示例 - 含抄送/密送 + 多收件人</p>
                    <pre className="bg-gray-50 border border-gray-200 p-3 rounded-md text-xs overflow-x-auto leading-relaxed">{`curl -X POST http://localhost:3000/api/send \\
  -H "Authorization: Bearer ea_live_xxx" \\
  -F "from=sender@example.com" \\
  -F "to=recipient1@example.com,recipient2@example.com" \\
  -F "cc=cc@example.com" \\
  -F "bcc=bcc@example.com" \\
  -F "subject=完整测试" \\
  -F "text=请查收附件" \\
  -F "attachments=@./file.pdf"`}</pre>
                  </div>
                  <p className="text-xs text-gray-400 pt-1">文件通过 -F attachments=@/path 直接上传，无需 Base64 编码。支持多个同名字段上传多文件。</p>
                </div>
              )}

              {activeTab === "json" && (
                <div className="space-y-3 text-sm text-gray-700">
                  <p className="text-gray-900 font-medium">JSON 格式（application/json）</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div><span className="text-gray-400">请求方式</span> <span className="ml-2 font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">POST</span></div>
                    <div><span className="text-gray-400">请求地址</span> <span className="ml-2 font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">/api/send</span></div>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1.5">请求头</p>
                    <pre className="bg-gray-50 border border-gray-200 p-3 rounded-md text-xs overflow-x-auto leading-relaxed">{`Content-Type: application/json
Authorization: Bearer ea_live_xxx`}</pre>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1.5">请求体 - 基础</p>
                    <pre className="bg-gray-50 border border-gray-200 p-3 rounded-md text-xs overflow-x-auto leading-relaxed">{`{
  "from": "sender@example.com",
  "to": "recipient@example.com",
  "subject": "测试邮件",
  "html": "<h1>Hello</h1>"
}`}</pre>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1.5">请求体 - 完整（含附件、抄送、密送）</p>
                    <pre className="bg-gray-50 border border-gray-200 p-3 rounded-md text-xs overflow-x-auto leading-relaxed">{`{
  "from": "sender@example.com",
  "to": ["recipient1@example.com", "recipient2@example.com"],
  "subject": "完整功能演示",
  "text": "纯文本备用内容",
  "html": "<h1>完整功能</h1>",
  "cc": "cc@example.com",
  "bcc": ["bcc1@example.com"],
  "attachments": [
    {
      "filename": "report.pdf",
      "content": "JVBERi0xLjQK...",
      "contentType": "application/pdf"
    }
  ]
}`}</pre>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1.5">cURL 示例</p>
                    <pre className="bg-gray-50 border border-gray-200 p-3 rounded-md text-xs overflow-x-auto leading-relaxed">{`curl -X POST http://localhost:3000/api/send \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ea_live_xxx" \\
  -d '{
    "from": "sender@example.com",
    "to": "recipient@example.com",
    "subject": "测试邮件",
    "html": "<h1>Hello</h1>"
  }'`}</pre>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1.5">JavaScript 示例</p>
                    <pre className="bg-gray-50 border border-gray-200 p-3 rounded-md text-xs overflow-x-auto leading-relaxed">{`const res = await fetch('/api/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ea_live_xxx'
  },
  body: JSON.stringify({
    from: 'sender@example.com',
    to: 'recipient@example.com',
    subject: '测试邮件',
    html: '<h1>Hello</h1>'
  })
});
console.log(await res.json());`}</pre>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1.5">Python 示例</p>
                    <pre className="bg-gray-50 border border-gray-200 p-3 rounded-md text-xs overflow-x-auto leading-relaxed">{`import requests

res = requests.post(
    'http://localhost:3000/api/send',
    headers={
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ea_live_xxx'
    },
    json={
        'from': 'sender@example.com',
        'to': 'recipient@example.com',
        'subject': '测试邮件',
        'html': '<h1>Hello</h1>'
    }
)
print(res.json())`}</pre>
                  </div>
                  <p className="text-xs text-gray-400 pt-1">附件 content 字段支持纯 Base64 或 Data URL（data:image/png;base64,...）格式。</p>
                </div>
              )}

              {activeTab === "smtp" && (
                <div className="space-y-3 text-sm text-gray-700">
                  <p className="text-gray-900 font-medium">SMTP 协议发送</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div><span className="text-gray-400">协议</span> <span className="ml-2 font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">SMTP</span></div>
                    <div><span className="text-gray-400">端口</span> <span className="ml-2 font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">2525 (默认)</span></div>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1.5">认证信息</p>
                    <table className="w-full text-xs border border-gray-200 rounded-md overflow-hidden">
                      <tbody>
                        <tr className="border-b border-gray-200"><td className="px-3 py-2 bg-gray-50 text-gray-400 w-28">用户名</td><td className="px-3 py-2 font-mono">账户邮箱地址 注:不是发件邮箱地址</td></tr>
                        <tr><td className="px-3 py-2 bg-gray-50 text-gray-400 w-28">密码</td><td className="px-3 py-2 font-mono">您的 API 密钥（ea_live_xxx）</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1.5">telnet 交互示例</p>
                    <pre className="bg-gray-50 border border-gray-200 p-3 rounded-md text-xs overflow-x-auto leading-relaxed">{`$ telnet localhost 2525
220 aggregation-email SMTP Server Ready

EHLO client.example.com
250-Hello client.example.com
250-AUTH LOGIN
250 8BITMIME

AUTH LOGIN
334 VXNlcm5hbWU6
{输入邮箱的 Base64}
334 UGFzc3dvcmQ6
{输入 API Key 的 Base64}
235 Authentication successful

MAIL FROM:<sender@example.com>
250 OK

RCPT TO:<recipient@example.com>
250 OK

DATA
354 End data with <CR><LF>.<CR><LF>
Subject: Test Email
From: sender@example.com
To: recipient@example.com

This is a test email via SMTP.
.
250 OK: Message accepted

QUIT
221 Bye`}</pre>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1.5">Python smtplib 示例</p>
                    <pre className="bg-gray-50 border border-gray-200 p-3 rounded-md text-xs overflow-x-auto leading-relaxed">{`import smtplib
from email.mime.text import MIMEText

msg = MIMEText("这是一封通过 SMTP 发送的测试邮件", "plain", "utf-8")
msg["From"] = "sender@example.com"
msg["To"] = "recipient@example.com"
msg["Subject"] = "SMTP 测试邮件"

with smtplib.SMTP("localhost", 2525) as smtp:
    smtp.login("sender@example.com", "ea_live_xxx")
    smtp.sendmail("sender@example.com", ["recipient@example.com"], msg.as_string())
    print("邮件发送成功")`}</pre>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1.5">Node.js nodemailer 示例</p>
                    <pre className="bg-gray-50 border border-gray-200 p-3 rounded-md text-xs overflow-x-auto leading-relaxed">{`import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "localhost",
  port: 2525,
  auth: {
    user: "sender@example.com",
    pass: "ea_live_xxx",
  },
});

await transporter.sendMail({
  from: "sender@example.com",
  to: "recipient@example.com",
  subject: "SMTP 测试邮件",
  text: "这是一封通过 SMTP 发送的测试邮件",
});`}</pre>
                  </div>
                  <p className="text-xs text-gray-400 pt-1">用户名必须是已绑定的邮箱地址，密码为 API 密钥。支持 STARTTLS 加密（需配置证书）。</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
