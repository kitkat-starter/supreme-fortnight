# 构建辅助脚本

所有用于在扩展安装阶段的脚本命名为

- `install-${PHP_VER}.sh`
- `install-common.sh`

所有用于在准备运行时环境阶段的脚本命名为

- `runtime-${PHP_VER}.sh`
- `runtime-common.sh`

一般来说,你应该先运行 `install-common.sh` 脚本  
然后再运行针对具体版本的 `install-${PHP_VER}.sh` 脚本.
