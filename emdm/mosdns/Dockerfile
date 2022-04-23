FROM alpine AS builder
RUN apk update && \
    apk add wget curl unzip tar gzip ca-certificates
# 下载 V2Ray 本体
RUN curl https://api.github.com/repos/IrineSistiana/mosdns/releases/latest \
    | grep browser_download_url \
    | grep linux \
    | grep amd64 \
    | cut -d '"' -f 4 \
    | wget -O mosdns.zip -i -
RUN unzip mosdns.zip
# 此处为了照顾脚本,没有使用 scratch
FROM alpine
COPY --from=builder /mosdns /
RUN apk update && \
    apk add bash curl ca-certificates
CMD [ "-dir" ,"/etc/mosdns"]
ENTRYPOINT [ "/mosdns" ]