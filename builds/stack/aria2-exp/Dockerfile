# 第一阶段,用来构建
FROM alpine AS build
RUN apk add \
    bash \
    wget \
    curl \
    autoconf \
    automake \
    libtool \
    linux-headers \
    build-base \
    pkgconf \
    cmake \
    ninja \
    zip \
    unzip \
    curl \
    git \
    gettext \
    gettext-dev \
    gettext-static
# RUN apt update && \
#     apt install build-essential git curl -y

# 准备 vcpkg
RUN mkdir -p /vcpkg
WORKDIR /vcpkg
ENV VCPKG_FORCE_SYSTEM_BINARIES=1
RUN git clone https://github.com/microsoft/vcpkg && \
    cd vcpkg && \
    ./bootstrap-vcpkg.sh
ENV VCPKG_ROOT=/vcpkg/vcpkg

# 克隆代码
WORKDIR /app
RUN git clone --depth=1 https://github.com/chisaato/aria2/
RUN cd aria2 && \
    $VCPKG_ROOT/vcpkg install

RUN export VCPKG_DIR=/app && \
    export CXXFLAGS=-I${VCPKG_DIR}/vcpkg_installed/x64-linux/include ${CXXFLAGS} && \
    export CFLAGS=-I${VCPKG_DIR}/vcpkg_installed/x64-linux/include ${CFLAGS} && \
    export LDFLAGS=-L${VCPKG_DIR}/vcpkg_installed/x64-linux/debug/lib ${LDFLAGS} && \
    export PKG_CONFIG_PATH=${VCPKG_DIR}/vcpkg_installed/x64-linux/debug/lib/pkgconfig:${VCPKG_DIR}/vcpkg_installed/x64-linux/share/pkgconfig:$PKG_CONFIG_PATH && \
    CXXFLAGS="-ggdb -g3" && \
    $VCPKG_ROOT/vcpkg install && \
    which autoreconf >/dev/null && \
    autoreconf --install --force --verbose "/app" 2>&1; /bin/sh "/app/configure" \
    --with-libz \
    --with-libcares \
    --without-libexpat \
    --with-libxml2 \
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
    --disable-shared && \
    make -j$(nproc) && \
    make install

# 第二阶段,把文件给我拿来
FROM alpine AS run
RUN apk add --no-cache ca-certificates curl bash jq findutils && \
    mkdir -p /etc/aria2
# RUN apt update && \
#     apt install ca-certificates curl bash jq findutils -y && \
#     apt clean && \
#     rm -rf /var/lib/apt/lists/* && \
#     mkdir -p /etc/aria2
COPY --from=build /usr/local/bin/aria2c /usr/local/bin/aria2c
CMD ["--conf-path","/etc/aria2/aria2.conf"]
ENTRYPOINT [ "/usr/local/bin/aria2c" ]