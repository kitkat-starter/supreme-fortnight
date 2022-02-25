FROM alpine AS builder
RUN apk update && \
    apk add wget curl unzip tar gzip ca-certificates
# 下载 V2Ray 本体
RUN curl https://api.github.com/repos/v2fly/v2ray-core/releases/latest \
    | grep browser_download_url \
    | grep v2ray-linux-64.zip \
    | grep -v dgst \
    | cut -d '"' -f 4 \
    | wget -i -
RUN unzip v2ray-linux-64.zip
# 清理自带的地区数据库
RUN rm -rf geoip.dat geosite.dat
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
RUN chmod +x v2ray v2ctl
# 第二阶段,只有二进制文件
# 尝试使用 Scratch 缩小大小
FROM scratch
COPY --from=builder /v2ray /v2ctl /geoip.dat /geosite.dat /
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
CMD [ "-config" ,"/etc/v2ray/config.json"] 
ENTRYPOINT [ "/v2ray" ]