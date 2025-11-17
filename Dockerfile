# docker build -t elysia-gateway .

## Build stage
FROM oven/bun AS build

WORKDIR /app

# Cache packages installation
COPY package.json package.json
COPY bun.lock bun.lock

RUN bun install

COPY ./src ./src

ENV NODE_ENV=production

RUN bun build \
	--compile \
	--minify-whitespace \
	--minify-syntax \
	--outfile index \
	src/index.ts

FROM gcr.io/distroless/base

WORKDIR /app

COPY --from=build /app/index index

ENV NODE_ENV=production

CMD ["./index"]

EXPOSE 3000
