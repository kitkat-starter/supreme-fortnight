#!/bin/bash -ex
set -ex

# 如果有,我当然是希望用 aria2 来下载
aria2c --help > /dev/null
if [ "$?" -eq 0 ] ; then
  DOWNLOADER="aria2c --check-certificate=false -x 16"
else
  DOWNLOADER="wget -c"
fi

# 精心挑选的依赖
ZLIB=https://sourceforge.net/projects/libpng/files/zlib/1.2.11/zlib-1.2.11.tar.gz
OPENSSL=https://www.openssl.org/source/openssl-1.1.1l.tar.gz
EXPAT=https://github.com/libexpat/libexpat/releases/download/R_2_4_4/expat-2.4.4.tar.bz2
SQLITE3=https://sqlite.org/2021/sqlite-autoconf-3360000.tar.gz
C_ARES=https://c-ares.haxx.se/download/c-ares-1.17.2.tar.gz
SSH2=https://www.libssh2.org/download/libssh2-1.10.0.tar.gz

## CONFIG ##
BUILD_DIRECTORY=/opt/build
PREFIX=/opt/aria2-build-libs
PKG_CONFIG_PATH="$PREFIX/lib/pkgconfig"
LD_LIBRARY_PATH="$PREFIX/lib"
C_COMPILER="gcc"
CXX_COMPILER="g++"
CC="$C_COMPILER"
CXX="$CXX_COMPILER"

## BUILD ##
mkdir -p ${BUILD_DIRECTORY} &&  cd ${BUILD_DIRECTORY}

function BUILD_ZLIB(){
  $DOWNLOADER $ZLIB
  tar zxvf zlib-1.2.11.tar.gz
  cd zlib-1.2.11/
  ./configure \
    --prefix=$PREFIX \
    --static
  make -j$(nproc)
  make install
  cd ..
}

function BUILD_EXPAT(){
  $DOWNLOADER $EXPAT
  tar jxvf expat-2.4.4.tar.bz2
  cd expat-2.4.4/
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
  $DOWNLOADER $C_ARES
  tar zxvf c-ares-1.17.2.tar.gz
  cd c-ares-1.17.2/
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
  $DOWNLOADER $OPENSSL
  tar zxvf openssl-1.1.1l.tar.gz
  cd openssl-1.1.1l/
  ./Configure \
    --prefix=$PREFIX \
    linux-x86_64 \
    no-tests
  make -j$(nproc)
  make install_sw
  cd ..
}

function BUILD_SQLITE() {
  $DOWNLOADER $SQLITE3
  tar zxvf sqlite-autoconf-3360000.tar.gz
  cd sqlite-autoconf-3360000/
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
  $DOWNLOADER $SSH2
  tar zxvf libssh2-1.10.0.tar.gz
  cd libssh2-1.10.0/
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

BUILD_ZLIB
BUILD_EXPAT
BUILD_CARES
BUILD_OPENSSL
BUILD_SQLITE
BUILD_LIBSSH2

echo "依赖构建完成!"
