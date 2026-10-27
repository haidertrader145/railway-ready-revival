# Build stage: install dependencies and build the Nitro server output for Node.
FROM oven/bun:1 AS build
WORKDIR /app

# Browser-side values are embedded at build time (declare as service variables).
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY \
    NITRO_PRESET=node-server

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# Runtime stage: run the standalone Nitro Node server.
FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache curl
COPY --from=build /app/.output ./
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
