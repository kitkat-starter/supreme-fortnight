FROM golang:alpine
# ENV GOPROXY=https://goproxy.cn,https://mirrors.cloud.tencent.com/go,https://goproxy.bj.bcebos.com,https://gocenter.io,https://goproxy.io,direct
RUN apk update && \
    apk add git ca-certificates make bash wget curl

WORKDIR /downloads
COPY download.sh .
RUN chmod +x download.sh && ./download.sh

# 第二阶段,只有二进制文件
FROM alpine
RUN apk update && \
    apk add ca-certificates bash
COPY --from=0 /downloads/mihomo* /usr/local/bin/
COPY --from=0 /downloads/yq /usr/local/bin/
COPY --from=0 /yacd /yacd
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

