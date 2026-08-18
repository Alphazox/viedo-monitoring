FROM node:22.14-slim AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
COPY . .
# Build-time env vars are baked into the client bundle by `next build` (they
# must be NEXT_PUBLIC_* to be exposed) — pass them through as build args so
# a docker-compose build can override the localhost defaults if needed.
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ARG NEXT_PUBLIC_AI_ENGINE_URL=http://localhost:8001
ARG NEXT_PUBLIC_VIDEO_ENGINE_URL=http://localhost:8002
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_AI_ENGINE_URL=$NEXT_PUBLIC_AI_ENGINE_URL \
    NEXT_PUBLIC_VIDEO_ENGINE_URL=$NEXT_PUBLIC_VIDEO_ENGINE_URL
RUN npm run build

FROM base AS runtime
ENV NODE_ENV=production
RUN groupadd --system app && useradd --system --gid app --no-create-home app
# output: "standalone" (next.config.ts) traces only the production
# dependency subset instead of shipping the full node_modules tree.
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
USER app
EXPOSE 3000
CMD ["node", "server.js"]
