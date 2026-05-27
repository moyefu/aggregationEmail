/**
 * 统一页脚组件
 *
 * 显示在所有页面底部的页脚，包含版权信息和备案信息。
 */
export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-gray-500">
          <div className="mb-2 sm:mb-0">
            <span>© {currentYear} 邮件聚合服务</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Powered by Next.js</span>
            <span>|</span>
            <span>Prisma ORM</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
