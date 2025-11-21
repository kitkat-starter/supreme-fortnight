#!/bin/bash
set -e

ARCH=$(uname -m)

if [ "$ARCH" = "aarch64" ]; then
    EXEC_BIN="mihomo-arm64"
elif [ "$ARCH" = "x86_64" ]; then
    # Detect x86-64 level
    LEVEL=$(awk 'BEGIN {
        while (!/flags/) if (getline < "/proc/cpuinfo" != 1) exit 1
        if (/lm/&&/cmov/&&/cx8/&&/fpu/&&/fxsr/&&/mmx/&&/syscall/&&/sse2/) level = 1
        if (level == 1 && /cx16/&&/lahf/&&/popcnt/&&/sse4_1/&&/sse4_2/&&/ssse3/) level = 2
        if (level == 2 && /avx/&&/avx2/&&/bmi1/&&/bmi2/&&/f16c/&&/fma/&&/abm/&&/movbe/&&/xsave/) level = 3
        if (level == 3 && /avx512f/&&/avx512bw/&&/avx512cd/&&/avx512dq/&&/avx512vl/) level = 4
        if (level > 0) { print level; exit }
        print 0
    }')
    
    echo "Detected x86-64-v$LEVEL"
    
    if [ "$LEVEL" -ge 3 ]; then
        EXEC_BIN="mihomo-amd64-v3"
    else
        EXEC_BIN="mihomo-amd64-v2"
    fi
else
    echo "Unsupported architecture: $ARCH"
    exit 1
fi

# Check if binary exists
if ! command -v "$EXEC_BIN" &> /dev/null; then
    echo "Error: Binary $EXEC_BIN not found in PATH"
    exit 1
fi

echo "Starting $EXEC_BIN with args: $@"
exec "$EXEC_BIN" "$@"
