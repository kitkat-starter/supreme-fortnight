# ----------------------------------
# Pterodactyl Steam Game Dockerfile
# Game: ARK Survival Evolved
# Minimum Panel Version: 0.7.0
# ----------------------------------
FROM ubuntu:latest

# apt
ENV DEBIAN_FRONTEND=noninteractive
RUN dpkg --add-architecture i386 && \
    apt update && \
    apt install -y --no-install-recommends --no-install-suggests \
    curl \
    wget \
    file \
    bzip2 \
    gzip \
    unzip \
    util-linux \
    ca-certificates \
    bc \
    jq \
    lib32gcc1 \
    libc6 \
    libstdc++6 && \
    # 游戏 ARK Survival Evolved 特定组件
    echo "fs.file-max=500000" >> /etc/sysctl.conf && \
    echo "* soft nofile 100000" >> /etc/security/limits.conf && \
    echo "* hard nofile 100000" >> /etc/security/limits.conf && \
    echo "session required pam_limits.so" >> /etc/pam.d/common-session && \
    # 清理
    apt autoremove -y && \
    rm -rf /var/lib/{apt,dpkg,cache,log}/ && \
    # 最后 添加用户
    useradd -d /home/container -m container

USER container
ENV  USER container
ENV  HOME /home/container

WORKDIR /home/container

COPY ./entrypoint.sh /entrypoint.sh

CMD ["/bin/bash", "/entrypoint.sh"]