FROM alpine AS builder
RUN apk update && \
    apk add wget curl unzip tar gzip ca-certificates
# 下载 qbittorrent-enhanced
RUN curl https://api.github.com/repos/c0re100/qBittorrent-Enhanced-Edition/releases/latest \
    | grep browser_download_url \
    | grep nox \
    | grep x86_64 \
    | cut -d '"' -f 4 \
    | wget -O qbit-enahnce.zip -i -
RUN unzip qbit-enahnce.zip
RUN chmod +x qbittorrent-nox
# 第二阶段,只有二进制文件
FROM alpine
RUN apk add --no-cache ca-certificates
COPY --from=builder /qbittorrent-nox /qbittorrent-nox
ENTRYPOINT [ "/qbittorrent-nox" ]