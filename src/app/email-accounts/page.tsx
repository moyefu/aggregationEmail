"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import EmailAccountList, { EmailAccountItem } from "@/components/email-accounts/EmailAccountList";
import AddEmailForm from "@/components/email-accounts/AddEmailForm";
import EditEmailForm from "@/components/email-accounts/EditEmailForm";
import PasswordVerifyModal from "@/components/email-accounts/PasswordVerifyModal";
import UserMenu from "@/components/layout/UserMenu";

export default function EmailAccountsPage() {
  const router = useRouter();
  const [emailAccounts, setEmailAccounts] = useState<EmailAccountItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string; name?: string | null } | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [editingAccount, setEditingAccount] = useState<EmailAccountItem | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingEditId, setPendingEditId] = useState<string | null>(null);
  const [verifyResults, setVerifyResults] = useState<{ total: number; success: number; failed: number } | null>(null);
  const [emailLimit, setEmailLimit] = useState<{ current: number; max: number }>({ current: 0, max: 5 });

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

  const fetchEmailAccounts = async (page = 1) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(`/api/email-accounts?page=${page}&limit=${pagination.limit}`, {
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
        setPagination(data.pagination);
        if (data.emailLimit) {
          setEmailLimit(data.emailLimit);
        }
      } else {
        console.error("获取邮箱列表失败:", data.error);
      }
    } catch (error) {
      console.error("获取邮箱列表错误:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(`/api/email-accounts/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        fetchEmailAccounts(pagination.page);
      } else {
        alert(data.error || "删除失败");
      }
    } catch (error) {
      console.error("删除邮箱账户错误:", error);
      alert("删除失败，请稍后重试");
    }
  };

  const handleVerifyAll = async () => {
    setIsVerifying(true);
    setVerifyResults(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/email-accounts/verify-all", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setVerifyResults({
          total: data.total,
          success: data.success,
          failed: data.failed,
        });
        fetchEmailAccounts(pagination.page);
      } else {
        alert(data.error || "验证失败");
      }
    } catch (error) {
      console.error("验证所有邮箱错误:", error);
      alert("验证失败，请稍后重试");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleEditClick = (id: string) => {
    setPendingEditId(id);
    setShowPasswordModal(true);
  };

  const handlePasswordVerified = () => {
    if (pendingEditId) {
      const account = emailAccounts.find((a) => a.id === pendingEditId);
      if (account) {
        setEditingAccount(account);
      }
    }
    setShowPasswordModal(false);
    setPendingEditId(null);
  };

  const handleEditSuccess = () => {
    setEditingAccount(null);
    fetchEmailAccounts(pagination.page);
  };

  const handleAddSuccess = () => {
    setShowAddForm(false);
    fetchEmailAccounts(1);
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

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">邮箱账户管理</h1>
              <span className="text-sm text-gray-500">
                当前邮箱：{emailLimit.current}/{emailLimit.max} 个
              </span>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              disabled={emailLimit.current >= emailLimit.max}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {showAddForm ? (
                <>
                  <svg
                    className="mr-2 -ml-1 h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  取消
                </>
              ) : (
                <>
                  <svg
                    className="mr-2 -ml-1 h-5 w-5"
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
                  添加邮箱
                </>
              )}
            </button>
          </div>

          {emailLimit.current >= emailLimit.max && !showAddForm && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                您已达到邮箱数量上限（{emailLimit.max}个），请升级等级或删除不需要的邮箱后再添加。
              </p>
            </div>
          )}

          {verifyResults && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                验证完成：共 {verifyResults.total} 个邮箱，成功 {verifyResults.success} 个，失败 {verifyResults.failed} 个
              </p>
            </div>
          )}

          {showAddForm && (
            <div className="mb-6">
              <AddEmailForm
                onSuccess={handleAddSuccess}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          )}

          <EmailAccountList
            emailAccounts={emailAccounts}
            onDelete={handleDelete}
            onRefresh={() => fetchEmailAccounts(pagination.page)}
            onVerifyAll={handleVerifyAll}
            onEdit={handleEditClick}
            isLoading={isLoading}
            isVerifying={isVerifying}
          />

          {pagination.totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => fetchEmailAccounts(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  上一页
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  第 {pagination.page} / {pagination.totalPages} 页
                </span>
                <button
                  onClick={() => fetchEmailAccounts(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  下一页
                </button>
              </nav>
            </div>
          )}
        </div>
      </main>

      {showPasswordModal && (
        <PasswordVerifyModal
          onVerified={handlePasswordVerified}
          onCancel={() => {
            setShowPasswordModal(false);
            setPendingEditId(null);
          }}
        />
      )}

      {editingAccount && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <EditEmailForm
              account={editingAccount}
              onSuccess={handleEditSuccess}
              onCancel={() => setEditingAccount(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
