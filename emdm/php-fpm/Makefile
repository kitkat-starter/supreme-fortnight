NAME_CN = ccr.ccs.tencentyun.com/${NAME}
NAME =${NAME}

# .PHONY: build start push

build:  build-php-fpm-73 build-php-fpm-74
tag: tag-php-fpm-73 tag-php-fpm-74
push-cn: push-cn-php-fpm-73 push-cn-php-fpm-74
push: push-php-fpm-73 push-php-fpm-74

build-php-fpm-73:
        docker build -t ${NAME_CN}:php-fpm-73 --network private -f Dockerfile.php.73 .
build-php-fpm-74:
        docker build -t ${NAME_CN}:php-fpm-74 --network private -f Dockerfile.php.74 .

tag-php-fpm-73:
        docker tag ${NAME_CN}:php-fpm-73 ${NAME}:php-fpm-73
tag-php-fpm-74:
        docker tag ${NAME_CN}:php-fpm-74 ${NAME}:php-fpm-74

push-cn-php-fpm-73:
		docker push ${NAME_CN}:php-fpm-73
push-cn-php-fpm-74:
        docker push ${NAME_CN}:php-fpm-74

push-php-fpm-73:
		docker push ${NAME}:php-fpm-73
push-php-fpm-74:
        docker push ${NAME}:php-fpm-74

all: build tag push-cn push