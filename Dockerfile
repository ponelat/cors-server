FROM mhart/alpine-node:12 as base

RUN apk update && \
    apk upgrade && \
    apk add --no-cache git

RUN mkdir /app
WORKDIR /app

# ------- Get the dependencies

FROM base as deps

COPY package.json .
COPY package-lock.json .
RUN NODE_ENV=development npm ci

# ------- SPA Builder image

FROM deps as build

COPY src/ ./src
COPY public/ ./public

RUN NODE_ENV=production npm run build

# ------- Production image

FROM deps

COPY --from=build ./app/build /app/build
COPY index.js .
COPY sigint.js .
COPY swagger.yaml .

ENV NODE_ENV=production
ENV NODE_PORT=80

RUN npm prune --production

EXPOSE 80
CMD ["node", "index.js"]
