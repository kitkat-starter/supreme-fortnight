FROM alpine
RUN apk update && \
    apk add wget curl unzip tar gzip ca-certificates
RUN curl https://api.github.com/repos/pymumu/smartdns/releases/latest \
    | grep browser_download_url \
    | grep smartdns-x86_64 \
    | cut -d '"' -f 4 \
    | wget -i -
RUN chmod +x smartdns-x86_64
# 第二阶段,只有二进制文件
FROM alpine
RUN apk update && \
    apk add ca-certificates
COPY --from=0 /smartdns-x86_64 /smartdns
ENTRYPOINT [ "/smartdns" ]
