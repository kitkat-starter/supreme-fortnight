# ----------------------------------
# Pterodactyl Steam Game Dockerfile
# Game: Common FC
# Minimum Panel Version: 0.7.0
# ----------------------------------
FROM fedora:latest

# apt
RUN dnf in -y \
    glibc.i686 libstdc++.i686 \
    glibc libstdc++ && \
    dnf clean all && \
    rm -rf /var/cache/dnf && \
    # 最后 添加用户
    useradd -d /home/container -m container

USER container
ENV  USER container
ENV  HOME /home/container

WORKDIR /home/container

COPY ./entrypoint.sh /entrypoint.sh

CMD ["/bin/bash", "/entrypoint.sh"]