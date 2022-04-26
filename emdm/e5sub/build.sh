#!/bin/bash
set -ex
git clone https://github.com/iyear/E5SubBot.git
cd E5SubBot
CGO_ENABLED=0 go build -ldflags "-s -w" -o E5SubBot
upx E5SubBot
