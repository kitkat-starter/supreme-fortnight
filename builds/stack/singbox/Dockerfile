FROM golang:alpine
# 设置 Go 缓存环境变量
ENV GOMODCACHE=/go/pkg/mod
ENV GOCACHE=/root/.cache/go-build
# ENV GOPROXY=https://goproxy.cn,https://mirrors.cloud.tencent.com/go,https://goproxy.bj.bcebos.com,https://gocenter.io,https://goproxy.io,direct
RUN apk update && \
    apk add git ca-certificates make bash wget curl
RUN mkdir -p /scripts
COPY build.sh /scripts/build.sh
COPY clone.sh /scripts/clone.sh
WORKDIR /src
RUN bash /scripts/build.sh

# 第一阶段：准备源码和依赖（利用缓存）
# RUN mkdir -p /src && cd /src && \
#     git clone -b building https://github.com/chisaato/sing-box && \
#     cd sing-box && \
#     git remote add sekai https://github.com/SagerNet/sing-box.git && \
#     git fetch --tags sekai

# 使用 BuildKit 缓存挂载（需要 BuildKit 启用）
# 下载依赖（可缓存）
RUN --mount=type=cache,target=/go/pkg/mod \
    cd /src/sing-box && \
    go mod download

# 构建（可缓存）
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    cd /src/sing-box && \
    VERSION=$(CGO_ENABLED=0 go run ./cmd/internal/read_tag) && \
    echo version=$VERSION > ./version && \
    TAGS="with_quic,with_dhcp,with_wireguard,with_shadowsocksr,with_ech,with_utls,with_acme,with_reality_server,with_clash_api,with_gvisor" && \
    go build -o sing-box -v -trimpath -ldflags "-checklinkname=0 -X 'github.com/sagernet/sing-box/constant.Version=${VERSION}' -s -w -buildid=" -tags "${TAGS}" ./cmd/sing-box

RUN git clone https://github.com/metacubex/metacubexd.git -b gh-pages /yacd

WORKDIR /yq/
RUN curl https://api.github.com/repos/mikefarah/yq/releases/latest \
    | grep browser_download_url \
    | grep _linux_amd64 \
    | grep -v .tar.gz \
    | cut -d '"' -f 4 \
    | wget -O yq -i -
RUN chmod +x yq

# 第二阶段,只有二进制文件
FROM alpine
RUN apk update && \
    apk add ca-certificates
COPY --from=0 /src/sing-box/sing-box /sing-box
COPY --from=0 /yq/yq /usr/local/bin/
COPY --from=0 /yacd /yacd
CMD [ "/sing-box" ]
