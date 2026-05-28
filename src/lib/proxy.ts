import { SocksProxyAgent } from "socks-proxy-agent";
import { HttpsProxyAgent } from "https-proxy-agent";
import https from "https";
import http from "http";

export interface ProxyConfig {
  host: string;
  port: number;
  username?: string | null;
  password?: string | null;
  protocol: string;
}

export interface ProxyTestResult {
  success: boolean;
  error?: string;
  latency?: number;
}

export function createProxyAgent(proxy: ProxyConfig) {
  const auth = proxy.username && proxy.password
    ? `${proxy.username}:${proxy.password}@`
    : "";

  const proxyUrl = proxy.protocol.toUpperCase() === "SOCKS5"
    ? `socks5://${auth}${proxy.host}:${proxy.port}`
    : `http://${auth}${proxy.host}:${proxy.port}`;

  if (proxy.protocol.toUpperCase() === "SOCKS5") {
    return new SocksProxyAgent(proxyUrl);
  } else {
    return new HttpsProxyAgent(proxyUrl);
  }
}

export async function testProxyConnection(proxy: ProxyConfig): Promise<ProxyTestResult> {
  const startTime = Date.now();

  try {
    const agent = createProxyAgent(proxy);
    const testUrl = "https://www.google.com";
    const timeout = 10000;

    return new Promise((resolve) => {
      const request = https.request(testUrl, {
        method: "GET",
        agent: agent,
        timeout: timeout,
      }, (response) => {
        const latency = Date.now() - startTime;

        if (response.statusCode === 200 || response.statusCode === 301 || response.statusCode === 302) {
          resolve({
            success: true,
            latency,
          });
        } else {
          resolve({
            success: false,
            error: `代理返回状态码: ${response.statusCode}`,
            latency,
          });
        }

        response.resume();
      });

      request.on("error", (error) => {
        const latency = Date.now() - startTime;

        if (error.message.includes("ETIMEDOUT") || error.message.includes("timeout")) {
          resolve({
            success: false,
            error: "连接超时",
            latency,
          });
        } else if (error.message.includes("ECONNREFUSED")) {
          resolve({
            success: false,
            error: "无法连接到代理服务器",
            latency,
          });
        } else if (error.message.includes("authentication") || error.message.includes("auth")) {
          resolve({
            success: false,
            error: "代理认证失败",
            latency,
          });
        } else {
          resolve({
            success: false,
            error: error.message,
            latency,
          });
        }
      });

      request.on("timeout", () => {
        const latency = Date.now() - startTime;
        request.destroy();
        resolve({
          success: false,
          error: "连接超时",
          latency,
        });
      });

      request.end();
    });
  } catch (error) {
    const latency = Date.now() - startTime;

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
        latency,
      };
    }

    return {
      success: false,
      error: "未知错误",
      latency,
    };
  }
}