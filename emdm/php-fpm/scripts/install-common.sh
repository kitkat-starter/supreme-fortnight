#!/bin/bash
# 首先是下载
curl -sSLf \
-o /usr/local/bin/install-php-extensions \
https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions
chmod +x /usr/local/bin/install-php-extensions

# 换源
# sed -i 's/deb.debian.org/mirrors.cloud.tencent.com/g' /etc/apt/sources.list
# sed -i 's/security.debian.org/mirrors.cloud.tencent.com/g' /etc/apt/sources.list

COMMON_PHP_EXTS=(
# 数据库扩展
mysqli
pgsql
pdo_pgsql
pdo_mysql
redis
mongodb
# 图像处理扩展
imagick
gd
exif
# 数学扩展
gmp
bcmath
# 文件扩展
zip
# smbclient
# 网络/协议扩展
soap
grpc
imap
# 杂项扩展
intl
xsl
# 调试/开发/底层扩展
pcntl
apcu
opcache
xdebug
runkit7-alpha # 这东西从 PECL 安装
)

# 安装扩展
install-php-extensions ${COMMON_PHP_EXTS[@]}

# 缩小扩展大小
PHP_EXTS_DIR=$(php -i | grep extension_dir | grep "php/extensions" | awk -F "=>" '{print $2}' | awk '{$1=$1};1')
STRIP_EXTS=(
grpc
imagick
intl
mongodb
redis
smbclient
runkit7
xdebug
)
# for ext in ${STRIP_EXTS[@]}; do
#     strip --strip-unneeded ${PHP_EXTS_DIR}/${ext}.so
# done
# 全部去除
strip --strip-unneeded ${PHP_EXTS_DIR}/*.so

# 删除自动加载
rm -f /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini
rm -f /usr/local/etc/php/conf.d/docker-php-ext-runkit7.ini
