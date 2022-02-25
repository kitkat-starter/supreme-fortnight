#!/bin/bash
sleep 2

cd /home/container

if [ "${GAME_AUTOUPDATE}" == "1" ]; then
    ./steam/steamcmd.sh +@sSteamCmdForcePlatformBitness 64 +login anonymous +force_install_dir /home/container +app_update 629800 +quit
fi

ulimit -n 2048
export LD_LIBRARY_PATH=$HOME/lib:$LD_LIBRARY_PATH
MODIFIED_STARTUP=$(eval echo $(echo ${STARTUP} | sed -e 's/{{/${/g' -e 's/}}/}/g'))
echo ":/home/container$ ${MODIFIED_STARTUP}"

${MODIFIED_STARTUP}
echo "If there was an error above when trying to stop your server, it can usually be ignored."