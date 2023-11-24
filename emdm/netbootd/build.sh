#!/usr/bin/env bash

set -xe

# build config available ?
if [ ! -f "/build.conf" ]; then
    echo "error: build config not available"
    exit 1
fi

# load build config
source /build.conf

# -------------------------------------------------------------------------------------

# container build ready - attach to interactive bash
# if [ -f "/.buildready" ]; then
#     # just start bash
#     /bin/bash
#     exit 0
# else
#     # create firstrun flag
#     touch /.buildready
# fi

cd /tmp/build/src 

# embedded config available ?
if [ -f /ipxe.conf ]; then
    echo " >> using embedded script"
    IPXE_OPT="EMBED=/ipxe.conf $IPXE_OPT"
fi

mkdir -p /mnt/target

# build all targets
for TARGET in "${BUILD_TARGET[@]}"; do
    # split
    read -ra PARTS <<<"$TARGET"

    # build
    echo " >> building target ${PARTS[0]} as ${PARTS[1]}"

    # build
    # 检测一下是否包含 arm
    # if [ "${PARTS[0]}" ~= "arm" ]; then



    make clean
    make -j$(nproc) $BUILD_OPT ${PARTS[0]} $IPXE_OPT

    # copy binary into bind mount - honor alias
    cp ${PARTS[0]} /mnt/target/${PARTS[1]}
done

