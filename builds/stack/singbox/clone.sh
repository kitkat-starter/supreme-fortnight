#!/bin/bash
mkdir -p /src && cd /src && \
    git clone -b building https://github.com/chisaato/sing-box && \
    cd sing-box && \
    git remote add sekai https://github.com/SagerNet/sing-box.git && \
    git fetch --tags sekai