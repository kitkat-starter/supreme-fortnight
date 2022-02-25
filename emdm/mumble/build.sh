#!/bin/sh
# 镜像站
sed -i s/deb.debian.org/mirrors.aliyun.com/g /etc/apt/sources.list
sed -i s/security.debian.org/mirrors.aliyun.com/g /etc/apt/sources.list
apt update
# 准备下载代码用的东西
apt install git ca-certificates
git clone -b v1.4.230 --depth=1 --recurse-submodules -j8 https://github.com/mumble-voip/mumble

# 安装构建依赖
DEBIAN_FRONTEND=noninteractive
apt install --no-install-recommends -y\
    build-essential \
    cmake \
    pkg-config \
    qtbase5-dev \
    qttools5-dev \
    qttools5-dev-tools \
    libqt5svg5-dev \
    libboost-dev \
    libssl-dev \
    libprotobuf-dev \
    protobuf-compiler \
    libprotoc-dev \
    libcap-dev \
    libxi-dev \
    libasound2-dev \
    libogg-dev \
    libsndfile1-dev \
    libspeechd-dev \
    libavahi-compat-libdnssd-dev \
    libzeroc-ice-dev \
    libpoco-dev \
    libgrpc++-dev \
    protobuf-compiler-grpc

cd mumble
mkdir build && cd build
cmake -Dclient=OFF -Dzeroconf=OFF -Ddbus=OFF -Doverlay=OFF -Dplugins=OFF ..