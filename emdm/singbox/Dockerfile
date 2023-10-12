FROM golang:alpine
# ENV GOPROXY=https://goproxy.cn,https://mirrors.cloud.tencent.com/go,https://goproxy.bj.bcebos.com,https://gocenter.io,https://goproxy.io,direct
# 构建!
RUN go install -v -tags with_clash_api,with_quic,with_grpc,with_wireguard,with_shadowsocksr,with_ech,with_utls,with_v2ray_api,with_gvisor,with_reality_server,with_acme github.com/sagernet/sing-box/cmd/sing-box@latest


# 第二阶段,只有二进制文件
FROM alpine
# 最后修复了库问题
# 直到翼龙关闭CGO编译
RUN apk update && \
    apk add ca-certificates
COPY --from=0 /go/bin/sing-box /sing-box
CMD [ "/sing-box" ]
