FROM golang:alpine AS go-build

RUN apk --no-cache add --update git upx
RUN git clone https://github.com/octeep/wireproxy.git
RUN cd ./wireproxy
RUN CGO_ENABLED=0 go build -ldflags "-s -w" -o wireproxy
RUN upx wireproxy


FROM alpine:latest

COPY --from=go-build /go/wireproxy/wireproxy /usr/bin/

ENTRYPOINT [ "/usr/bin/wireproxy", "/etc/wireproxy/config" ]
