"use client";

import { useState, useRef, FormEvent } from "react";

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

interface FormFields {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  cc: string;
  bcc: string;
}

const initialFormFields: FormFields = {
  from: "",
  to: "",
  subject: "",
  text: "",
  html: "",
  cc: "",
  bcc: "",
};

export default function SendTestForm({ emailAccounts, apiKey, onSuccess }: SendTestFormProps) {
  const [fields, setFields] = useState<FormFields>(initialFormFields);
  const [contentMode, setContentMode] = useState<"text" | "html">("text");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
      setError("");
      setSuccess("");
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    if (!fields.from) {
      setError("请选择发件人邮箱");
      return false;
    }
    if (!fields.to.trim()) {
      setError("收件人邮箱不能为空");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const toEmails = fields.to.split(",").map((e) => e.trim());
    for (const email of toEmails) {
      if (!emailRegex.test(email)) {
        setError(`收件人邮箱格式不正确: ${email}`);
        return false;
      }
    }
    if (!fields.subject.trim()) {
      setError("邮件主题不能为空");
      return false;
    }
    if (contentMode === "text" && !fields.text.trim() && files.length === 0) {
      setError("邮件内容或附件不能同时为空");
      return false;
    }
    if (contentMode === "html" && !fields.html.trim() && files.length === 0) {
      setError("邮件内容或附件不能同时为空");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) return;

    if (!apiKey) {
      setError("请先输入 API 密钥");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("from", fields.from);
      formData.append("to", fields.to.trim());
      formData.append("subject", fields.subject.trim());

      if (contentMode === "text" && fields.text.trim()) {
        formData.append("text", fields.text.trim());
      }
      if (contentMode === "html" && fields.html.trim()) {
        formData.append("html", fields.html.trim());
      }
      if (fields.cc.trim()) {
        formData.append("cc", fields.cc.trim());
      }
      if (fields.bcc.trim()) {
        formData.append("bcc", fields.bcc.trim());
      }

      for (const file of files) {
        formData.append("attachments", file);
      }

      const response = await fetch("/api/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "发送失败");
        setIsLoading(false);
        return;
      }

      setSuccess(`邮件发送成功！Message ID: ${data.messageId}`);
      setFields(initialFormFields);
      setFiles([]);
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

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-6">
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
          value={fields.from}
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
          value={fields.to}
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
            value={fields.cc}
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
            value={fields.bcc}
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
          value={fields.subject}
          onChange={handleChange}
          disabled={isLoading}
          placeholder="请输入邮件主题"
          className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-gray-700 text-sm font-medium">
            邮件内容
          </label>
          <div className="flex items-center space-x-4">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="radio"
                checked={contentMode === "text"}
                onChange={() => setContentMode("text")}
                className="form-radio text-blue-600"
              />
              <span className="ml-2 text-sm text-gray-600">纯文本</span>
            </label>
            <label className="inline-flex items-center cursor-pointer">
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
            value={fields.text}
            onChange={handleChange}
            disabled={isLoading}
            rows={8}
            placeholder="请输入邮件内容..."
            className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        ) : (
          <textarea
            name="html"
            value={fields.html}
            onChange={handleChange}
            disabled={isLoading}
            rows={12}
            placeholder="请输入 HTML 格式的邮件内容..."
            className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          />
        )}
      </div>

      <div>
        <label className="block text-gray-700 text-sm font-medium mb-2">
          附件
        </label>
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
        >
          <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
          </svg>
          <p className="mt-2 text-sm text-gray-600">
            点击或拖拽文件到此处上传
          </p>
          <p className="mt-1 text-xs text-gray-400">
            支持任意格式文件，可多选
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {files.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              已选择 {files.length} 个文件
            </p>
            <ul className="divide-y divide-gray-100 bg-gray-50 rounded-lg overflow-hidden">
              {files.map((file, index) => (
                <li key={`${file.name}-${index}`} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-100">
                  <div className="flex items-center min-w-0 flex-1">
                    <svg className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <span className="text-sm text-gray-700 truncate">{file.name}</span>
                    <span className="ml-2 text-xs text-gray-400 flex-shrink-0">{formatFileSize(file.size)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="ml-3 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                    title="移除文件"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
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
