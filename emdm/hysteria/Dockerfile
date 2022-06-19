FROM alpine
RUN apk update && \
    apk add wget curl unzip tar gzip ca-certificates
RUN curl https://api.github.com/repos/HyNetwork/hysteria/releases/latest \
    | grep browser_download_url \
    | grep linux \
    | grep amd64 \
    | grep tun \
    | cut -d '"' -f 4 \
    | wget -O /hysteria -i -
RUN chmod +x /hysteria
# 第二阶段,只有二进制文件
FROM alpine
COPY --from=0 /hysteria /hysteria
ENTRYPOINT [ "/hysteria" ]