FROM node:16-slim

COPY . .

RUN npm install --production

ENTRYPOINT ["node", "/lib/main.js"]
