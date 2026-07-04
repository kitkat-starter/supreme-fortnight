FROM alpine AS downloader
RUN apk --no-cache add curl wget unzip ca-certificates
ARG TARGETARCH=amd64

# 下载 client 和 server 二进制文件（自动获取最新版本）
RUN curl -sL https://api.github.com/repos/steelbrain/ffmpeg-over-ip/releases/latest \
    | grep browser_download_url \
    | grep "linux-${TARGETARCH}-ffmpeg-over-ip-client.zip" \
    | cut -d '"' -f 4 \
    | wget -O /tmp/client.zip -i -

RUN curl -sL https://api.github.com/repos/steelbrain/ffmpeg-over-ip/releases/latest \
    | grep browser_download_url \
    | grep "linux-${TARGETARCH}-ffmpeg-over-ip-server.zip" \
    | cut -d '"' -f 4 \
    | wget -O /tmp/server.zip -i -

# 分目录解压，避免 LICENSE 等文件冲突
RUN mkdir -p /opt/ffmpeg-over-ip/client /opt/ffmpeg-over-ip/server && \
    unzip /tmp/client.zip -d /opt/ffmpeg-over-ip/client && \
    unzip /tmp/server.zip -d /opt/ffmpeg-over-ip/server && \
    rm /tmp/*.zip

# 最终阶段：debian:trixie-slim 提供 glibc（ffmpeg 需要）
FROM debian:trixie-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=downloader /opt/ffmpeg-over-ip /opt/ffmpeg-over-ip

# 链接到 PATH 方便直接运行
RUN ln -s /opt/ffmpeg-over-ip/server/ffmpeg /usr/local/bin/ffmpeg && \
    ln -s /opt/ffmpeg-over-ip/server/ffprobe /usr/local/bin/ffprobe && \
    ln -s /opt/ffmpeg-over-ip/server/ffmpeg-over-ip-server /usr/local/bin/ffmpeg-over-ip-server && \
    ln -s /opt/ffmpeg-over-ip/client/ffmpeg-over-ip-client /usr/local/bin/ffmpeg-over-ip-client

EXPOSE 5050

# 默认运行 server，可覆盖为 client 或其他命令
ENTRYPOINT ["ffmpeg-over-ip-server"]
