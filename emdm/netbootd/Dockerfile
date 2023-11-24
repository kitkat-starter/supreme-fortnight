FROM debian:latest AS ipxe-build
# 安装依赖
RUN apt update && apt -y install \
    make binutils g++ perl liblzma-dev mtools genisoimage xorriso libc6-dev git syslinux isolinux \
    file gcc-aarch64-linux-gnu binutils-aarch64-linux-gnu
# 拉源码下来
RUN git clone https://github.com/ipxe/ipxe.git /tmp/build

# 拷贝构建配置
COPY build.sh /
COPY build.conf /
COPY config/ /tmp/build/src/config
# 构建
RUN sh /build.sh

# 构建 netbootd
FROM golang:latest AS netbootd-build
# 安装依赖
ENV DEBIAN_FRONTEND=noninteractive
RUN apt -y install \
    git
# 拉源码
RUN git clone --depth=1 https://github.com/DSpeichert/netbootd
# 从上一级拷贝一些东西
COPY --from=ipxe-build /ipxe/src/bin-x86_64-efi/ipxe.efi /go/netbootd/static
COPY --from=ipxe-build /ipxe/src/bin/undionly.kpxe /go/netbootd/static
# 开始构建
WORKDIR /go/netbootd
ENV CGO_ENABLED=0
RUN go build -o netbootd -trimpath -ldflags "-s -w -extldflags '-static'" -gcflags=-trimpath=$GOPATH -asmflags=-trimpath=$GOPATH .

# 打包
FROM alpine:latest
COPY --from=netbootd-build /go/netbootd/netbootd /netbootd
