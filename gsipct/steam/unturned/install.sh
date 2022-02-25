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
export APPID=1110390
export HOME=/mnt/server
./steamcmd.sh +@sSteamCmdForcePlatformBitness 64 \
+login anonymous \
+force_install_dir /mnt/server \
+app_update ${APPID} \
+quit

# 游戏特定设置
mkdir -p /mnt/server/Servers/unturned/Server
echo -e "Port 27015\nMaxplayers 24" > /mnt/server/Servers/unturned/Server/Commands.dat

# 安装Rocketmod
cd $HOME
echo "Downloading RocketMod..."
if [ "${ROCKET_DL_URL}" == "" ]; then
    ROCKET_DL_URL="https://ci.rocketmod.net/job/Rocket.Unturned/lastSuccessfulBuild/artifact/Rocket.Unturned/bin/Release/Rocket.zip"
fi
curl -o Rocket.zip ${ROCKET_DL_URL}
unzip -o -q Rocket.zip
mv /home/container/Scripts/Linux/RocketLauncher.exe /home/container/RocketLauncher.exe

mkdir -p /mnt/server/lib
cp -v linux64/steamclient.so ../lib/steamclient.so

