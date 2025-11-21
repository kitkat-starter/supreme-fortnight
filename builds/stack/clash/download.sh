#!/bin/bash
set -ex

REPO="MetaCubeX/mihomo"
API_URL="https://api.github.com/repos/$REPO/releases/latest"

ARCH=$(uname -m)
echo "检测到架构: $ARCH"

get_download_url() {
    local keyword=$1
    # 获取下载链接，排除校验文件
    # 过滤掉包含 "-go" 的特定版本（如 go120），只保留默认版本（通常为最新 Go 编译）
    # 强制匹配 .gz 后缀，避免匹配到 .deb 或 .rpm
    curl -s "$API_URL" \
        | grep "browser_download_url" \
        | grep "$keyword" \
        | grep -v "sha256" \
        | grep -v "md5" \
        | grep -v "\-go" \
        | grep "\.gz" \
        | cut -d '"' -f 4 \
        | head -n 1
}

download_and_extract() {
    local keyword=$1
    local output_name=$2
    echo "正在搜索包含关键字的资源: $keyword"
    local url=$(get_download_url "$keyword")
    
    if [ -n "$url" ]; then
        echo "找到下载地址: $url"
        echo "正在下载..."
        wget -q --show-progress "$url"
        
        local filename=$(basename "$url")
        echo "正在解压 $filename ..."
        
        if [[ "$filename" == *.tar.gz ]]; then
            tar -xzf "$filename"
            # 对于 tar.gz，通常需要找到解压后的文件并重命名
            # 这里假设解压后只有一个文件或我们需要的文件名包含 mihomo
            # 简单起见，如果用户需要 tar.gz 支持，可能需要更复杂的逻辑
            # 目前 mihomo linux release 主要是 .gz
            echo "警告: tar.gz 解压后重命名逻辑未完全实现，请检查文件"
        elif [[ "$filename" == *.gz ]]; then
            gzip -d "$filename"
            # .gz 解压后文件名是去掉 .gz 的部分
            local extracted_file="${filename%.gz}"
            echo "重命名 $extracted_file -> $output_name"
            mv "$extracted_file" "$output_name"
            chmod +x "$output_name"
        elif [[ "$filename" == *.zip ]]; then
            if command -v unzip >/dev/null 2>&1; then
                unzip -o "$filename"
                echo "警告: zip 解压后重命名逻辑未完全实现，请检查文件"
            else
                echo "警告: 未找到 unzip 命令，跳过解压 .zip 文件"
            fi
        fi
        
        echo "处理完成: $output_name"
    else
        echo "错误：未找到匹配 '$keyword' 的资源"
        return 1
    fi
}

case "$ARCH" in
    aarch64)
        echo "架构为 aarch64。正在下载 arm64 版本..."
        download_and_extract "linux-arm64" "mihomo-arm64"
        ;;
    x86_64)
        echo "架构为 x86_64。正在下载 v3 和 v2 版本..."
        download_and_extract "linux-amd64-v3" "mihomo-amd64-v3"
        download_and_extract "linux-amd64-v2" "mihomo-amd64-v2"
        ;;
    *)
        echo "不支持的架构: $ARCH"
        exit 1
        ;;
esac

# Download yq
echo "正在下载 yq..."
case "$ARCH" in
    x86_64) YQ_ARCH="amd64" ;;
    aarch64) YQ_ARCH="arm64" ;;
    arm64) YQ_ARCH="arm64" ;;
    *) echo "Unsupported architecture for yq: $ARCH"; exit 1 ;;
esac
echo "检测到架构: $ARCH, 下载 yq for linux_${YQ_ARCH}"
curl -s https://api.github.com/repos/mikefarah/yq/releases/latest \
    | grep browser_download_url \
    | grep "linux_${YQ_ARCH}" \
    | grep -v .tar.gz \
    | cut -d '"' -f 4 \
    | wget -O yq -i -
chmod +x yq
echo "yq 下载完成"

# Download metacubexd
echo "正在下载 metacubexd..."
TAG=$(curl -s https://api.github.com/repos/MetaCubeX/metacubexd/releases/latest | grep '"tag_name"' | cut -d '"' -f 4)
wget -q --show-progress "https://github.com/MetaCubeX/metacubexd/releases/download/${TAG}/compressed-dist.tgz"
mkdir -p /yacd
tar -xzf compressed-dist.tgz -C /yacd
echo "metacubexd 下载并解压完成"

# 下载 geoip
git clone https://github.com/v2fly/geoip
cd geoip
CGO_ENABLED=0 go build -o geoip
