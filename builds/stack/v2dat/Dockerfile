FROM golang:alpine AS builder
RUN apk update && \
    apk add wget curl unzip tar gzip ca-certificates git
RUN mkdir -p /build
WORKDIR /build
RUN git clone https://github.com/urlesistiana/v2dat
RUN cd v2dat && \
    CGO_ENABLED=0 go build -trimpath -ldflags "-s -w -extldflags '-static'" -gcflags=-trimpath=$$GOPATH -asmflags=-trimpath=$$GOPATH -o v2dat
RUN chmod +x v2dat
# 第二阶段,只有二进制文件
# 尝试使用 Scratch 缩小大小
FROM scratch
COPY --from=builder /build/v2dat/v2dat  /
CMD [ "/v2dat" ]