#!/bin/bash -ex
set -ex
echo "接下来构建 aria2 本体!"

git config --global http.sslVerify false
# 下载源码与打补丁
ARIA2_VER=1.37.0
# wget https://github.com/aria2/aria2/archive/refs/tags/release-${ARIA2_VER}.zip
GIT_CURL_VERBOSE=1 GIT_TRACE=1 git clone https://github.com/chisaato/aria2/
cd aria2
git checkout release-$ARIA2_VER
