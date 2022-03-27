FROM golang:alpine
RUN apk update && \
    apk add wget curl unzip tar gzip ca-certificates busybox upx
RUN curl https://api.github.com/repos/pterodactyl/wings/releases/latest \
    | grep browser_download_url \
    | grep wings_linux_amd64 \
    | cut -d '"' -f 4 \
    | wget -i - -O /wings \
    && chmod +x /wings
# 第二阶段,只有二进制文件
FROM alpine
# 最后修复了库问题
# 直到翼龙关闭CGO编译
RUN apk update && \
    apk add ca-certificates
COPY --from=0 /wings /wings
CMD [ "/wings" ]
