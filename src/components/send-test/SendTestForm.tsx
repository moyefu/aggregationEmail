"use client";

import { useState, FormEvent } from "react";

interface EmailAccount {
  id: string;
  fromEmail: string;
  fromName: string | null;
  smtpHost: string;
}

interface SendTestFormProps {
  emailAccounts: EmailAccount[];
  apiKey: string;
  onSuccess: () => void;
}

interface FormData {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  cc: string;
  bcc: string;
}

const initialFormData: FormData = {
  from: "",
  to: "",
  subject: "",
  text: "",
  html: "",
  cc: "",
  bcc: "",
};

export default function SendTestForm({ emailAccounts, apiKey, onSuccess }: SendTestFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [contentMode, setContentMode] = useState<"text" | "html">("text");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  };

  const validateForm = (): boolean => {
    if (!formData.from) {
      setError("请选择发件人邮箱");
      return false;
    }
    if (!formData.to.trim()) {
      setError("收件人邮箱不能为空");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const toEmails = formData.to.split(",").map((e) => e.trim());
    for (const email of toEmails) {
      if (!emailRegex.test(email)) {
        setError(`收件人邮箱格式不正确: ${email}`);
        return false;
      }
    }
    if (!formData.subject.trim()) {
      setError("邮件主题不能为空");
      return false;
    }
    if (contentMode === "text" && !formData.text.trim()) {
      setError("邮件内容不能为空");
      return false;
    }
    if (contentMode === "html" && !formData.html.trim()) {
      setError("邮件内容不能为空");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) {
      return;
    }

    if (!apiKey) {
      setError("请先输入 API 密钥");
      return;
    }

    setIsLoading(true);

    try {
      const toEmails = formData.to.split(",").map((e) => e.trim());

      const response = await fetch("/api/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: formData.from,
          to: toEmails.length === 1 ? toEmails[0] : toEmails,
          subject: formData.subject.trim(),
          text: contentMode === "text" ? formData.text.trim() : undefined,
          html: contentMode === "html" ? formData.html.trim() : undefined,
          cc: formData.cc.trim() || undefined,
          bcc: formData.bcc.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "发送失败");
        setIsLoading(false);
        return;
      }

      setSuccess(`邮件发送成功！Message ID: ${data.messageId}`);
      setFormData(initialFormData);
      onSuccess();
    } catch (err) {
      setError("网络错误，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  if (emailAccounts.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
        您还没有绑定任何邮箱账户，请先前往{" "}
        <a href="/email-accounts" className="text-blue-600 hover:underline">
          邮箱账户管理
        </a>{" "}
        添加邮箱。
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
          {success}
        </div>
      )}

      <div>
        <label className="block text-gray-700 text-sm font-medium mb-2">
          发件人邮箱 <span className="text-red-500">*</span>
        </label>
        <select
          name="from"
          value={formData.from}
          onChange={handleChange}
          disabled={isLoading}
          className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">请选择发件人邮箱</option>
          {emailAccounts.map((account) => (
            <option key={account.id} value={account.fromEmail}>
              {account.fromName ? `${account.fromName} <${account.fromEmail}>` : account.fromEmail}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-gray-700 text-sm font-medium mb-2">
          收件人邮箱 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="to"
          value={formData.to}
          onChange={handleChange}
          disabled={isLoading}
          placeholder="多个收件人用逗号分隔"
          className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">抄送</label>
          <input
            type="text"
            name="cc"
            value={formData.cc}
            onChange={handleChange}
            disabled={isLoading}
            placeholder="多个抄送用逗号分隔"
            className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">密送</label>
          <input
            type="text"
            name="bcc"
            value={formData.bcc}
            onChange={handleChange}
            disabled={isLoading}
            placeholder="多个密送用逗号分隔"
            className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-gray-700 text-sm font-medium mb-2">
          邮件主题 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          disabled={isLoading}
          placeholder="请输入邮件主题"
          className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-gray-700 text-sm font-medium">
            邮件内容 <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                checked={contentMode === "text"}
                onChange={() => setContentMode("text")}
                className="form-radio text-blue-600"
              />
              <span className="ml-2 text-sm text-gray-600">纯文本</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                checked={contentMode === "html"}
                onChange={() => setContentMode("html")}
                className="form-radio text-blue-600"
              />
              <span className="ml-2 text-sm text-gray-600">HTML</span>
            </label>
          </div>
        </div>

        {contentMode === "text" ? (
          <textarea
            name="text"
            value={formData.text}
            onChange={handleChange}
            disabled={isLoading}
            rows={8}
            placeholder="请输入邮件内容..."
            className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        ) : (
          <textarea
            name="html"
            value={formData.html}
            onChange={handleChange}
            disabled={isLoading}
            rows={12}
            placeholder="请输入 HTML 格式的邮件内容..."
            className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          />
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? "发送中..." : "发送邮件"}
        </button>
      </div>
    </form>
  );
}
