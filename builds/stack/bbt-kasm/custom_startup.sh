#!/bin/bash
set -e

DIST_DIR="/opt/biglybt-dist"
INSTALL_DIR="$HOME/.bbt-install"
DESKTOP_FILE="$HOME/Desktop/biglybt.desktop"

# 1. 版本检测
NEED_INSTALL=false
if [ ! -d "$INSTALL_DIR" ] || [ ! -f "$INSTALL_DIR/VERSION" ]; then
    echo "[BiglyBT] 未检测到安装，执行首次安装..."
    NEED_INSTALL=true
elif ! diff -q "$DIST_DIR/VERSION" "$INSTALL_DIR/VERSION" > /dev/null 2>&1; then
    echo "[BiglyBT] 检测到版本变更，执行更新..."
    NEED_INSTALL=true
fi

# 2. 安装/更新
if [ "$NEED_INSTALL" = true ]; then
    echo "[BiglyBT] 正在同步文件..."
    rsync -a "$DIST_DIR/biglybt/" "$INSTALL_DIR/"
    cp "$DIST_DIR/VERSION" "$INSTALL_DIR/VERSION"
    echo "[BiglyBT] 安装/更新完成"
fi

# 3. 确保桌面快捷方式存在
mkdir -p "$HOME/Desktop"
cat > "$DESKTOP_FILE" << 'DESKTOP'
[Desktop Entry]
Type=Application
Name=BiglyBT
Exec=$HOME/.bbt-install/biglybt
Icon=$HOME/.bbt-install/biglybt.png
Terminal=false
Categories=Network;P2P;
DESKTOP
# 替换 $HOME 为实际路径
sed -i "s|\$HOME|$HOME|g" "$DESKTOP_FILE"
chmod +x "$DESKTOP_FILE"

# 4. 等待桌面就绪并启动
/usr/bin/desktop_ready && "$INSTALL_DIR/biglybt" &
