#!/bin/sh
#
# GNU Autotools template, feel free to customize.
#
which autoreconf >/dev/null && \
autoreconf --install --force --verbose "${PROJECT_DIR:-..}" 2>&1; /bin/sh "${PROJECT_DIR:-..}/configure" \
    --with-libz \
    --with-libcares \
    --with-libexpat \
    --without-libxml2 \
    --without-libgcrypt \
    --with-openssl \
    --without-libnettle \
    --without-gnutls \
    --without-libgmp \
    --with-libssh2 \
    --with-sqlite3 \
    --with-jemalloc \
    --with-ca-bundle='/etc/ssl/certs/ca-certificates.crt' \
    ARIA2_STATIC=yes \
    --disable-shared