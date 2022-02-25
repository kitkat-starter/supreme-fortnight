# ----------------------------------
# Pterodactyl Steam Game Dockerfile
# Game: Unturned
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
    # 游戏 Unturned 特定组件
    apt install -y --no-install-recommends --no-install-suggests \
    lib32stdc++6 \
    mono-runtime \
    mono-devel \
    libc6 \
    libgl1-mesa-glx \
    libxcursor1 \
    libxrandr2 \
    libc6-dev \
    libgcc-10-dev && \
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