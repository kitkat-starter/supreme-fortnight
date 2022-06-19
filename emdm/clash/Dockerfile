FROM alpine
RUN apk update && \
    apk add wget curl unzip tar gzip ca-certificates
RUN curl https://api.github.com/repos/MetaCubeX/Clash.Meta/releases/latest \
    | grep browser_download_url \
    | grep linux \
    | grep amd64 \
    | grep -v compatible \
    | cut -d '"' -f 4 \
    | wget -O /clash.gz -i -
RUN gzip -d /clash.gz
RUN ls
RUN mv Clash* clash
RUN chmod +x /clash
# 第二阶段,只有二进制文件
FROM alpine
COPY --from=0 /clash /clash
ENTRYPOINT [ "/clash" ]