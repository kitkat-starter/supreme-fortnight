#!/bin/bash
# 首先是下载
curl -sSLf \
-o /usr/local/bin/install-php-extensions \
https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions
chmod +x /usr/local/bin/install-php-extensions

# 下载 RoadRunner
curl https://api.github.com/repos/spiral/roadrunner-binary/releases/latest \
    | grep browser_download_url \
    | grep -v protoc \
    | grep linux \
    | grep amd64 \
    | cut -d '"' -f 4 \
    | wget -i - -O /roadrunner.tar.gz
mkdir -p /roadrunner
tar xvzf --strip-components=1 /roadrunner.tar.gz -C /roadrunner
mv /roadrunner/rr /usr/local/bin/rr
rm -rf /roadrunner.tar.gz /roadrunner

# 换源
# sed -i 's/deb.debian.org/mirrors.cloud.tencent.com/g' /etc/apt/sources.list
# sed -i 's/security.debian.org/mirrors.cloud.tencent.com/g' /etc/apt/sources.list

# 装各种扩展的依赖
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
# libsmbclient
# imap
libc-client2007e
# intl
"^libicu[0-9]+$"
# xsl
"libxslt1\.1$"
)
COMMON_PAKS=(
unzip
wget
openssl
git
)
# 记得 这里是非交互式
export DEBIAN_FRONTEND=noninteractive
apt update
apt install -y --no-install-recommends ${COMMON_PAKS[@]} ${COMMON_PHP_EXTS_DEPS[@]}

# 装一下 composer
install-php-extensions @composer

# 添加用户
addgroup --gid 1000 www
adduser --disabled-password --gecos "" --uid 1000 --gid 1000 www

# 最后清理
rm /usr/local/bin/install-php-extensions
rm -rf /var/lib/{apt,dpkg,cache,log}/