"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import UserMenu from "@/components/layout/UserMenu";

interface User {
  id: string;
  email: string;
  name: string | null;
}

interface EmailAccount {
  id: string;
  fromEmail: string;
  fromName: string | null;
  isVerified: boolean;
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  scope: string;
  usageCount: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      router.push("/login");
      return;
    }

    setUser(JSON.parse(userStr));
    fetchDashboardData(token);
  }, [router]);

  const fetchDashboardData = async (token: string) => {
    try {
      const [emailRes, keyRes] = await Promise.all([
        fetch("/api/email-accounts", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/api-keys", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (emailRes.ok) {
        const emailData = await emailRes.json();
        setEmailAccounts(emailData.accounts || []);
      }

      if (keyRes.ok) {
        const keyData = await keyRes.json();
        setApiKeys(keyData.keys || []);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900 hover:text-blue-600">
                邮件聚合服务
              </Link>
            </div>
            <div className="flex items-center">
              {user && <UserMenu user={user} />}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/email-accounts"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md hover:border-blue-300 border-2 border-transparent transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">邮箱账户</p>
                <p className="text-3xl font-bold text-gray-900">{emailAccounts.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p className="text-blue-600 text-sm mt-2">点击管理邮箱 →</p>
          </Link>

          <Link
            href="/api-keys"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md hover:border-green-300 border-2 border-transparent transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">API 密钥</p>
                <p className="text-3xl font-bold text-gray-900">{apiKeys.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
            </div>
            <p className="text-green-600 text-sm mt-2">点击管理密钥 →</p>
          </Link>

          <Link
            href="/send-test"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md hover:border-purple-300 border-2 border-transparent transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">发送测试</p>
                <p className="text-gray-500 text-sm">测试邮件发送功能</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
            </div>
            <p className="text-purple-600 text-sm mt-2">点击发送测试 →</p>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">邮箱账户</h2>
              <Link
                href="/email-accounts"
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                管理 →
              </Link>
            </div>
            <div className="p-6">
              {emailAccounts.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-4">暂无邮箱账户</p>
                  <Link
                    href="/email-accounts"
                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    添加邮箱
                  </Link>
                </div>
              ) : (
                <ul className="space-y-3">
                  {emailAccounts.slice(0, 5).map((account) => (
                    <li key={account.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="font-medium text-gray-900">{account.fromEmail}</p>
                        {account.fromName && (
                          <p className="text-sm text-gray-500">{account.fromName}</p>
                        )}
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        account.isVerified
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {account.isVerified ? "已验证" : "未验证"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">API 密钥</h2>
              <Link
                href="/api-keys"
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                管理 →
              </Link>
            </div>
            <div className="p-6">
              {apiKeys.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-4">暂无 API 密钥</p>
                  <Link
                    href="/api-keys"
                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    创建密钥
                  </Link>
                </div>
              ) : (
                <ul className="space-y-3">
                  {apiKeys.slice(0, 5).map((key) => (
                    <li key={key.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="font-medium text-gray-900">{key.name}</p>
                        <p className="text-sm text-gray-500 font-mono">{key.key}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        key.scope === "ALL"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-orange-100 text-orange-800"
                      }`}>
                        {key.scope === "ALL" ? "全部邮箱" : "指定邮箱"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
