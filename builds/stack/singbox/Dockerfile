FROM golang:alpine
# ENV GOPROXY=https://goproxy.cn,https://mirrors.cloud.tencent.com/go,https://goproxy.bj.bcebos.com,https://gocenter.io,https://goproxy.io,direct
RUN apk update && \
    apk add git ca-certificates make bash wget curl
RUN mkdir -p /scripts
COPY build.sh /scripts/build.sh
RUN bash /scripts/build.sh


WORKDIR /yq/
# 关键修改：动态检测架构并下载对应的 yq
RUN set -ex; \
    ARCH=$(uname -m); \
    case "$ARCH" in \
    x86_64) YQ_ARCH="amd64" ;; \
    aarch64) YQ_ARCH="arm64" ;; \
    arm64) YQ_ARCH="arm64" ;; \
    *) echo "Unsupported architecture: $ARCH"; exit 1 ;; \
    esac; \
    echo "Detected architecture: $ARCH, downloading yq for linux_${YQ_ARCH}"; \
    curl -s https://api.github.com/repos/mikefarah/yq/releases/latest \
    | grep browser_download_url \
    | grep "linux_${YQ_ARCH}" \
    | grep -v .tar.gz \
    | cut -d '"' -f 4 \
    | wget -O yq -i -; \
    chmod +x yq

# 第二阶段,只有二进制文件
FROM alpine
RUN apk update && \
    apk add ca-certificates
COPY --from=0 /src/sing-box/sing-box /sing-box
COPY --from=0 /yq/yq /usr/local/bin/
CMD [ "/sing-box" ]
