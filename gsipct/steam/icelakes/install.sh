#!/bin/bash
cd /tmp

# 更换镜像源
cat > /etc/apt/sources.list <<EOF
deb http://mirrors.aliyun.com/ubuntu/ bionic main multiverse restricted universe
deb http://mirrors.aliyun.com/ubuntu/ bionic-backports main multiverse restricted universe
deb http://mirrors.aliyun.com/ubuntu/ bionic-proposed main multiverse restricted universe
deb http://mirrors.aliyun.com/ubuntu/ bionic-security main multiverse restricted universe
deb http://mirrors.aliyun.com/ubuntu/ bionic-updates main multiverse restricted universe
deb-src http://mirrors.aliyun.com/ubuntu/ bionic main multiverse restricted universe
deb-src http://mirrors.aliyun.com/ubuntu/ bionic-backports main multiverse restricted universe
deb-src http://mirrors.aliyun.com/ubuntu/ bionic-proposed main multiverse restricted universe
deb-src http://mirrors.aliyun.com/ubuntu/ bionic-security main multiverse restricted universe
deb-src http://mirrors.aliyun.com/ubuntu/ bionic-updates main multiverse restricted universe
EOF

# 更新系统 并安装 SteamCMD
apt update
apt -y --no-install-recommends install curl lib32gcc1 ca-certificates
curl -L -o steamcmd.tar.gz http://media.steampowered.com/installer/steamcmd_linux.tar.gz
mkdir -p /mnt/server/steam
tar -xzvf steamcmd.tar.gz -C /mnt/server/steam
cd /mnt/server/steam
chown -R root:root /mnt

# 安装游戏
export APPID=460300
export HOME=/mnt/server
./steamcmd.sh +@sSteamCmdForcePlatformBitness 64 \
+login anonymous \
+force_install_dir /mnt/server \
+app_update ${APPID} \
+quit

# 游戏特定设置

