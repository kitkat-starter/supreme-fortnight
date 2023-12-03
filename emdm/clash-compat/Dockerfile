# 下载二进制本体
FROM alpine
RUN apk update && \
    apk add wget curl unzip tar gzip ca-certificates
RUN curl https://api.github.com/repos/MetaCubeX/mihomo/releases/tags/Prerelease-Alpha \
    | grep browser_download_url \
    | grep linux \
    | grep amd64 \
    | grep compatible \
    | grep -v go120 \
    | cut -d '"' -f 4 \
    | wget -O /mihomo.gz -i -
RUN gzip -d /mihomo.gz
RUN chmod +x /mihomo

# 下载前端
FROM node:alpine
RUN apk update && \
    apk add ca-certificates git
RUN git clone https://github.com/metacubex/metacubexd.git -b gh-pages /yacd
# 最后,组合起来
FROM alpine
COPY --from=0 /mihomo /mihomo
COPY --from=1 /yacd /yacd
ENTRYPOINT [ "/mihomo" ]