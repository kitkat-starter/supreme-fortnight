# ----------------------------------
# Pterodactyl Steam Game Dockerfile
# Game: SteamCMD Debian
# Minimum Panel Version: 0.7.0
# ----------------------------------
FROM ghcr.io/parkervcp/steamcmd:debian

USER root

# 添加一些 Locale
RUN apt update && apt install -y locales && \
    echo "en_US.UTF-8 UTF-8" > /etc/locale.gen && \
    echo "zh_CN.UTF-8 UTF-8" >> /etc/locale.gen && \
    locale-gen && \
    localedef -i en_US -f UTF-8 en_US.UTF-8 && \
    rm -rf /var/lib/apt/lists/*

ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US:en

USER container
COPY ./entrypoint.sh /entrypoint.sh
CMD [ "/bin/bash", "/entrypoint.sh" ]