FROM node:20-alpine AS deps
WORKDIR /workspace
COPY package.json package-lock.json* ./
COPY backend/apps/api/package.json backend/apps/api/package.json
COPY backend/packages backend/packages
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run prisma:generate
RUN npm run build:packages
RUN npm run build --workspace=backend/apps/api

FROM node:20-alpine AS runtime
WORKDIR /workspace
ENV NODE_ENV=production
# ffmpeg provides ffprobe, used by CameraConnectionCheckService (Phase 4) for
# point-in-time RTSP/ONVIF reachability checks. openssl is required for
# Prisma's runtime engine to correctly auto-detect the OpenSSL 3 musl target
# (without the CLI present it silently defaults to the openssl-1.1 engine,
# which fails to load since Alpine no longer ships libssl.so.1.1).
RUN apk add --no-cache ffmpeg openssl
COPY --from=build /workspace/node_modules ./node_modules
COPY --from=build /workspace/backend/apps/api/dist ./backend/apps/api/dist
COPY --from=build /workspace/backend/apps/api/package.json ./backend/apps/api/package.json
COPY --from=build /workspace/backend/packages ./backend/packages
# npm's workspace resolution nests some deps (e.g. @fastify/static) under the
# workspace's own node_modules instead of hoisting to the root when peer
# dependency ranges conflict across packages — must be copied separately.
COPY --from=build /workspace/backend/apps/api/node_modules ./backend/apps/api/node_modules
# @nestjs/platform-fastify (hoisted to root node_modules) requires()
# @fastify/static by bare specifier, so Node's resolution walks up from
# *its own* location and never sees the copy nested above — link it into
# root node_modules too so that lookup succeeds.
RUN ln -s /workspace/backend/apps/api/node_modules/@fastify/static /workspace/node_modules/@fastify/static
EXPOSE 3000
CMD ["node", "backend/apps/api/dist/main.js"]
