FROM alpine
RUN apk update && \
    apk add wget curl unzip tar gzip ca-certificates
RUN curl https://api.github.com/repos/AdguardTeam/AdGuardHome/releases/latest \
    | grep browser_download_url \
    | grep AdGuardHome_linux_amd64.tar.gz \
    | cut -d '"' -f 4 \
    | wget -i -
RUN tar xvzf  AdGuardHome_linux_amd64.tar.gz
# 第二阶段,只有二进制文件
FROM alpine
COPY --from=0 /AdGuardHome/AdGuardHome /AdGuardHome
ENTRYPOINT [ "/AdGuardHome" ]