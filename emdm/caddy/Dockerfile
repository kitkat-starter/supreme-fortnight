FROM golang:alpine
RUN mkdir /build
WORKDIR /build
# 仅供测试使用
# ENV GOPROXY=https://goproxy.cn,https://goproxy.baidu.com,https://goproxy.io,direct
RUN go install github.com/caddyserver/xcaddy/cmd/xcaddy@latest
RUN xcaddy build \
    --with github.com/caddyserver/forwardproxy@caddy2 \
    --with github.com/sjtug/caddy2-filter@master \
    --with github.com/caddy-dns/tencentcloud \
    --with github.com/caddy-dns/cloudflare \
    --with github.com/caddy-dns/alidns \
    --with github.com/caddyserver/cache-handler
RUN chmod +x caddy
# 第二阶段,只有二进制文件
FROM alpine
COPY --from=0 /build/caddy /caddy
ENV XDG_CONFIG_HOME=/config
ENV XDG_DATA_HOME=/data
CMD ["/caddy" ,"run", "--config", "/etc/caddy/Caddyfile", "--adapter" ,"caddyfile"]