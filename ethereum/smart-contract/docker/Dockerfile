## Creates a container that runs a local hardhat node with the smart contracts deployed.
##
## This container is used for testing and development purposes.
##
## Usage:
##   docker build -t identity.com/gateway-protocol-hardhat .
##   docker run -it -p 8545:8545 identity.com/gateway-protocol-hardhat

FROM node:16-alpine AS builder

RUN apk add --no-cache python3 py3-pip make g++ git

WORKDIR /usr/src/app
COPY ./package.json .

#
## Install python/pip
#ENV PYTHONUNBUFFERED=1
#RUN apk add --update --no-cache python3 && ln -sf python3 /usr/bin/python
#RUN python3 -m ensurepip
#RUN pip3 install --no-cache --upgrade pip setuptools

#RUN apk add --no-cache --virtual .gyp \
#        git \
#        python \
#        make \
#        g++ \
#    && yarn install --non-interactive --frozen-lockfile \
#    && apk del .gyp

RUN yarn install --non-interactive --frozen-lockfile

COPY . .


RUN yarn build

FROM node:16-alpine

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app .

ENV STAGE=${STAGE:-dev}
ENV INFURA_API_KEY=${INFURA_API_KEY:-}
ENV DEPLOYER_PRIVATE_KEY=${DEPLOYER_PRIVATE_KEY:-}
ENV AUTHORITY_PRIVATE_KEY=${AUTHORITY_PRIVATE_KEY:-}
ENV GATEKEEPER_PRIVATE_KEY=${GATEKEEPER_PRIVATE_KEY:-}

COPY $PWD/docker/entrypoint.sh /usr/local/bin

ENTRYPOINT ["/bin/sh", "/usr/local/bin/entrypoint.sh"]