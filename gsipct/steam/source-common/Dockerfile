# ----------------------------------
# Pterodactyl Steam Game Dockerfile
# Game: ARK Survival Evolved
# Minimum Panel Version: 0.7.0
# ----------------------------------
# 第一阶段,下载 rcon
FROM docker.io/alpine as download
RUN apk update && \
    apk add wget curl unzip tar gzip ca-certificates
RUN curl https://api.github.com/repos/gorcon/rcon-cli/releases/latest \
    | grep browser_download_url \
    | grep amd64 \
    | grep linux \
    | cut -d '"' -f 4 \
    | wget -i - -O rcon.tar.gz
RUN tar  xvzf rcon.tar.gz --strip-components 1 -C /
# 第二阶段,准备环境
FROM docker.io/cm2network/steamcmd:root as build
ENV DEBIAN_FRONTEND=noninteractive
RUN dpkg --add-architecture i386 \
    && apt update \
    && apt install -y \
    tar \
    curl \
    gcc \
    g++ \
    lib32gcc-s1 \
    libgcc1 \
    libcurl4-gnutls-dev:i386 \
    libssl1.1:i386 \
    libcurl4:i386 \
    lib32tinfo6 \
    libtinfo6:i386 \
    lib32z1 \
    lib32stdc++6 \
    libncurses5:i386 \
    libcurl3-gnutls:i386 \
    libsdl2-2.0-0:i386 \
    iproute2 \
    gdb \
    libsdl1.2debian \
    libfontconfig1 \
    telnet \
    net-tools \
    netcat \
    tzdata
RUN useradd -o -u 1000 -g 1000 -m -d /home/container container

## install rcon
COPY --from=download /rcon /usr/local/bin/rcon

USER container
ENV USER=container HOME=/home/container
WORKDIR /home/container

COPY ./entrypoint.sh /entrypoint.sh
CMD [ "/bin/bash", "/entrypoint.sh" ]