FROM node:24-bookworm-slim
ENV NODE_ENV=production PORT=8080
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY api/night-map.js ./api/night-map.js
COPY lib ./lib
COPY assets/earth ./assets/earth
COPY tools/build-map-cache.mjs ./tools/build-map-cache.mjs
COPY services/azure-map/server.mjs ./services/azure-map/server.mjs
RUN node tools/build-map-cache.mjs
USER node
EXPOSE 8080
CMD ["node", "services/azure-map/server.mjs"]
