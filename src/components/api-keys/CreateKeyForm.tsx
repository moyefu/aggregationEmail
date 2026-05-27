"use client";

import { useState, useEffect, FormEvent } from "react";

interface EmailAccount {
  id: string;
  fromEmail: string;
  fromName: string | null;
}

interface CreateKeyFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CreateKeyForm({ onSuccess, onCancel }: CreateKeyFormProps) {
  const [name, setName] = useState("");
  const [scope, setScope] = useState<"ALL" | "SPECIFIC">("ALL");
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [error, setError] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  useEffect(() => {
    fetchEmailAccounts();
  }, []);

  const fetchEmailAccounts = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/email-accounts?limit=100", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEmailAccounts(data.accounts || []);
      }
    } catch (err) {
      console.error("获取邮箱账户失败:", err);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          scope,
          allowedEmailAccountIds: scope === "SPECIFIC" ? selectedAccounts : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "创建失败");
        setIsLoading(false);
        return;
      }

      setCreatedKey(data.key);
      setIsLoading(false);
    } catch (err) {
      setError("网络错误，请稍后重试");
      setIsLoading(false);
    }
  };

  const handleAccountToggle = (accountId: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId]
    );
  };

  const handleCopyKey = () => {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey);
    }
  };

  const handleClose = () => {
    if (createdKey) {
      onSuccess();
    } else {
      onCancel();
    }
  };

  if (createdKey) {
    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              API 密钥创建成功
            </h3>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
            <div className="flex">
              <svg
                className="h-5 w-5 text-yellow-400 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="text-sm text-yellow-700">
                <strong>重要提示：</strong>请立即复制并妥善保管此密钥。您也可以在需要时通过验证密码重新查看密钥。
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-md p-3 mb-4">
            <div className="flex items-center justify-between">
              <code className="text-sm font-mono text-gray-800 break-all">
                {createdKey}
              </code>
              <button
                onClick={handleCopyKey}
                className="ml-2 p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors cursor-pointer"
                title="复制密钥"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
            >
              我已保存，关闭
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          创建 API 密钥
        </h3>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              密钥名称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：生产环境密钥"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={isLoading}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              权限范围
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="scope"
                  value="ALL"
                  checked={scope === "ALL"}
                  onChange={() => setScope("ALL")}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  disabled={isLoading}
                />
                <span className="ml-2 text-sm text-gray-700">
                  全部邮箱 - 可使用所有邮箱账户发送邮件
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="scope"
                  value="SPECIFIC"
                  checked={scope === "SPECIFIC"}
                  onChange={() => setScope("SPECIFIC")}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  disabled={isLoading}
                />
                <span className="ml-2 text-sm text-gray-700">
                  指定邮箱 - 仅可使用选定的邮箱账户
                </span>
              </label>
            </div>
          </div>

          {scope === "SPECIFIC" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择邮箱账户
              </label>
              {isLoadingAccounts ? (
                <div className="text-sm text-gray-500">加载中...</div>
              ) : emailAccounts.length === 0 ? (
                <div className="text-sm text-gray-500">
                  暂无邮箱账户，请先添加邮箱账户
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-2">
                  {emailAccounts.map((account) => (
                    <label
                      key={account.id}
                      className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAccounts.includes(account.id)}
                        onChange={() => handleAccountToggle(account.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={isLoading}
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {account.fromName ? `${account.fromName} <${account.fromEmail}>` : account.fromEmail}
                      </span>
                    </label>
                  ))}
                </div>
              )}
              {scope === "SPECIFIC" && selectedAccounts.length === 0 && emailAccounts.length > 0 && (
                <p className="mt-1 text-xs text-red-500">
                  请至少选择一个邮箱账户
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isLoading || (scope === "SPECIFIC" && selectedAccounts.length === 0)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "创建中..." : "创建密钥"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
