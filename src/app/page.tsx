import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-20">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-6 shadow-lg shadow-blue-500/30">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight">
            邮件聚合服务
          </h1>
          <p className="text-xl text-blue-200 mb-8 max-w-2xl mx-auto">
            统一管理多个邮箱账户，通过 HTTP API 或 SMTP 协议安全发送邮件
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/login"
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 cursor-pointer"
            >
              开始使用
            </Link>
            <Link
              href="/register"
              className="px-8 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-all border border-white/20 cursor-pointer"
            >
              注册账户
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-20">
          <div className="group bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-blue-400/50 hover:bg-white/10 transition-all cursor-pointer">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-400/20 group-hover:shadow-blue-400/40 transition-all">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              多邮箱管理
            </h3>
            <p className="text-blue-200 text-sm">
              绑定多个 SMTP 邮箱账户，统一管理所有发件配置，支持批量验证
            </p>
          </div>

          <div className="group bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-green-400/50 hover:bg-white/10 transition-all cursor-pointer">
            <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-green-400/20 group-hover:shadow-green-400/40 transition-all">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              API 密钥管理
            </h3>
            <p className="text-blue-200 text-sm">
              创建多个 API 密钥，灵活配置权限范围，支持全部或指定邮箱
            </p>
          </div>

          <div className="group bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-purple-400/50 hover:bg-white/10 transition-all cursor-pointer">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-violet-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-purple-400/20 group-hover:shadow-purple-400/40 transition-all">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              HTTP API 发送
            </h3>
            <p className="text-blue-200 text-sm">
              简单的 POST 请求发送邮件，支持 HTML、附件、抄送、密送
            </p>
          </div>

          <div className="group bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-orange-400/50 hover:bg-white/10 transition-all cursor-pointer">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-amber-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-orange-400/20 group-hover:shadow-orange-400/40 transition-all">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              SMTP 协议支持
            </h3>
            <p className="text-blue-200 text-sm">
              标准 SMTP 协议接入，兼容现有邮件客户端和应用程序
            </p>
          </div>

          <div className="group bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-cyan-400/50 hover:bg-white/10 transition-all cursor-pointer">
            <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-teal-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-cyan-400/20 group-hover:shadow-cyan-400/40 transition-all">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              代理发送支持
            </h3>
            <p className="text-blue-200 text-sm">
              配置 HTTP/SOCKS5 代理，解决外网发送受限问题，支持连通性测试
            </p>
          </div>

          <div className="group bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-rose-400/50 hover:bg-white/10 transition-all cursor-pointer">
            <div className="w-14 h-14 bg-gradient-to-br from-rose-400 to-pink-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-rose-400/20 group-hover:shadow-rose-400/40 transition-all">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              安全加密存储
            </h3>
            <p className="text-blue-200 text-sm">
              SMTP 密码 AES-256 加密存储，JWT 令牌认证，密码复杂度验证
            </p>
          </div>

          <div className="group bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-yellow-400/50 hover:bg-white/10 transition-all cursor-pointer">
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-yellow-400/20 group-hover:shadow-yellow-400/40 transition-all">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              用户等级系统
            </h3>
            <p className="text-blue-200 text-sm">
              灵活的等级管理，自定义邮箱数量配额，支持管理员后台管理
            </p>
          </div>

          <div className="group bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-indigo-400/50 hover:bg-white/10 transition-all cursor-pointer">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-400/20 group-hover:shadow-indigo-400/40 transition-all">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              发送日志记录
            </h3>
            <p className="text-blue-200 text-sm">
              完整的邮件发送日志，记录发送状态、时间、收件人等信息
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto mb-20">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-8 text-center">
              快速开始
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-3 shadow-lg shadow-blue-500/20">
                  <span className="text-white font-bold">1</span>
                </div>
                <h4 className="font-semibold text-white mb-1">注册账户</h4>
                <p className="text-blue-200 text-sm">邮箱验证码验证</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-3 shadow-lg shadow-green-500/20">
                  <span className="text-white font-bold">2</span>
                </div>
                <h4 className="font-semibold text-white mb-1">绑定邮箱</h4>
                <p className="text-blue-200 text-sm">添加 SMTP 配置</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full mb-3 shadow-lg shadow-purple-500/20">
                  <span className="text-white font-bold">3</span>
                </div>
                <h4 className="font-semibold text-white mb-1">创建密钥</h4>
                <p className="text-blue-200 text-sm">生成 API 密钥</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full mb-3 shadow-lg shadow-orange-500/20">
                  <span className="text-white font-bold">4</span>
                </div>
                <h4 className="font-semibold text-white mb-1">发送邮件</h4>
                <p className="text-blue-200 text-sm">调用 API 发送</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto mb-20">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              技术特性
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 bg-white/5 rounded-xl p-4">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-blue-100">Next.js 16 + TypeScript</span>
              </div>
              <div className="flex items-center gap-3 bg-white/5 rounded-xl p-4">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-blue-100">Prisma ORM</span>
              </div>
              <div className="flex items-center gap-3 bg-white/5 rounded-xl p-4">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-blue-100">JWT + bcryptjs 认证</span>
              </div>
              <div className="flex items-center gap-3 bg-white/5 rounded-xl p-4">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-blue-100">Nodemailer 邮件发送</span>
              </div>
              <div className="flex items-center gap-3 bg-white/5 rounded-xl p-4">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-blue-100">SMTP 服务器 (2525端口)</span>
              </div>
              <div className="flex items-center gap-3 bg-white/5 rounded-xl p-4">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-blue-100">多数据库支持</span>
              </div>
              <div className="flex items-center gap-3 bg-white/5 rounded-xl p-4">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-blue-100">Docker 部署支持</span>
              </div>
              <div className="flex items-center gap-3 bg-white/5 rounded-xl p-4">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-blue-100">代理支持 (HTTP/SOCKS5)</span>
              </div>
              <div className="flex items-center gap-3 bg-white/5 rounded-xl p-4">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-blue-100">TLS/STARTTLS 加密</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-blue-300">
            查看 
            <Link target="_blank" href="https://github.com/moyefu/aggregationEmail/blob/main/docs/API.md" className="text-white hover:text-blue-100 underline transition-colors cursor-pointer">
              API 文档
            </Link>
            、
            <Link target="_blank" href="https://github.com/moyefu/aggregationEmail/blob/main/docs/USER_GUIDE.md" className="text-white hover:text-blue-100 underline transition-colors cursor-pointer">
              使用指南
            </Link>
            了解更多详情
          </p>
        </div>
      </div>
    </div>
  );
}