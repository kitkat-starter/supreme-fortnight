FROM golang:alpine AS builder
WORKDIR /app
# 装 curl jq
RUN apk --no-cache add --update curl jq

# 获取一下最新的 Release 版本(即 tag_name)
RUN curl -s https://api.github.com/repos/tailscale/tailscale/releases/latest | \
    jq -r '.tag_name' > /app/version

# 构建这个版本的 derper
# https://tailscale.com/kb/1118/custom-derp-servers/
RUN go install tailscale.com/cmd/derper@$(cat version)

FROM alpine
WORKDIR /app
RUN apk add --no-cache --update \
    ca-certificates && \
    rm -rf /var/cache/apk/* && \
    mkdir /app/certs

ENV DERP_DOMAIN your-hostname.com
ENV DERP_CERT_MODE letsencrypt
ENV DERP_CERT_DIR /app/certs
ENV DERP_ADDR :443
ENV DERP_STUN true
ENV DERP_STUN_PORT 3478
ENV DERP_HTTP_PORT 80
ENV DERP_VERIFY_CLIENTS false

COPY --from=builder /go/bin/derper .

CMD /app/derper --hostname=$DERP_DOMAIN \
    --certmode=$DERP_CERT_MODE \
    --certdir=$DERP_CERT_DIR \
    --a=$DERP_ADDR \
    --stun=$DERP_STUN  \
    --stun-port=$DERP_STUN_PORT \
    --http-port=$DERP_HTTP_PORT \
    --verify-clients=$DERP_VERIFY_CLIENTS