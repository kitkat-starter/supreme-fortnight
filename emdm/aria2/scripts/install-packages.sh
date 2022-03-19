#!/bin/bash -ex
set -ex

# 插入测试源
# echo "https://dl-cdn.alpinelinux.org/alpine/edge/testing" >> /etc/apk/repositories
# 判断 DEBUG_BUILD 是否为 true
if [ "${DEBUG_BUILD}" = "true" ]; then
    echo "DEBUG_BUILD 处于调试模式,会换镜像源"
    # debian
    # sed -i 's/deb.debian.org/mirrors.sustech.edu.cn/g' /etc/apt/sources.list
    # sed -i 's|security.debian.org/debian-security|mirrors.sustech.edu.cn/debian-security|g' /etc/apt/sources.list
    # apt update && apt install -y ca-certificates
    # sed -i 's/http:/https:/g' /etc/apt/sources.list
    # alpine
    sed -i 's/dl-cdn.alpinelinux.org/mirrors.sustech.edu.cn/g' /etc/apk/repositories
fi


# 记得 这里是非交互式
# export DEBIAN_FRONTEND=noninteractive
# apt update
# apt install -y --no-install-recommends \
#     make binutils autoconf automake autotools-dev libtool aria2 ca-certificates \
#     pkg-config git curl dpkg-dev gcc g++ autopoint \
#     libsqlite3-dev libcppunit-dev libxml2-dev zlib1g-dev \
#     lzip

# alpine
apk update
apk add bash
apk add \
    wget \
    curl \
    make \
    binutils \
    autoconf \
    automake \
    libtool \
    aria2 \
    ca-certificates \
    pkgconf \
    git \
    gcc \
    g++ \
    libxml2-dev \
    gettext \
    gettext-dev \
    gettext-static \
    linux-headers
