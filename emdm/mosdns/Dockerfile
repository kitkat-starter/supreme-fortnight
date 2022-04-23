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
FROM scratch
COPY --from=builder /mosdns /
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
CMD [ "-dir" ,"/etc/mosdns"] 
ENTRYPOINT [ "/mosdns" ]