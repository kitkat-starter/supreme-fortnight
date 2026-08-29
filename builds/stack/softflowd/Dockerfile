FROM debian:trixie-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends softflowd && \
    apt-get purge -y --auto-remove && \
    rm -rf /var/lib/apt/lists/*

ENTRYPOINT ["/usr/sbin/softflowd", "-D"]