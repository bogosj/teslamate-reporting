FROM node:24-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --only=production

RUN apk add --no-cache python3 py3-pip && \
    pip3 install apprise --break-system-packages

COPY src/ ./src/

CMD [ "node", "src/index.js" ]
