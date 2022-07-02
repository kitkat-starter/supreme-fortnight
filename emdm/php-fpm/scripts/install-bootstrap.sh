#!/bin/bash
# set -x
SHELL_FOLDER=$(cd "$(dirname "$0")";pwd)
# echo "$SHELL_FOLDER"
PHP_VERSION=$(php -r "echo PHP_VERSION;" | cut -d "." -f 1,2 | cut -c 1,3)
# PHP_VERSION=80
# 根据版本寻找

source "${SHELL_FOLDER}/install-common.sh"

if [[ -f "${SHELL_FOLDER}/install-$PHP_VERSION.sh" ]]; then
    echo "存在对应版本的安装脚本,执行."
    source "${SHELL_FOLDER}/install-$PHP_VERSION.sh"
else
    echo "不存在对应版本的安装脚本,继续下一步"
fi