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

export default function SendTestPage() {
  const router = useRouter();
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email: string; name?: string | null } | null>(
    null
  );

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

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">API 使用说明</h4>
            <div className="text-sm text-blue-700 space-y-2">
              <p>
                <strong>请求方式:</strong> POST
              </p>
              <p>
                <strong>请求地址:</strong> /api/send
              </p>
              <p>
                <strong>请求头:</strong>
              </p>
              <pre className="bg-blue-100 p-2 rounded mt-1 overflow-x-auto">
                {`Authorization: Bearer ea_live_xxx
Content-Type: application/json`}
              </pre>
              <p>
                <strong>请求体示例:</strong>
              </p>
              <pre className="bg-blue-100 p-2 rounded mt-1 overflow-x-auto text-xs">
                {`{
  "from": "sender@example.com",
  "to": ["recipient@example.com"],
  "subject": "邮件主题",
  "text": "纯文本内容",
  "html": "<p>HTML内容</p>",
  "cc": ["cc@example.com"],
  "bcc": ["bcc@example.com"]
}`}
              </pre>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
