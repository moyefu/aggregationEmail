#!/bin/bash

CERT_DIR="./certs"
CERT_FILE="$CERT_DIR/server.crt"
KEY_FILE="$CERT_DIR/server.key"

mkdir -p "$CERT_DIR"

echo "===================================="
echo "  生成自签名 TLS 证书"
echo "===================================="
echo ""

if command -v openssl &> /dev/null; then
    echo "使用 OpenSSL 生成证书..."
    
    openssl req -x509 -newkey rsa:4096 -keyout "$KEY_FILE" -out "$CERT_FILE" \
        -days 365 -nodes \
        -subj "/C=CN/ST=Beijing/L=Beijing/O=Development/CN=localhost" \
        -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "证书生成成功!"
        echo "  证书文件: $CERT_FILE"
        echo "  密钥文件: $KEY_FILE"
        echo ""
        echo "请将以下配置添加到 .env 文件:"
        echo "  TLS_CERT_PATH=$CERT_FILE"
        echo "  TLS_KEY_PATH=$KEY_FILE"
    else
        echo "证书生成失败!"
        exit 1
    fi
else
    echo "错误: 未找到 OpenSSL，请先安装 OpenSSL"
    echo ""
    echo "在 Ubuntu/Debian 上安装:"
    echo "  sudo apt-get install openssl"
    echo ""
    echo "在 macOS 上安装:"
    echo "  brew install openssl"
    echo ""
    echo "在 Windows 上，可以使用 Git Bash 或 WSL 运行此脚本"
    exit 1
fi
