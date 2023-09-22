#!/bin/ash

# 检测时区变量,没有就使用 UTC
TZ=${TZ:-UTC}
export TZ

# 取得外网 IP
INTERNAL_IP=$(ip route get 1 | awk '{print $NF;exit}')
export INTERNAL_IP

# 进入容器工作目录
cd /home/container || exit 1

# 输出 Java 版本
# printf "\033[1m\033[33mcontainer@P73R~ \033[0mjava -version\n"
# java -version

# Convert all of the "{{VARIABLE}}" parts of the command into the expected shell
# variable format of "${VARIABLE}" before evaluating the string and automatically
# replacing the values.
PARSED=$(echo "${STARTUP}" | sed -e 's/{{/${/g' -e 's/}}/}/g' | eval echo "$(cat -)")

# 输出启动命令是什么
printf "\033[1m\033[33mcontainer@P73R~ \033[0m%s\n" "$PARSED"
# shellcheck disable=SC2086
exec env ${PARSED}
