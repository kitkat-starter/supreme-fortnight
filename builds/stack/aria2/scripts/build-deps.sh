#!/bin/bash -ex
set -ex

# 如果有,我当然是希望用 aria2 来下载
# aria2c --help > /dev/null
# if [ "$?" -eq 0 ] ; then
#   DOWNLOADER="aria2c --check-certificate=false -x 16"
# else
#   DOWNLOADER="wget -c"
# fi
DOWNLOADER="wget -c"

# 精心挑选的依赖
ZLIB=https://www.zlib.net/zlib-1.3.1.tar.gz
OPENSSL=https://www.openssl.org/source/openssl-1.1.1k.tar.gz
EXPAT=https://github.com/libexpat/libexpat/releases/download/R_2_5_0/expat-2.5.0.tar.bz2
SQLITE3=https://www.sqlite.org/2023/sqlite-autoconf-3430100.tar.gz
C_ARES=https://c-ares.org/download/c-ares-1.19.1.tar.gz
SSH2=https://libssh2.org/download/libssh2-1.11.0.tar.bz2
JEMALLOC='https://github.com/jemalloc/jemalloc/releases/download/5.2.1/jemalloc-5.2.1.tar.bz2'

## CONFIG ##
BUILD_DIRECTORY=/opt/build
PREFIX=/opt/aria2-build-libs
C_COMPILER="gcc"
CXX_COMPILER="g++"
export PKG_CONFIG_PATH="$PREFIX/lib/pkgconfig"
export LD_LIBRARY_PATH="$PREFIX/lib"
export CC="$C_COMPILER"
export CXX="$CXX_COMPILER"

## BUILD ##
mkdir -p ${BUILD_DIRECTORY} &&  cd ${BUILD_DIRECTORY}

function BUILD_ZLIB(){
  $DOWNLOADER $ZLIB -O zlib.tar.gz
  mkdir zlib-src
  tar zxvf zlib.tar.gz --strip-components=1 -C zlib-src
  cd zlib-src/
  ./configure \
    --prefix=$PREFIX \
    --static
  make -j$(nproc)
  make install
  cd ..
}

function BUILD_EXPAT(){
  $DOWNLOADER $EXPAT -O expat.tar.bz2
  mkdir expat-src
  tar jxvf expat.tar.bz2 --strip-components=1 -C expat-src
  cd expat-src/
  ./configure \
    --prefix=$PREFIX \
    --enable-static \
    --disable-shared \
    --without-examples \
    --without-tests \
    --without-docbook
  make -j$(nproc)
  make install
  cd ..
}

function BUILD_CARES() {
  $DOWNLOADER $C_ARES -O c-ares.tar.gz
  mkdir c-ares-src
  tar zxvf c-ares.tar.gz --strip-components=1 -C c-ares-src
  cd c-ares-src/
  ./configure \
    --prefix=$PREFIX \
    --enable-static \
    --disable-shared \
    --disable-tests
  make -j$(nproc)
  make install
  cd ..
}

function BUILD_OPENSSL() {
  $DOWNLOADER $OPENSSL -O openssl.tar.gz
  mkdir openssl-src
  tar zxvf openssl.tar.gz --strip-components=1 -C openssl-src
  cd openssl-src/
  ./Configure \
    --prefix=$PREFIX \
    linux-x86_64 \
    no-tests
  make -j$(nproc)
  make install_sw
  cd ..
}

function BUILD_SQLITE() {
  $DOWNLOADER $SQLITE3 -O sqlite.tar.gz
  mkdir sqlite-src
  tar zxvf sqlite.tar.gz --strip-components=1 -C sqlite-src
  cd sqlite-src/
  ./configure \
    --prefix=$PREFIX \
    --enable-static \
    --enable-shared \
    --disable-dynamic-extensions
  make -j$(nproc)
  make install
  cd ..
}

function BUILD_LIBSSH2(){
  $DOWNLOADER $SSH2 -O libssh2.tar.bz2
  mkdir libssh2-src
  tar jxvf libssh2.tar.bz2 --strip-components=1 -C libssh2-src
  cd libssh2-src/
  rm -rf $PREFIX/lib/pkgconfig/libssh2.pc
  ./configure \
    --prefix=$PREFIX \
    --without-libgcrypt \
    --with-openssl \
    --without-wincng \
    --disable-examples-build \
    --enable-static \
    --disable-shared
  make -j$(nproc)
  make install
  cd ..
}

BUILD_JEMALLOC() {
    # mkdir -p $BUILD_DIR/jemalloc && cd $BUILD_DIR/jemalloc
    # curl -Ls -o - "$JEMALLOC" | tar jxvf - --strip-components=1
    $DOWNLOADER $JEMALLOC -O jemalloc.tar.bz2
    mkdir jemalloc-src
    tar jxvf jemalloc.tar.bz2 --strip-components=1 -C jemalloc-src
    cd jemalloc-src/
    ./configure \
        --host=$HOST \
        --build=$(dpkg-architecture -qDEB_BUILD_GNU_TYPE) \
        --prefix=$PREFIX \
        --enable-static \
        --disable-shared \
        --disable-stats \
        --enable-prof
    make -j$(nproc)
    make install
    cd ..
}

BUILD_ZLIB
BUILD_EXPAT
BUILD_CARES
BUILD_OPENSSL
BUILD_SQLITE
BUILD_LIBSSH2
BUILD_JEMALLOC

echo "依赖构建完成!"
