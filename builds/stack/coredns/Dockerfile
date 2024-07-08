FROM golang:alpine AS builder
RUN apk update && \
    apk add wget curl unzip tar gzip ca-certificates git
WORKDIR /workspace
RUN git clone --depth=1 https://github.com/coredns/coredns
COPY plugin.cfg coredns/plugin.cfg
COPY getsrc.sh coredns/getsrc.sh
ENV CGO_ENABLED=0
RUN cd coredns && \
    go generate && \
    sh ./getsrc.sh && \
    go build

RUN go install -ldflags="-s -w -X main.version=release" github.com/natesales/q@latest


FROM alpine AS runner
RUN apk update && \
    apk add bash curl ca-certificates
COPY --from=builder /workspace/coredns/coredns /coredns
COPY --from=builder /go/bin/q /usr/bin/
ENTRYPOINT [ "/coredns" ]