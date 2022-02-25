#!/bin/bash
COMMON_PHP_EXTS_DEPS=(
# pdo_pgsql
libpq5
# redis
"^libzstd[0-9]*$"
# mongodb
"^libsnappy[0-9]+(v[0-9]+)?$"
"^libicu[0-9]+$"
# imagick
"^libmagickwand-6.q16-[0-9]+$"
"^libmagickcore-6.q16-[0-9]+-extra$"
# gd
"libfreetype6"
"libjpeg62-turbo"
"^libpng[0-9]+-[0-9]+$ libxpm4"
"^libwebp[0-9]+$"
# zip
"^libzip[0-9]$"
# smbclient
libsmbclient
# imap
libc-client2007e
# intl
"^libicu[0-9]+$"
# xsl
"libxslt1\.1$"
)

echo "${COMMON_PHP_EXTS_DEPS[@]}"