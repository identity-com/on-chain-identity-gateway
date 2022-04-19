FROM node:16-alpine

WORKDIR /opt/app/

COPY package.json .
COPY yarn.lock .
COPY tsconfig* .
COPY src ./src

# RUN yarn --pure-lockfile
# RUN yarn build

# Add the cron job
RUN crontab -l | { cat; echo "* * * * * /bin/echo test test test"; } | crontab -

# Run the command on container startup
CMD ["/usr/sbin/crond", "-f"]
