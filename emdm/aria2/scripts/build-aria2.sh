#!/bin/bash -ex
set -ex
echo "接下来构建 aria2 本体!"

if [ "${DEBUG_BUILD}" = "true" ]; then
    git config --global https.proxy ${PROXY_STAGING}
    sed -i 's/deb.debian.org/mirrors.sustech.edu.cn/g' /etc/apt/sources.list
    sed -i 's|security.debian.org/debian-security|mirrors.sustech.edu.cn/debian-security|g' /etc/apt/sources.list
    # sed -i 's/http:/https:/g' /etc/apt/sources.list

fi
git config --global http.sslVerify false
apt update && apt install -y ca-certificates
sed -i 's/http:/https:/g' /etc/apt/sources.list
# 下载源码与打补丁
ARIA2_VER=1.36.0
# wget https://github.com/aria2/aria2/archive/refs/tags/release-${ARIA2_VER}.zip
git clone https://github.com/aria2/aria2/
cd aria2
git checkout release-$ARIA2_VER
ls /context/patch
git apply /context/patch/*


# 构建 aria2
PREFIX=/usr/local
C_COMPILER="gcc"
CXX_COMPILER="g++"
PKG_CONFIG_PATH=/opt/aria2/build_libs/lib/pkgconfig/
LD_LIBRARY_PATH=/opt/aria2/build_libs/lib/
CC="$C_COMPILER" \
CXX="$CXX_COMPILER" \

autoreconf --install
./configure \
    --prefix=$PREFIX \
    --with-libz \
    --with-libcares \
    --with-libexpat \
    --without-libxml2 \
    --without-libgcrypt \
    --with-openssl \
    --without-libnettle \
    --without-gnutls \
    --without-libgmp \
    --with-libssh2 \
    --with-sqlite3 \
    --without-jemalloc \
    --with-ca-bundle='/etc/ssl/certs/ca-certificates.crt' \
    ARIA2_STATIC=yes \
    --disable-shared

make -j$(nproc)
make install
# 检查是否是静态的
ldd /usr/local/bin/aria2c