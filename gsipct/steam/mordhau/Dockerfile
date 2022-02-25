# ----------------------------------
# Pterodactyl Steam Game Dockerfile
# Game: Mordhau
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
    # 游戏 Mordhau 特定组件
    apt install -y --no-install-recommends --no-install-suggests \
    libfontconfig1 \
    libpangocairo-1.0-0 \
    libnss3 \
    libgconf-2-4 \
    libxi6 \
    libxcursor1 \
    libxss1 \
    libxcomposite1 \
    libasound2 \
    libxdamage1 \
    libxtst6 \
    libatk1.0-0 \
    libxrandr2 && \
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