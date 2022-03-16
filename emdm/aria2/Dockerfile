# 第一阶段,用来构建
FROM debian AS build
# 用于开启调试模式
ARG DEBUG_BUILD
ENV DEBUG_BUILD=$DEBUG_BUILD
# 开启代理
ARG PROXY
ENV PROXY_STAGING=$PROXY
RUN --mount=type=bind,target=/context \
    bash /context/scripts/install-packages.sh
RUN --mount=type=bind,target=/context \
    bash /context/scripts/build-deps.sh
RUN --mount=type=bind,target=/context \
    bash /context/scripts/build-aria2.sh

# 第二阶段,把文件给我拿来
FROM alpine AS run
COPY --from=build /usr/local/bin/aria2c /usr/local/bin/aria2