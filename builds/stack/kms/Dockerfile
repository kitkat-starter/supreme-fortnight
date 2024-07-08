FROM alpine
RUN apk update && \
    apk add wget curl unzip tar gzip ca-certificates
RUN curl https://api.github.com/repos/Wind4/vlmcsd/releases/latest \
    | grep browser_download_url \
    | grep binaries \
    | cut -d '"' -f 4 \
    | wget -O /binaries.tar.gz -i -
RUN tar xvzf /binaries.tar.gz
RUN cp /binaries/Linux/intel/static/vlmcsdmulti-x64-musl-static /vlmcsdmulti
# 第二阶段,只有二进制文件
FROM alpine
COPY --from=0 /vlmcsdmulti /vlmcsdmulti
CMD [ "-v","-e" ]
ENTRYPOINT [ "/vlmcsdmulti" ,"vlmcsd","-D"]