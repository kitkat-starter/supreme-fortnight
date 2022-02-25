# ----------------------------------
# Pterodactyl Core Dockerfile
# Environment: Wine Debian 10
# Minimum Panel Version: 0.6.0
# ----------------------------------
FROM debian:10

LABEL org.opencontainers.image.authors="noreplay@noreply.org"
LABEL org.opencontainers.image.vendor="KKP"

ENV DEBIAN_FRONTEND=noninteractive
RUN apt update && \
    apt install -y --no-install-recommends bash curl wget tzdata ca-certificates && \
    rm -rf /var/lib/{apt,dpkg,cache,log}/ && \
    adduser -D -h /home/container container

# 还需要准备 Wine
RUN apt update && \
    apt install -y --no-install-recommends gnupg gnupg2 && \
    dpkg --add-architecture i386  && \
    wget -O- -q https://dl.winehq.org/wine-builds/winehq.key | apt-key add - && \
    wget -O- -q https://download.opensuse.org/repositories/Emulators:/Wine:/Debian/Debian_10/Release.key | apt-key add - && \
    apt remove gnupg gnupg2 -y && \
    echo "deb https://download.opensuse.org/repositories/Emulators:/Wine:/Debian/Debian_10 ./" > /etc/apt/sources.list.d/wine-obs.list && \
    echo "deb https://dl.winehq.org/wine-builds/debian/ buster main" > /etc/apt/sources.list.d/winehq.list && \
    apt update && \
    apt install -y --no-install-recommends winehq-stable && \
    apt autoremove -y && \
    rm -rf /var/lib/{apt,dpkg,cache,log}/

USER container
ENV  USER container
ENV  HOME /home/container

WORKDIR /home/container

COPY ./entrypoint.sh /entrypoint.sh

CMD ["/bin/bash", "/entrypoint.sh"]
