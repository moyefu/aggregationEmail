"use client";

import { useState } from "react";

export interface EmailAccountItem {
  id: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  fromEmail: string;
  fromName: string | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EmailAccountListProps {
  emailAccounts: EmailAccountItem[];
  onDelete: (id: string) => void;
  onRefresh: () => void;
  onVerifyAll: () => void;
  onEdit: (id: string) => void;
  isLoading: boolean;
  isVerifying: boolean;
}

export default function EmailAccountList({
  emailAccounts,
  onDelete,
  onRefresh,
  onVerifyAll,
  onEdit,
  isLoading,
  isVerifying,
}: EmailAccountListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setShowConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
    }
    setShowConfirm(false);
    setDeleteId(null);
  };

  const handleCancelDelete = () => {
    setShowConfirm(false);
    setDeleteId(null);
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (emailAccounts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
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
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        <p className="mt-2">暂无邮箱账户</p>
        <p className="text-sm">点击上方按钮添加新的邮箱账户</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                发件邮箱
              </th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                SMTP 服务器
              </th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                用户名
              </th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                <div className="flex items-center gap-2">
                  状态
                  <button
                      onClick={onVerifyAll}
                      disabled={isVerifying}
                      className="p-1 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
                      title="重新验证所有邮箱"
                    >
                    <svg
                      className={`w-4 h-4 text-gray-500 ${isVerifying ? "animate-spin" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </button>
                </div>
              </th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                创建时间
              </th>
              <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">操作</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {emailAccounts.map((account) => (
              <tr key={account.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                  <div className="font-medium text-gray-900">{account.fromEmail}</div>
                  {account.fromName && (
                    <div className="text-gray-500">{account.fromName}</div>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {account.smtpHost}:{account.smtpPort}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {account.smtpUser}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  {account.isVerified ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      已验证
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                      未验证
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {formatDate(account.createdAt)}
                </td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                  <button
                    onClick={() => onEdit(account.id)}
                    className="text-blue-600 hover:text-blue-900 transition-colors mr-3 cursor-pointer"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDeleteClick(account.id)}
                    className="text-red-600 hover:text-red-900 transition-colors cursor-pointer"
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 mb-4">确认删除</h3>
            <p className="text-sm text-gray-500 mb-6">
              确定要删除此邮箱账户吗？此操作无法撤销。
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 cursor-pointer"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
