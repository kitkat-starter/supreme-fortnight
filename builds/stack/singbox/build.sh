#!/bin/bash
set -x
# 准备源码
mkdir -p /src
cd /src
# 克隆源码
git clone -b building https://github.com/chisaato/sing-box
# 现在进入源码目录
cd sing-box
git remote add sekai https://github.com/SagerNet/sing-box.git
git fetch --tags sekai
VERSION=$(CGO_ENABLED=0 go run ./cmd/internal/read_tag)
echo version=$VERSION > ./version

TAGS="with_quic,with_grpc,with_dhcp,with_wireguard,with_utls,with_acme,with_clash_api,with_v2ray_api,with_gvisor,with_tailscale,with_ccm,with_ocm,with_naive_outbound,with_cloudflared,badlinkname,tfogo_checklinkname0"
go build -o sing-box -v -trimpath -ldflags "-checklinkname=0 -X 'github.com/sagernet/sing-box/constant.Version=${VERSION}' -s -w -buildid=" -tags "${TAGS}" ./cmd/sing-box
