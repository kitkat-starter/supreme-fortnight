FROM golang:alpine
# ENV GOPROXY=https://goproxy.cn,https://mirrors.cloud.tencent.com/go,https://goproxy.bj.bcebos.com,https://gocenter.io,https://goproxy.io,direct
RUN apk update && \
    apk add git ca-certificates make
RUN mkdir -p /src
WORKDIR /src
RUN git clone -b building --depth=1 https://github.com/PuerNya/sing-box
# 构建!
# RUN go install -v -tags with_clash_api,with_quic,with_grpc,with_wireguard,with_ech,with_utls,with_v2ray_api,with_gvisor,with_reality_server,with_acme github.com/sagernet/sing-box/cmd/sing-box@dev-next
RUN cd sing-box && make build
# RUN mv sing-box /sing-box


# 第二阶段,只有二进制文件
FROM alpine
RUN apk update && \
    apk add ca-certificates
COPY --from=0 /src/sing-box/sing-box /sing-box
CMD [ "/sing-box" ]
