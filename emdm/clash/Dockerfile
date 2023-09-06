# 下载二进制本体
FROM alpine
RUN apk update && \
    apk add wget curl unzip tar gzip ca-certificates
RUN curl https://api.github.com/repos/MetaCubeX/Clash.Meta/releases/tags/Prerelease-Alpha \
    | grep browser_download_url \
    | grep linux \
    | grep amd64 \
    | grep -v compatible \
    | cut -d '"' -f 4 \
    | wget -O /clash.gz -i -
RUN gzip -d /clash.gz
RUN chmod +x /clash

# 下载前端
FROM node:alpine
RUN apk update && \
    apk add ca-certificates git
RUN git clone https://github.com/metacubex/metacubexd.git -b gh-pages /yacd
# 最后,组合起来
FROM alpine
COPY --from=0 /clash /clash
COPY --from=1 /yacd /yacd
ENTRYPOINT [ "/clash" ]