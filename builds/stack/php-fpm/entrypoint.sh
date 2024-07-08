#!/bin/sh
# 目录Bug修复
mkdir -p /home/www
# 刷新系统的CA
update-ca-certificates
if [ -z $RUN_AS ];then
    # 空,运行php-fpm
        echo "未指定运行模式,将运行PHP-FPM"
        echo "提示:运行模式可选[FPM|CLI|COMPOSER|RR]"
        php-fpm
else
    case $RUN_AS in
    FPM)
            php-fpm
            ;;
    CLI)
            php $@
            ;;
    COMPOSER)
            composer $@
            ;;
    RR)
            /usr/local/bin/rr $@
            ;;
    *)
            echo "Usage: $name [FPM|CLI|COMPOSER|RR]"
            exit 0
            ;;
    esac
fi

