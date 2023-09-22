FROM alpine AS builder
RUN apk update && \
    apk add wget curl unzip tar gzip ca-certificates
# 下载 Xray 本体
RUN curl https://api.github.com/repos/XTLS/Xray-core/releases/latest \
    | grep browser_download_url \
    | grep Xray-linux-64.zip \
    | grep -v dgst \
    | cut -d '"' -f 4 \
    | wget -i -
RUN unzip Xray-linux-64.zip
# 清理自带的地区数据库
RUN rm -rf geoip.dat geosite.dat
# 下载额外地区数据库 geoip
RUN curl https://api.github.com/repos/Loyalsoldier/Xray-rules-dat/releases/latest \
    | grep browser_download_url \
    | grep geoip.dat \
    | grep -v sum \
    | cut -d '"' -f 4 \
    | wget -i -

# 下载额外地区数据库
RUN curl https://api.github.com/repos/Loyalsoldier/Xray-rules-dat/releases/latest \
    | grep browser_download_url \
    | grep geosite.dat \
    | grep -v sum \
    | cut -d '"' -f 4 \
    | wget -i -
RUN chmod +x xray
# 第二阶段,只有二进制文件
FROM alpine

COPY --from=builder /xray /geoip.dat /geosite.dat /
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

RUN apk --no-cache update && \
    apk --no-cache add bash curl wget tzdata ca-certificates && \
    adduser -D -h /home/container container

USER container
ENV  USER container
ENV  HOME /home/container

WORKDIR /home/container

COPY ./entrypoint.sh /entrypoint.sh

CMD ["/bin/bash", "/entrypoint.sh"]