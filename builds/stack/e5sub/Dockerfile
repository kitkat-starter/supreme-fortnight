FROM golang:alpine AS go-build
RUN apk --no-cache add --update git upx bash
RUN  --mount=type=bind,target=/context \
    bash /context/build.sh

FROM alpine:latest
COPY --from=go-build /go/E5SubBot/E5SubBot /usr/bin/
WORKDIR /etc/E5SubBot
ENTRYPOINT [ "/usr/bin/E5SubBot" ]
