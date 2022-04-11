#!/bin/sh -ex
set -ex
export DEBIAN_FRONTEND=noninteractive
if [ "${USE_MIRROR}" = "true" ]; then
    echo "DEBUG_BUILD 处于调试模式,会换镜像源"
    # debian
    sed -i 's/deb.debian.org/mirrors.sustech.edu.cn/g' /etc/apt/sources.list
    sed -i 's|security.debian.org/debian-security|mirrors.sustech.edu.cn/debian-security|g' /etc/apt/sources.list
    apt update && apt install -y ca-certificates
    sed -i 's/http:/https:/g' /etc/apt/sources.list
fi
# 如果没有修改镜像源也TM给我装这个
apt update && apt install -y ca-certificates

# 准备工具
apt install -y \
    git \
    curl \
    wget \
    build-essential \
    libssl-dev \
    ninja-build \
    cmake
# 准备必须得依赖
apt install -y \
    libtorrent-rasterbar-dev \
    libboost-all-dev \
    qtbase5-dev

if [ "${USE_MIRROR}" = "true" ]; then
    git clone https://hub.fastgit.xyz/c0re100/qBittorrent-Enhanced-Edition
else
    git clone https://github.com/c0re100/qBittorrent-Enhanced-Edition
fi

cd qBittorrent-Enhanced-Edition
rm -fr build/CMakeCache.txt
cmake \
    -B build \
    -G "Ninja" \
    -DGUI=off \
    -DSTACKTRACE=off \
    -DBUILD_SHARED_LIBS=off \
    -DCMAKE_EXE_LINKER_FLAGS="-static"
cmake --build build
cmake --install build