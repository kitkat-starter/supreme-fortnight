# syntax=docker/dockerfile:1

FROM ghcr.io/linuxserver/baseimage-selkies:ubuntunoble

# set version label
ARG BUILD_DATE
ARG VERSION
LABEL build_version="Linuxserver.io version:- ${VERSION} Build-date:- ${BUILD_DATE}"
LABEL maintainer="misakacloud"

# app title
ENV TITLE=BiglyBT
ENV APP_COMMAND="/usr/local/biglybt/biglybt"

RUN \
    echo "**** add icon ****" && \
    curl -o \
    /usr/share/selkies/www/icon.png \
    https://raw.githubusercontent.com/linuxserver/docker-templates/master/linuxserver.io/img/biglybt-icon.png && \
    echo "**** install packages ****" && \
    apt-get update && \
    apt-get install --no-install-recommends -y \
    wget \
    xz-utils && \
    echo "**** install java ****" && \
    wget https://download.bell-sw.com/java/21.0.9+11/bellsoft-jdk21.0.9+11-linux-amd64-full.deb -O /tmp/jdk.deb && \
    apt-get install -y /tmp/jdk.deb && \
    echo "**** install biglybt ****" && \
    mkdir -p /usr/local && \
    curl -fL -o /tmp/bbt.tar.gz \
    https://github.com/BiglySoftware/BiglyBT/releases/download/v3.8.0.2/Github_BiglyBT_unix.tar.gz && \
    tar -xf /tmp/bbt.tar.gz -C /usr/local/ && \
    ln -s /usr/local/biglybt/biglybt /usr/bin/biglybt && \
    printf "Linuxserver.io version: ${VERSION}\nBuild-date: ${BUILD_DATE}" > /build_version && \
    echo "**** cleanup ****" && \
    rm -rf \
    /tmp/* \
    /var/lib/apt/lists/* \
    /var/tmp/*



VOLUME /config