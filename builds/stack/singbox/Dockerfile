FROM golang:alpine
# ENV GOPROXY=https://goproxy.cn,https://mirrors.cloud.tencent.com/go,https://goproxy.bj.bcebos.com,https://gocenter.io,https://goproxy.io,direct
RUN apk update && \
    apk add git ca-certificates make bash wget curl
RUN mkdir -p /scripts
COPY build.sh /scripts/build.sh
RUN bash /scripts/build.sh

RUN git clone https://github.com/metacubex/metacubexd.git -b gh-pages /yacd

WORKDIR /yq/
RUN curl https://api.github.com/repos/mikefarah/yq/releases/latest \
    | grep browser_download_url \
    | grep _linux_amd64 \
    | grep -v .tar.gz \
    | cut -d '"' -f 4 \
    | wget -O yq -i -
RUN chmod +x yq

# 第二阶段,只有二进制文件
FROM alpine
RUN apk update && \
    apk add ca-certificates
COPY --from=0 /src/sing-box/sing-box /sing-box
COPY --from=0 /yq/yq /usr/local/bin/
COPY --from=0 /yacd /yacd
CMD [ "/sing-box" ]
