FROM node:16-alpine

WORKDIR /opt/app/

COPY package.json .
COPY yarn.lock .
COPY tsconfig* .
COPY src ./src
COPY bin ./bin
COPY solana-usage.yml .

RUN yarn --pure-lockfile
RUN yarn build
