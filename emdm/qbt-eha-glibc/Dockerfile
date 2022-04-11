FROM debian AS builder

ARG USE_MIRROR
ENV USE_MIRROR $USE_MIRROR
RUN --mount=type=bind,target=/context \
    sh /context/scripts/packages.sh
# 第二阶段,只有二进制文件
# FROM alpine
# RUN apk add --no-cache ca-certificates
# COPY --from=builder /qbittorrent-nox /qbittorrent-nox
# ENTRYPOINT [ "/qbittorrent-nox" ]