import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth";
import { testProxyConnection, ProxyConfig } from "@/lib/proxy";

async function POST(request: NextRequest) {
  try {
    const user = (request as NextRequest & { user: { id: string } }).user;
    const body = await request.json();
    const { host, port, username, password, protocol } = body;

    if (!host || !port) {
      return NextResponse.json(
        { error: "缺少必填字段：主机、端口" },
        { status: 400 }
      );
    }

    const portNum = parseInt(port, 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      return NextResponse.json(
        { error: "端口号必须是 1-65535 之间的有效数字" },
        { status: 400 }
      );
    }

    const proxyConfig: ProxyConfig = {
      host,
      port: portNum,
      username: username || null,
      password: password || null,
      protocol: protocol?.toUpperCase() || "HTTP",
    };

    const result = await testProxyConnection(proxyConfig);

    return NextResponse.json(result);
  } catch (error) {
    console.error("测试代理错误:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

export const POST_handler = withAuth(POST);
export { POST_handler as POST };