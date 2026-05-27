"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ApiKeyList from "@/components/api-keys/ApiKeyList";
import CreateKeyForm from "@/components/api-keys/CreateKeyForm";
import UserMenu from "@/components/layout/UserMenu";

interface ApiKeyItem {
  id: string;
  name: string;
  key: string;
  scope: string;
  allowedEmailAccountIds: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  usageCount: number;
}

interface ApiKeyLimit {
  current: number;
  max: number;
}

export default function ApiKeysPage() {
  const router = useRouter();
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string; name?: string | null } | null>(null);
  const [apiKeyLimit, setApiKeyLimit] = useState<ApiKeyLimit>({ current: 0, max: 10 });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token) {
      router.push("/login");
      return;
    }

    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error("解析用户信息失败:", e);
      }
    }

    fetchApiKeys();
  }, [router]);

  const fetchApiKeys = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/api-keys", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.keys || []);
        if (data.apiKeyLimit) {
          setApiKeyLimit(data.apiKeyLimit);
        }
      }
    } catch (err) {
      console.error("获取 API 密钥列表失败:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/api-keys/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setApiKeys((prev) => prev.filter((key) => key.id !== id));
        setApiKeyLimit((prev) => ({ ...prev, current: prev.current - 1 }));
      } else {
        const data = await response.json();
        alert(data.error || "删除失败");
      }
    } catch (err) {
      console.error("删除 API 密钥失败:", err);
      alert("删除失败，请稍后重试");
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    fetchApiKeys();
  };

  const isLimitReached = apiKeyLimit.current >= apiKeyLimit.max;

  return (
    <div className="flex-1 bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900 hover:text-blue-600">
                邮件聚合平台
              </Link>
            </div>
            <div className="flex items-center">
              {user && <UserMenu user={user} />}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                API 密钥管理
                <span className="ml-3 text-sm font-normal text-gray-500">
                  当前密钥：{apiKeyLimit.current}/{apiKeyLimit.max} 个
                </span>
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                创建和管理用于 API 调用的密钥
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              disabled={isLoading || isLimitReached}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              创建密钥
            </button>
          </div>
        </div>

        {isLimitReached && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-yellow-800 text-sm">
                您已达到 API 密钥数量上限（{apiKeyLimit.max}个），请删除不需要的密钥后再创建新密钥
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-sm font-medium text-gray-900 mb-3">使用说明</h2>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">1.</span>
              创建 API 密钥后，请立即复制并妥善保管。您也可以在需要时通过验证密码重新查看密钥
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">2.</span>
              使用密钥时，在请求头中添加 <code className="bg-gray-100 px-1 rounded">Authorization: Bearer YOUR_API_KEY</code>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">3.</span>
              可以设置密钥的权限范围，限制其只能使用特定的邮箱账户
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">4.</span>
              如需更换密钥，请删除旧密钥并创建新密钥
            </li>
          </ul>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <svg
              className="animate-spin h-8 w-8 text-blue-500"
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
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        ) : (
          <ApiKeyList
            apiKeys={apiKeys}
            onDelete={handleDelete}
            isLoading={isLoading}
          />
        )}
      </main>

      {showCreateForm && (
        <CreateKeyForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateForm(false)}
        />
      )}
    </div>
  );
}
