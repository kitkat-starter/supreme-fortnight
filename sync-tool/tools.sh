#!/bin/bash
# wget -c https://github.com/AliyunContainerService/image-syncer/releases/download/v1.5.4/image-syncer-v1.5.4-linux-amd64.tar.gz -O - | tar -xvz image-syncer

curl https://api.github.com/repos/AliyunContainerService/image-syncer/releases/latest \
    | grep browser_download_url \
    | grep linux-amd64 \
    | grep -v md5 \
    | cut -d '"' -f 4 \
    | wget -O image-syncer.tar.gz -i -

tar -xvzf image-syncer.tar.gz image-syncer