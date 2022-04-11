#!/bin/bash
set -ex
git clone https://github.com/octeep/wireproxy
cd ./wireproxy
CGO_ENABLED=0 go build -ldflags "-s -w" -o wireproxy ./cmd/wireproxy/main.go
upx wireproxy
