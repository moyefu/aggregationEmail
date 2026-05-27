$ErrorActionPreference = "Stop"

$CERT_DIR = ".\certs"
$CERT_FILE = "$CERT_DIR\server.crt"
$KEY_FILE = "$CERT_DIR\server.key"

Write-Host "===================================="
Write-Host "  生成自签名 TLS 证书"
Write-Host "===================================="
Write-Host ""

if (-not (Test-Path $CERT_DIR)) {
    New-Item -ItemType Directory -Path $CERT_DIR | Out-Null
    Write-Host "创建证书目录: $CERT_DIR"
}

$openssl = Get-Command openssl -ErrorAction SilentlyContinue

if ($openssl) {
    Write-Host "使用 OpenSSL 生成证书..."
    
    $result = & openssl req -x509 -newkey rsa:4096 -keyout $KEY_FILE -out $CERT_FILE `
        -days 365 -nodes `
        -subj "/C=CN/ST=Beijing/L=Beijing/O=Development/CN=localhost" `
        -addext "subjectAltName=DNS:localhost,IP:127.0.0.1" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "证书生成成功!" -ForegroundColor Green
        Write-Host "  证书文件: $CERT_FILE"
        Write-Host "  密钥文件: $KEY_FILE"
        Write-Host ""
        Write-Host "请将以下配置添加到 .env 文件:"
        Write-Host "  TLS_CERT_PATH=$CERT_FILE"
        Write-Host "  TLS_KEY_PATH=$KEY_FILE"
    } else {
        Write-Host "证书生成失败!" -ForegroundColor Red
        Write-Host $result
        exit 1
    }
} else {
    Write-Host "警告: 未找到 OpenSSL，尝试使用 PowerShell 生成证书..." -ForegroundColor Yellow
    Write-Host ""
    
    try {
        $cert = New-SelfSignedCertificate `
            -DnsName "localhost" `
            -CertStoreLocation "Cert:\CurrentUser\My" `
            -FriendlyName "SMTP Server Development Certificate" `
            -NotAfter (Get-Date).AddYears(1) `
            -KeyUsage KeyEncipherment, DigitalSignature `
            -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.1")
        
        $certPath = "Cert:\CurrentUser\My\$($cert.Thumbprint)"
        
        $pemCert = [System.Convert]::ToBase64String($cert.RawData, [System.Base64FormattingOptions]::InsertLineBreaks)
        "-----BEGIN CERTIFICATE-----`n$pemCert`n-----END CERTIFICATE-----" | Out-File -FilePath $CERT_FILE -Encoding ASCII
        
        $rsa = [System.Security.Cryptography.X509Certificates.RSACertificateExtensions]::GetRSAPrivateKey($cert)
        $pemKey = [System.Convert]::ToBase64String($rsa.Key.Export([System.Security.Cryptography.CngKeyBlobFormat]::Pkcs8PrivateBlob), [System.Base64FormattingOptions]::InsertLineBreaks)
        "-----BEGIN PRIVATE KEY-----`n$pemKey`n-----END PRIVATE KEY-----" | Out-File -FilePath $KEY_FILE -Encoding ASCII
        
        Write-Host ""
        Write-Host "证书生成成功!" -ForegroundColor Green
        Write-Host "  证书文件: $CERT_FILE"
        Write-Host "  密钥文件: $KEY_FILE"
        Write-Host ""
        Write-Host "请将以下配置添加到 .env 文件:"
        Write-Host "  TLS_CERT_PATH=$CERT_FILE"
        Write-Host "  TLS_KEY_PATH=$KEY_FILE"
        
        Remove-Item -Path $certPath -Force
    } catch {
        Write-Host "证书生成失败!" -ForegroundColor Red
        Write-Host $_.Exception.Message
        Write-Host ""
        Write-Host "请安装 OpenSSL 或手动生成证书:"
        Write-Host "  1. 下载 OpenSSL for Windows: https://slproweb.com/products/Win32OpenSSL.html"
        Write-Host "  2. 或使用 Git Bash 运行 generate-cert.sh"
        exit 1
    }
}
