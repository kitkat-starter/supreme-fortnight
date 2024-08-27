#!/bin/bash -ex
set -ex
echo "接下来构建 aria2 本体!"


git clone --depth=1 https://github.com/chisaato/aria2/
cd aria2
ls /context/patch
git apply /context/patch/*

# 构建 aria2
LIBS_PREFIX=/opt/aria2-build-libs
PREFIX=/usr/local
C_COMPILER="gcc"
CXX_COMPILER="g++"
export PKG_CONFIG_PATH="$LIBS_PREFIX/lib/pkgconfig"
export LD_LIBRARY_PATH="$LIBS_PREFIX/lib"
export CC="$C_COMPILER"
export CXX="$CXX_COMPILER"

# 检查一下依赖库
ls -l ${PKG_CONFIG_PATH}
ls -l ${LD_LIBRARY_PATH}

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
    --enable-peer-blacklist \
    --with-jemalloc \
    --with-ca-bundle='/etc/ssl/certs/ca-certificates.crt' \
    ARIA2_STATIC=yes \
    --disable-shared

make -j$(nproc)
make install
# 检查是否是静态的
# ldd /usr/local/bin/aria2c
# 去掉符号
# strip /usr/local/bin/aria2c