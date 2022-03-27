FROM golang:alpine AS go-build
RUN apk --no-cache add --update git upx bash
WORKDIR /context
RUN  --mount=type=bind,target=/context \
    bash /context/build.sh

FROM alpine:latest
COPY --from=go-build /context/wireproxy/wireproxy /usr/bin/
ENTRYPOINT [ "/usr/bin/wireproxy", "/etc/wireproxy/config" ]
