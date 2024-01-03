FROM alpine
RUN apk update && \
    apk add wget curl unzip tar gzip ca-certificates
# 下载和解压 frp
RUN curl https://api.github.com/repos/fatedier/frp/releases/latest \
    | grep browser_download_url \
    | grep _linux_amd64.tar.gz \
    | cut -d '"' -f 4 \
    | wget -i -
RUN tar xvzf frp_*_linux_amd64.tar.gz --strip-components=1

# 提取二进制
RUN mkdir frp-bin && \
    mv frpc ./frp-bin/ && \
    mv frps ./frp-bin/


# 第二阶段,只有二进制文件
FROM alpine
COPY --from=0 /frp-bin/ /
# RUN ls /
CMD [ "echo", "请覆盖CMD并且选择命令,frps,frpc" ]
