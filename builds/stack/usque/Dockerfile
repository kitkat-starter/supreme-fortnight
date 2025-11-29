FROM golang:alpine AS builder

RUN apk update && apk add --no-cache git
WORKDIR /app

RUN git clone https://github.com/Diniboy1123/usque.git
WORKDIR /app/usque

RUN go build -o usque -ldflags="-s -w" .

# scratch won't be enough, because we need a cert store
FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/usque/usque /bin/usque

ENTRYPOINT ["/bin/usque"]