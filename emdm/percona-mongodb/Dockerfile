# 第一阶段 配置
FROM debian:buster
RUN apt update && \
    apt install -y --no-install-recommends \
    apt-transport-https \
    ca-certificates \
    lsb-release \
    wget \
    curl
# 安装换源工具
RUN wget -O percona-release.deb https://repo.percona.com/apt/percona-release_latest.buster_all.deb
# 无论如何都会失败,那就强制不失败
RUN dpkg -i percona-release.deb || true
# 启用 MongoDB 44 源
RUN percona-release enable psmdb-44 release

# 第二阶段 安装
FROM debian:buster
# 准备
RUN apt update && \
    apt install -y --no-install-recommends \
    apt-transport-https \
    gnupg2 \
    ca-certificates \
    pwgen && \
    rm -rf /var/lib/apt/lists/*
# 配置安装源
COPY --from=0 /etc/apt/sources.list.d /etc/apt/sources.list.d
RUN apt-key adv --keyserver keys.gnupg.net --recv-keys 8507EFA5
# the numeric UID is needed for OpenShift
RUN useradd -u 1000 -r -g 0 -s /sbin/nologin \
    -c "Default Application User" mongodb
ENV PERCONA_MAJOR 44
# 安装
RUN apt update && \
    apt install -y --force-yes \
    percona-server-mongodb && \
    rm -rf /var/lib/apt/lists/* && \
    rm -rf /data/db && mkdir -p /data/db && \
    chown -R 1000:0 /data/db
# 入口点
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
USER 1000
CMD ["mongod"]