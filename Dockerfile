FROM node:14-slim

COPY . .

RUN npm install --production

ENTRYPOINT ["node", "/lib/main.js"]
