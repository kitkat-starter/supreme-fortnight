#!/bin/sh
# 设定一下路径
PREFIX=/opt/aria2/build_libs
C_COMPILER="gcc"
CXX_COMPILER="g++"

# 如果有,我当然是希望用 aria2 来下载
 aria2c --help > /dev/null
 if [ "$?" -eq 0 ] ; then
   DOWNLOADER="aria2c --check-certificate=false -s 64 -x 16"
 else
   DOWNLOADER="wget -c"
 fi

# 精心挑选的依赖
ZLIB=http://sourceforge.net/projects/libpng/files/zlib/1.2.11/zlib-1.2.11.tar.gz
OPENSSL=https://www.openssl.org/source/openssl-1.1.1l.tar.gz
EXPAT=https://github.com/libexpat/libexpat/releases/download/R_2_4_4/expat-2.4.4.tar.bz2
SQLITE3=https://sqlite.org/2021/sqlite-autoconf-3360000.tar.gz
C_ARES=https://c-ares.haxx.se/download/c-ares-1.17.2.tar.gz
SSH2=https://www.libssh2.org/download/libssh2-1.10.0.tar.gz

## CONFIG ##
BUILD_DIRECTORY=/tmp/

## BUILD ##
cd $BUILD_DIRECTORY
#
 # 构建 ZLIB
  tar zxvf zlib-1.2.11.tar.gz
  cd zlib-1.2.11/
  PKG_CONFIG_PATH=$PREFIX/lib/pkgconfig/ LD_LIBRARY_PATH=$PREFIX/lib/ CC="$C_COMPILER" CXX="$CXX_COMPILER" ./configure --prefix=$PREFIX --static
  make -j$(nproc)
  make install
#
 # 构建 expat
  cd ..
  $DOWNLOADER $EXPAT
  tar jxvf expat-2.4.4.tar.bz2
  cd expat-2.4.4/
  PKG_CONFIG_PATH=$PREFIX/lib/pkgconfig/ LD_LIBRARY_PATH=$PREFIX/lib/ CC="$C_COMPILER" CXX="$CXX_COMPILER" ./configure --prefix=$PREFIX --enable-static --enable-shared
  make -j$(nproc)
  make install
#
 # 构建 c-ares
  cd ..
  $DOWNLOADER $C_ARES
  tar zxvf c-ares-1.17.2.tar.gz
  cd c-ares-1.17.2/
  PKG_CONFIG_PATH=$PREFIX/lib/pkgconfig/ LD_LIBRARY_PATH=$PREFIX/lib/ CC="$C_COMPILER" CXX="$CXX_COMPILER" ./configure --prefix=$PREFIX --enable-static --disable-shared
  make -j$(nproc)
  make install
#
 # 构建 OpenSSL
  cd ..
  $DOWNLOADER $OPENSSL
  tar zxvf openssl-1.1.1l.tar.gz
  cd openssl-1.1.1l/
  PKG_CONFIG_PATH=$PREFIX/lib/pkgconfig/ LD_LIBRARY_PATH=$PREFIX/lib/ CC="$C_COMPILER" CXX="$CXX_COMPILER" ./Configure --prefix=$PREFIX linux-x86_64 shared
  make -j$(nproc)
  make install
#
 # 构建 sqlite3
  cd ..
  $DOWNLOADER $SQLITE3
  tar zxvf sqlite-autoconf-3360000.tar.gz
  cd sqlite-autoconf-3360000/
  PKG_CONFIG_PATH=$PREFIX/lib/pkgconfig/ LD_LIBRARY_PATH=$PREFIX/lib/ CC="$C_COMPILER" CXX="$CXX_COMPILER" ./configure --prefix=$PREFIX --enable-static --enable-shared
  make -j$(nproc)
  make install
#
 # 构建 libssh2
  cd ..
  $DOWNLOADER $SSH2
  tar zxvf libssh2-1.10.0.tar.gz
  cd libssh2-1.10.0/
  rm -rf $PREFIX/lib/pkgconfig/libssh2.pc
  PKG_CONFIG_PATH=$PREFIX/lib/pkgconfig/ LD_LIBRARY_PATH=$PREFIX/lib/ CC="$C_COMPILER" CXX="$CXX_COMPILER" ./configure --without-libgcrypt --with-openssl --without-wincng --prefix=$PREFIX --enable-static --disable-shared
  make -j$(nproc)
  make install
#
 #cleaning
  cd ..
  rm -rf c-ares*
  rm -rf sqlite-autoconf*
  rm -rf zlib-*
  rm -rf expat-*
  rm -rf openssl-*
  rm -rf libssh2-*
#
echo "依赖构建完成!"
