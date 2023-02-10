FROM alpine AS builder
RUN apk update && \
    apk add wget curl unzip tar gzip ca-certificates
# 下载 mosdns 本体
RUN curl https://api.github.com/repos/IrineSistiana/mosdns/releases/tags/v5.0.1 \
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

# 安装 v2dat 解包工具
FROM golang:alpine as golang
RUN go install github.com/urlesistiana/v2dat@latest

# 此处为了照顾脚本,没有使用 scratch
FROM alpine
COPY --from=builder /mosdns /
COPY --from=builder /geoip.dat /geosite.dat /usr/share/mosdns/
COPY --from=golang /go/bin/v2dat /usr/bin/v2dat
RUN apk update && \
    apk add bash curl ca-certificates bind-tools
CMD [ "start","-c","/etc/mosdns/config.yaml","-d" ,"/etc/mosdns"]
ENTRYPOINT [ "/mosdns" ]