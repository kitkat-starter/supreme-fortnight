# 第一阶段,用来构建
FROM alpine AS build
RUN apk add \
    bash \
    wget \
    curl \
    make \
    binutils \
    autoconf \
    automake \
    libtool \
    aria2 \
    ca-certificates \
    pkgconf \
    git \
    gcc \
    g++ \
    libxml2-dev \
    gettext \
    gettext-dev \
    gettext-static \
    linux-headers
# 这样可以缓存这次结果
RUN mkdir -p /scripts
COPY scripts/build-deps.sh /scripts/build-deps.sh
RUN bash /scripts/build-deps.sh

# 轮到 Aria2 构建
COPY scripts/clone-aria2.sh /scripts/clone-aria2.sh
RUN bash /scripts/clone-aria2.sh
RUN mkdir /context
COPY patch /context/patch
COPY scripts/build-aria2.sh /scripts/build-aria2.sh
RUN bash /scripts/build-aria2.sh


# 第二阶段,把文件给我拿来
FROM alpine AS run
RUN apk add --no-cache ca-certificates curl bash jq findutils && \
    mkdir -p /etc/aria2
COPY --from=build /usr/local/bin/aria2c /usr/local/bin/aria2c
CMD ["--conf-path","/etc/aria2/aria2.conf"]
ENTRYPOINT [ "/usr/local/bin/aria2c" ]