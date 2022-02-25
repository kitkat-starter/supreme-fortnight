FROM alpine
RUN apk update && \
    apk add wget curl unzip tar gzip ca-certificates
RUN curl https://api.github.com/repos/cloudflare/cloudflared/releases/latest \
    | grep browser_download_url \
    | grep cloudflared-linux-amd64 \
    | grep -v deb \
    | cut -d '"' -f 4 \
    | wget -O /cloudflared -i -
RUN chmod +x /cloudflared
# 第二阶段,只有二进制文件
FROM alpine
COPY --from=0 /cloudflared /cloudflared
ENTRYPOINT [ "/cloudflared" ]