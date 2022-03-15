#!/bin/sh
# 换个国内源

# 判断 DEBUG_BUILD 是否为 true
if [ "${DEBUG_BUILD}" = "true" ]; then
    echo "DEBUG_BUILD 处于调试模式,会换镜像源"
    sed -i 's/deb.debian.org/mirrors.sustech.edu.cn/g' /etc/apt/sources.list
    sed -i 's|security.debian.org/debian-security|mirrors.sustech.edu.cn/debian-security|g' /etc/apt/sources.list
    # sed -i 's/http:/https:/g' /etc/apt/sources.list
    apt update && apt install -y ca-certificates
    # curl -vvv https://mirrors.sustech.edu.cn/debian-security/dists/bullseye-security/InRelease
    sed -i 's/http:/https:/g' /etc/apt/sources.list
fi


# 记得 这里是非交互式
export DEBIAN_FRONTEND=noninteractive
# 对更新不启用镜像源
HTTPS_PROXY_STAGING=$https_proxy
unset https_proxy
apt update
apt install -y --no-install-recommends \
    make binutils autoconf automake autotools-dev libtool aria2 \
    pkg-config git curl dpkg-dev autopoint libcppunit-dev libxml2-dev \
    lzip

# 更新结束记得重新启用
export https_proxy=$HTTPS_PROXY_STAGING