#!/bin/sh
echo "接下来构建 aria2 本体!"
C_COMPILER="gcc"
CXX_COMPILER="g++"
# 下载 aria2 
ARIA2_VER=1.36.0
git clone https://github.com/aria2/aria2/
cd aria2
git checkout release-$ARIA2_VER
# 打补丁
ls /context/patch
git apply /context/patch/*

# wget https://github.com/aria2/aria2/archive/refs/tags/release-${ARIA2_VER}.zip

# 构建 aria2
PREFIX=/usr/local
C_COMPILER="gcc"
CXX_COMPILER="g++"


PKG_CONFIG_PATH=/opt/aria2/build_libs/lib/pkgconfig/ \
LD_LIBRARY_PATH=/opt/aria2/build_libs/lib/ \
CC="$C_COMPILER" \
CXX="$CXX_COMPILER" \
autoconf
./configure \
    --prefix=$PREFIX \
    --without-libxml2 \
    --without-libgcrypt \
    --with-openssl \
    --without-libnettle \
    --without-gnutls \
    --without-libgmp \
    --with-libssh2 \
    --with-sqlite3 \
    --with-ca-bundle='/etc/ssl/certs/ca-certificates.crt' \
    ARIA2_STATIC=yes \
    --enable-shared=no

make -j$(nproc)
make install
# 检查是否是静态的
ldd /usr/local/bin/aria2c