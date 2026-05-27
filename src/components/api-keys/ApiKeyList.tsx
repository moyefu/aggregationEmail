"use client";

import { useState } from "react";

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

interface ApiKeyListProps {
  apiKeys: ApiKeyItem[];
  onDelete: (id: string) => void;
  isLoading: boolean;
}

export default function ApiKeyList({ apiKeys, onDelete, isLoading }: ApiKeyListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewKeyId, setViewKeyId] = useState<string | null>(null);
  const [viewPassword, setViewPassword] = useState("");
  const [viewError, setViewError] = useState("");
  const [isViewing, setIsViewing] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error">("idle");

  const handleDelete = async () => {
    if (!deleteId) return;
    
    setIsDeleting(true);
    try {
      await onDelete(deleteId);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handleViewKey = async () => {
    if (!viewKeyId) return;
    
    if (!viewPassword.trim()) {
      setViewError("请输入密码");
      return;
    }

    setIsViewing(true);
    setViewError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/api-keys/${viewKeyId}/reveal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: viewPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setRevealedKey(data.key);
        setViewError("");
      } else {
        setViewError(data.error || "验证失败");
      }
    } catch (err) {
      setViewError("网络错误，请稍后重试");
    } finally {
      setIsViewing(false);
    }
  };

  const closeViewModal = () => {
    setViewKeyId(null);
    setViewPassword("");
    setViewError("");
    setRevealedKey(null);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("success");
      setTimeout(() => setCopyStatus("idle"), 3000);
    } catch (err) {
      setCopyStatus("error");
      setTimeout(() => setCopyStatus("idle"), 3000);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getScopeLabel = (scope: string) => {
    return scope === "ALL" ? "全部邮箱" : "指定邮箱";
  };

  if (apiKeys.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">暂无 API 密钥</h3>
        <p className="mt-1 text-sm text-gray-500">
          点击上方按钮创建您的第一个 API 密钥
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <ul className="divide-y divide-gray-200">
          {apiKeys.map((apiKey) => (
            <li key={apiKey.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">
                      {apiKey.name}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 rounded-full text-xs font-medium ${
                        apiKey.scope === "ALL"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {getScopeLabel(apiKey.scope)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-500">
                    <code className="bg-gray-100 px-2 py-1 rounded font-mono text-xs">
                      {apiKey.key}
                    </code>
                    <span>调用: {apiKey.usageCount}</span>
                    {apiKey.lastUsedAt && (
                      <span className="hidden sm:inline">最后使用: {formatDate(apiKey.lastUsedAt)}</span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-gray-400">
                    创建于 {formatDate(apiKey.createdAt)}
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:ml-4">
                  <button
                onClick={() => setViewKeyId(apiKey.id)}
                disabled={isLoading}
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-2.5 sm:py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation cursor-pointer"
              >
                    <svg
                      className="mr-1.5 h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    查看密钥
                  </button>
                  <button
                onClick={() => setDeleteId(apiKey.id)}
                disabled={isLoading}
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-2.5 sm:py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation cursor-pointer"
              >
                    <svg
                      className="mr-1.5 h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    删除
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {deleteId && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              确认删除 API 密钥
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              删除后，使用此密钥的所有 API 请求将失败。此操作无法撤销。
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? "删除中..." : "确认删除"}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewKeyId && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">查看 API 密钥</h3>
              <button onClick={closeViewModal} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {revealedKey ? (
              <div>
                <p className="text-sm text-gray-500 mb-3">您的 API 密钥：</p>
                <div className="bg-gray-100 p-3 rounded-md mb-4">
                  <code className="text-sm font-mono break-all">{revealedKey}</code>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(revealedKey)}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      copyStatus === "success"
                        ? "bg-green-600 text-white"
                        : copyStatus === "error"
                        ? "bg-red-600 text-white"
                        : "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                    }`}
                  >
                    {copyStatus === "success"
                      ? "复制成功！"
                      : copyStatus === "error"
                      ? "复制失败"
                      : "复制密钥"}
                  </button>
                  <button
                    onClick={closeViewModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
                  >
                    关闭
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500 mb-4">
                  为保护您的账户安全，查看完整密钥需要验证登录密码
                </p>

                {viewError && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                    {viewError}
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    登录密码
                  </label>
                  <input
                    type="password"
                    value={viewPassword}
                    onChange={(e) => {
                      setViewPassword(e.target.value);
                      setViewError("");
                    }}
                    placeholder="请输入您的登录密码"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isViewing}
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={closeViewModal}
                    disabled={isViewing}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleViewKey}
                    disabled={isViewing}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                  >
                    {isViewing ? "验证中..." : "确认"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
