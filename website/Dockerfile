FROM --platform=linux/amd64 node:22-slim

WORKDIR /app

COPY ./dist /app/dist
COPY ./public /app/public

ENV PORT=8041

EXPOSE $PORT

CMD ["node", "./dist/rsc/index.js"]
