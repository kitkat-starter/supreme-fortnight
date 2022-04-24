FROM alpine AS builder
RUN apk update && \
    apk add wget curl unzip tar gzip ca-certificates
# 下载 mosdns 本体
RUN curl https://api.github.com/repos/IrineSistiana/mosdns/releases/latest \
    | grep browser_download_url \
    | grep linux \
    | grep amd64 \
    | cut -d '"' -f 4 \
    | wget -O mosdns.zip -i -
# 下载额外地区数据库 geoip
RUN curl https://api.github.com/repos/Loyalsoldier/v2ray-rules-dat/releases/latest \
    | grep browser_download_url \
    | grep geoip.dat \
    | grep -v sum \
    | cut -d '"' -f 4 \
    | wget -i -

# 下载额外地区数据库
RUN curl https://api.github.com/repos/Loyalsoldier/v2ray-rules-dat/releases/latest \
    | grep browser_download_url \
    | grep geosite.dat \
    | grep -v sum \
    | cut -d '"' -f 4 \
    | wget -i -
RUN unzip mosdns.zip
# 此处为了照顾脚本,没有使用 scratch
FROM alpine
COPY --from=builder /mosdns /
COPY --from=builder /geoip.dat /geosite.dat /usr/share/mosdns/
RUN apk update && \
    apk add bash curl ca-certificates
CMD [ "-dir" ,"/etc/mosdns"]
ENTRYPOINT [ "/mosdns" ]