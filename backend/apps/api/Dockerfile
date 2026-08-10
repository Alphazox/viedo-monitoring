FROM node:20-alpine AS deps
WORKDIR /workspace
COPY package.json package-lock.json* ./
COPY backend/apps/api/package.json backend/apps/api/package.json
COPY backend/packages backend/packages
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build:packages
RUN npm run build --workspace=backend/apps/api

FROM node:20-alpine AS runtime
WORKDIR /workspace
ENV NODE_ENV=production
# ffmpeg provides ffprobe, used by CameraConnectionCheckService (Phase 4) for
# point-in-time RTSP/ONVIF reachability checks.
RUN apk add --no-cache ffmpeg
COPY --from=build /workspace/node_modules ./node_modules
COPY --from=build /workspace/backend/apps/api/dist ./backend/apps/api/dist
COPY --from=build /workspace/backend/apps/api/package.json ./backend/apps/api/package.json
COPY --from=build /workspace/backend/packages ./backend/packages
EXPOSE 3000
CMD ["node", "backend/apps/api/dist/main.js"]
