FROM node:24-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --only=production

COPY src/ ./src/

CMD [ "node", "src/index.js" ]
