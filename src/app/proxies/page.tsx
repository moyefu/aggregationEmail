"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import UserMenu from "@/components/layout/UserMenu";

interface Proxy {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string | null;
  protocol: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProxyTestResult {
  success: boolean;
  latency?: number;
  error?: string;
}

interface ProxyFormData {
  name: string;
  host: string;
  port: string;
  username: string;
  password: string;
  protocol: string;
}

const initialFormData: ProxyFormData = {
  name: "",
  host: "",
  port: "1080",
  username: "",
  password: "",
  protocol: "HTTP",
};

export default function ProxiesPage() {
  const router = useRouter();
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email: string; name?: string | null } | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProxy, setEditingProxy] = useState<Proxy | null>(null);
  const [formData, setFormData] = useState<ProxyFormData>(initialFormData);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formTestResult, setFormTestResult] = useState<ProxyTestResult | null>(null);
  const [testingProxies, setTestingProxies] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, ProxyTestResult>>({});
  const [testingAll, setTestingAll] = useState(false);
  const [allTestSummary, setAllTestSummary] = useState<{ total: number; success: number; failed: number } | null>(null);

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

    fetchProxies();
  }, [router]);

  const fetchProxies = async (page = 1) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(`/api/proxies?page=${page}&limit=${pagination.limit}`, {
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
        setProxies(data.proxies || []);
        setPagination(data.pagination);
        setTestResults({});
        setAllTestSummary(null);
      } else {
        console.error("获取代理列表失败:", data.error);
      }
    } catch (error) {
      console.error("获取代理列表错误:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除此代理吗？删除后，使用此代理的邮箱账户将不再使用代理发送邮件。")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(`/api/proxies/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        fetchProxies(pagination.page);
      } else {
        alert(data.error || "删除失败");
      }
    } catch (error) {
      console.error("删除代理错误:", error);
      alert("删除失败，请稍后重试");
    }
  };

  const handleTestProxy = async (proxy: Proxy) => {
    setTestingProxies((prev) => ({ ...prev, [proxy.id]: true }));
    setTestResults((prev) => {
      const newResults = { ...prev };
      delete newResults[proxy.id];
      return newResults;
    });

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(`/api/proxies/${proxy.id}/test`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setTestResults((prev) => ({
          ...prev,
          [proxy.id]: {
            success: data.success,
            latency: data.latency,
            error: data.error,
          },
        }));
      } else {
        setTestResults((prev) => ({
          ...prev,
          [proxy.id]: {
            success: false,
            error: data.error || "测试失败",
          },
        }));
      }
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        [proxy.id]: {
          success: false,
          error: "网络错误",
        },
      }));
    } finally {
      setTestingProxies((prev) => {
        const newTesting = { ...prev };
        delete newTesting[proxy.id];
        return newTesting;
      });
    }
  };

  const handleTestAllProxies = async () => {
    if (proxies.length === 0) return;

    setTestingAll(true);
    setAllTestSummary(null);
    setTestResults({});

    const results: Record<string, ProxyTestResult> = {};
    let successCount = 0;
    let failedCount = 0;

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    for (const proxy of proxies) {
      setTestingProxies((prev) => ({ ...prev, [proxy.id]: true }));

      try {
        const response = await fetch(`/api/proxies/${proxy.id}/test`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.ok) {
          results[proxy.id] = {
            success: data.success,
            latency: data.latency,
            error: data.error,
          };
          if (data.success) {
            successCount++;
          } else {
            failedCount++;
          }
        } else {
          results[proxy.id] = {
            success: false,
            error: data.error || "测试失败",
          };
          failedCount++;
        }
      } catch (error) {
        results[proxy.id] = {
          success: false,
          error: "网络错误",
        };
        failedCount++;
      }

      setTestingProxies((prev) => {
        const newTesting = { ...prev };
        delete newTesting[proxy.id];
        return newTesting;
      });
      setTestResults((prev) => ({ ...prev, [proxy.id]: results[proxy.id] }));
    }

    setAllTestSummary({
      total: proxies.length,
      success: successCount,
      failed: failedCount,
    });
    setTestingAll(false);
  };

  const handleTestFormProxy = async () => {
    if (!formData.host || !formData.port) {
      setFormError("请填写主机和端口");
      return;
    }

    setFormLoading(true);
    setFormTestResult(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/proxies/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          host: formData.host.trim(),
          port: parseInt(formData.port, 10),
          username: formData.username.trim() || null,
          password: formData.password || null,
          protocol: formData.protocol,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setFormTestResult({
          success: data.success,
          latency: data.latency,
          error: data.error,
        });
      } else {
        setFormTestResult({
          success: false,
          error: data.error || "测试失败",
        });
      }
    } catch (error) {
      setFormTestResult({
        success: false,
        error: "网络错误",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name.trim()) {
      setFormError("代理名称不能为空");
      return;
    }

    if (!formData.host.trim()) {
      setFormError("主机地址不能为空");
      return;
    }

    const port = parseInt(formData.port, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      setFormError("端口号必须是 1-65535 之间的有效数字");
      return;
    }

    setFormLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const url = editingProxy ? `/api/proxies/${editingProxy.id}` : "/api/proxies";
      const method = editingProxy ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          host: formData.host.trim(),
          port,
          username: formData.username.trim() || null,
          password: formData.password || null,
          protocol: formData.protocol,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFormError(data.error || "操作失败");
        setFormLoading(false);
        return;
      }

      setShowAddForm(false);
      setEditingProxy(null);
      setFormData(initialFormData);
      fetchProxies(1);
    } catch (error) {
      setFormError("网络错误，请稍后重试");
      setFormLoading(false);
    }
  };

  const handleEditClick = (proxy: Proxy) => {
    setEditingProxy(proxy);
    setFormData({
      name: proxy.name,
      host: proxy.host,
      port: proxy.port.toString(),
      username: proxy.username || "",
      password: "",
      protocol: proxy.protocol,
    });
    setShowAddForm(true);
    setFormTestResult(null);
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingProxy(null);
    setFormData(initialFormData);
    setFormError("");
    setFormTestResult(null);
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
            <h1 className="text-2xl font-bold text-gray-900">代理管理</h1>
            <div className="flex gap-3">
              {proxies.length > 0 && (
                <button
                  onClick={handleTestAllProxies}
                  disabled={testingAll}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {testingAll ? (
                    <>
                      <svg className="mr-2 -ml-1 h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      测试中...
                    </>
                  ) : (
                    <>
                      <svg className="mr-2 -ml-1 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      全部测试
                    </>
                  )}
                </button>
              )}
              <button
                onClick={() => {
                  setShowAddForm(!showAddForm);
                  if (!showAddForm) {
                    setEditingProxy(null);
                    setFormData(initialFormData);
                    setFormTestResult(null);
                  }
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
              >
                {showAddForm ? (
                  <>
                    <svg className="mr-2 -ml-1 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    取消
                  </>
                ) : (
                  <>
                    <svg className="mr-2 -ml-1 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    添加代理
                  </>
                )}
              </button>
            </div>
          </div>

          {allTestSummary && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                全部测试完成：共 {allTestSummary.total} 个代理，成功 {allTestSummary.success} 个，失败 {allTestSummary.failed} 个
              </p>
            </div>
          )}

          {showAddForm && (
            <div className="mb-6 bg-white shadow-md rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingProxy ? "编辑代理" : "添加代理"}
              </h3>

              {formError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      代理名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="例如: 香港代理"
                      className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={formLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      协议类型
                    </label>
                    <select
                      value={formData.protocol}
                      onChange={(e) => setFormData({ ...formData, protocol: e.target.value })}
                      className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={formLoading}
                    >
                      <option value="HTTP">HTTP</option>
                      <option value="HTTPS">HTTPS</option>
                      <option value="SOCKS5">SOCKS5</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      主机地址 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.host}
                      onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                      placeholder="例如: 192.168.1.1 或 proxy.example.com"
                      className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={formLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      端口 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.port}
                      onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                      placeholder="例如: 1080"
                      className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={formLoading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      用户名（可选）
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="代理认证用户名"
                      className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={formLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      密码（可选）
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="代理认证密码"
                      className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={formLoading}
                    />
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">测试代理连通性</h4>
                  <button
                    type="button"
                    onClick={handleTestFormProxy}
                    disabled={formLoading || !formData.host || !formData.port}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {formLoading ? "测试中..." : "测试连接"}
                  </button>
                  {formTestResult && (
                    <div className={`mt-2 text-sm ${formTestResult.success ? "text-green-600" : "text-red-600"}`}>
                      {formTestResult.success
                        ? `连接成功，延迟: ${formTestResult.latency}ms`
                        : `连接失败: ${formTestResult.error}`}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCancelForm}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    disabled={formLoading}
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    disabled={formLoading}
                  >
                    {formLoading ? "处理中..." : editingProxy ? "保存修改" : "添加代理"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : proxies.length === 0 ? (
            <div className="bg-white shadow-md rounded-lg p-6 text-center">
              <p className="text-gray-500">暂无代理，点击上方按钮添加</p>
            </div>
          ) : (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      名称
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      地址
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      协议
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      测试结果
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      创建时间
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {proxies.map((proxy) => (
                    <tr key={proxy.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{proxy.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{proxy.host}:{proxy.port}</div>
                        {proxy.username && (
                          <div className="text-sm text-gray-500">用户: {proxy.username}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {proxy.protocol}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${proxy.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                          {proxy.isActive ? "启用" : "禁用"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {testingProxies[proxy.id] ? (
                          <div className="flex items-center text-sm text-gray-500">
                            <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            测试中...
                          </div>
                        ) : testResults[proxy.id] ? (
                          <div className={`text-sm ${testResults[proxy.id].success ? "text-green-600" : "text-red-600"}`}>
                            {testResults[proxy.id].success
                              ? `成功 (${testResults[proxy.id].latency}ms)`
                              : `失败: ${testResults[proxy.id].error}`}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">未测试</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(proxy.createdAt).toLocaleString("zh-CN")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleTestProxy(proxy)}
                          disabled={testingProxies[proxy.id] || testingAll}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50 cursor-pointer"
                        >
                          {testingProxies[proxy.id] ? "测试中..." : "测试"}
                        </button>
                        <button
                          onClick={() => handleEditClick(proxy)}
                          disabled={testingAll}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50 cursor-pointer"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(proxy.id)}
                          disabled={testingAll}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 cursor-pointer"
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => fetchProxies(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  上一页
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  第 {pagination.page} / {pagination.totalPages} 页
                </span>
                <button
                  onClick={() => fetchProxies(pagination.page + 1)}
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
    </div>
  );
}