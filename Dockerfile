FROM oven/bun:latest AS base

WORKDIR /usr/src/app

COPY tsconfig.json ./
COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

FROM base AS build
COPY . .
RUN bun run build

FROM oven/bun:alpine AS final

WORKDIR /usr/src/app

COPY --from=build /usr/src/app/.output ./.output

EXPOSE 3000

CMD [ "bun", ".output/server/index.mjs" ]
