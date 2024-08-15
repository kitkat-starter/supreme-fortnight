FROM golang:alpine
# ENV GOPROXY=https://goproxy.cn,https://mirrors.cloud.tencent.com/go,https://goproxy.bj.bcebos.com,https://gocenter.io,https://goproxy.io,direct
RUN apk update && \
    apk add git ca-certificates make bash
RUN mkdir -p /scripts
COPY build.sh /scripts/build.sh
RUN bash /scripts/build.sh

RUN git clone https://github.com/metacubex/metacubexd.git -b gh-pages /yacd


# 第二阶段,只有二进制文件
FROM alpine
RUN apk update && \
    apk add ca-certificates
COPY --from=0 /src/sing-box/sing-box /sing-box
COPY --from=0 /yacd /yacd
CMD [ "/sing-box" ]
