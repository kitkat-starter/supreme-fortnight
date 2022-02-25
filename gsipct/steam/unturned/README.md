# Unturned 未转变者

## 备注

- 在 `entrypoint.sh` 中加入以下代码

  ```
  PORT=$SERVER_PORT
  sed -i "s/Port [0-9]*/Port $[PORT-1]/g" /home/container/Servers/unturned/Server/Commands.dat
  ```

  可以做到单暴露单端口启动游戏
