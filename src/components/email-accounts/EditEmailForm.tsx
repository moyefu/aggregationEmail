"use client";

import { useState, FormEvent } from "react";
import { EmailAccountItem } from "./EmailAccountList";

interface EditEmailFormProps {
  account: EmailAccountItem;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
}

export default function EditEmailForm({ account, onSuccess, onCancel }: EditEmailFormProps) {
  const [formData, setFormData] = useState<FormData>({
    smtpHost: account.smtpHost,
    smtpPort: account.smtpPort.toString(),
    smtpUser: account.smtpUser,
    smtpPassword: "",
    fromEmail: account.fromEmail,
    fromName: account.fromName || "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
    setTestResult(null);
  };

  const validateForm = (): boolean => {
    if (!formData.smtpHost.trim()) {
      setError("SMTP 服务器地址不能为空");
      return false;
    }
    if (!formData.smtpPort.trim()) {
      setError("端口号不能为空");
      return false;
    }
    const port = parseInt(formData.smtpPort, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      setError("端口号必须是 1-65535 之间的有效数字");
      return false;
    }
    if (!formData.smtpUser.trim()) {
      setError("SMTP 用户名不能为空");
      return false;
    }
    if (!formData.fromEmail.trim()) {
      setError("发件人邮箱不能为空");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.fromEmail)) {
      setError("发件人邮箱格式不正确");
      return false;
    }
    return true;
  };

  const handleSendTestEmail = async () => {
    if (!validateForm()) {
      return;
    }

    if (!testEmail.trim()) {
      setTestResult({ success: false, message: "请输入测试收件人邮箱" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      setTestResult({ success: false, message: "测试收件人邮箱格式不正确" });
      return;
    }

    setSendingTest(true);
    setTestResult(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setTestResult({ success: false, message: "未登录，请先登录" });
        setSendingTest(false);
        return;
      }

      const body: Record<string, unknown> = {
        toEmail: testEmail.trim(),
        smtpHost: formData.smtpHost.trim(),
        smtpPort: parseInt(formData.smtpPort, 10),
        smtpUser: formData.smtpUser.trim(),
        fromEmail: formData.fromEmail.trim(),
        fromName: formData.fromName.trim() || null,
      };

      if (formData.smtpPassword.trim()) {
        body.smtpPassword = formData.smtpPassword;
      }

      const response = await fetch(`/api/email-accounts/${account.id}/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        setTestResult({ success: true, message: `测试邮件已发送到 ${testEmail}，请检查收件箱` });
      } else {
        setTestResult({ success: false, message: data.error || "发送测试邮件失败" });
      }
    } catch (err) {
      setTestResult({ success: false, message: "网络错误，请稍后重试" });
    } finally {
      setSendingTest(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("未登录，请先登录");
        setIsLoading(false);
        return;
      }

      const body: Record<string, unknown> = {
        smtpHost: formData.smtpHost.trim(),
        smtpPort: parseInt(formData.smtpPort, 10),
        smtpUser: formData.smtpUser.trim(),
        fromEmail: formData.fromEmail.trim(),
        fromName: formData.fromName.trim() || null,
      };

      if (formData.smtpPassword.trim()) {
        body.smtpPassword = formData.smtpPassword;
      }

      const response = await fetch(`/api/email-accounts/${account.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || `更新失败 (${response.status})`);
        setIsLoading(false);
        return;
      }

      setSuccess("邮箱账户更新成功！");
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err) {
      console.error("保存邮箱账户错误:", err);
      setError(err instanceof Error ? err.message : "网络错误，请稍后重试");
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">编辑邮箱账户</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 cursor-pointer">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="smtpHost">
              SMTP 服务器 <span className="text-red-500">*</span>
            </label>
            <input
              className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              id="smtpHost"
              name="smtpHost"
              type="text"
              placeholder="例如: smtp.qq.com"
              value={formData.smtpHost}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="smtpPort">
              端口 (25|465|587) <span className="text-red-500">*</span>
            </label>
            <input
              className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              id="smtpPort"
              name="smtpPort"
              type="number"
              placeholder="587"
              value={formData.smtpPort}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="smtpUser">
              SMTP 用户名 <span className="text-red-500">*</span>
            </label>
            <input
              className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              id="smtpUser"
              name="smtpUser"
              type="text"
              placeholder="SMTP 登录用户名"
              value={formData.smtpUser}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="smtpPassword">
              SMTP 密码 <span className="text-gray-400 text-xs">(留空则不修改)</span>
            </label>
            <input
              className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              id="smtpPassword"
              name="smtpPassword"
              type="password"
              placeholder="留空则不修改密码"
              value={formData.smtpPassword}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="fromEmail">
              发件人邮箱 <span className="text-red-500">*</span>
            </label>
            <input
              className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              id="fromEmail"
              name="fromEmail"
              type="email"
              placeholder="发件人邮箱地址"
              value={formData.fromEmail}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="fromName">
              发件人名称
            </label>
            <input
              className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              id="fromName"
              name="fromName"
              type="text"
              placeholder="发件人显示名称（可选）"
              value={formData.fromName}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4 mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">发送测试邮件</h4>
          <p className="text-xs text-gray-500 mb-3">如未填写新密码，将使用已保存的密码发送测试邮件</p>
          <div className="flex gap-3">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => {
                setTestEmail(e.target.value);
                setTestResult(null);
              }}
              placeholder="输入收件人邮箱进行测试"
              className="flex-1 shadow-sm appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              disabled={sendingTest || isLoading}
            />
            <button
              type="button"
              onClick={handleSendTestEmail}
              disabled={sendingTest || isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
            >
              {sendingTest ? "发送中..." : "发送测试邮件"}
            </button>
          </div>
          {testResult && (
            <div className={`mt-2 text-sm ${testResult.success ? "text-green-600" : "text-red-600"}`}>
              {testResult.message}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            disabled={isLoading}
          >
            取消
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            disabled={isLoading}
          >
            {isLoading ? "保存中..." : "保存修改"}
          </button>
        </div>
      </form>
    </div>
  );
}
