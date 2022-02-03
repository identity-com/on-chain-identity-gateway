FROM node:16-alpine

WORKDIR /opt/app/

# GitHub SSH-Key Injection
# e.g. Provide via
# docker build --build-arg SSH_PRIVATE="$(cat ~/.ssh/id_rsa)"
#ARG SSH_PRIVATE
#RUN test -n "$SSH_PRIVATE"
#RUN mkdir -p ~/.ssh; echo "$SSH_PRIVATE" >> ~/.ssh/id_rsa
#RUN chmod 700 ~/.ssh/id_rsa
#RUN echo -e "Host github.com\n\tStrictHostKeyChecking no\n" >> /etc/ssh/ssh_config
#RUN ssh-keyscan github.com > ~/.ssh/known_hosts
#
## this way we ensure that even without yarn.lock we can proceed
#COPY gatekeeper-api/ ./
#COPY gatekeeper-types /opt/gatekeeper-types
#COPY gatekeeper-serum-lib /opt/gatekeeper-serum-lib

# NPM Token Injection
# e.g. Provide via
# docker build --build-arg NPM_TOKEN="token"
#ARG NPM_TOKEN
#RUN echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > ~/.npmrc

COPY package.json ./
COPY yarn.lock ./
COPY tsconfig* ./
COPY src ./

RUN yarn --frozen-lockfile --ignore-optional --prefer-offline --ignore-platform --no-optional
RUN yarn build

RUN pwd
RUN yarn express:build

EXPOSE 5001

CMD ["yarn", "express:server"]
