FROM golang:alpine
RUN apk update && \
    apk add wget curl unzip tar gzip ca-certificates busybox upx
RUN curl https://api.github.com/repos/XIU2/SNIProxy/releases/latest \
    | grep browser_download_url \
    | grep amd64 \
    | grep linux \
    | cut -d '"' -f 4 \
    | wget -O /sniproxy.tar.gz -i -
RUN tar -xvzf sniproxy.tar.gz
RUN chmod +x /sniproxy
# 第二阶段,只有二进制文件
FROM alpine
RUN apk update && \
    apk add ca-certificates
COPY --from=0 /sniproxy /sniproxy
CMD [ "/sniproxy" ]
