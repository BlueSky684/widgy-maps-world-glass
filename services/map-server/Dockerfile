FROM node:24-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY . .
RUN node tools/build-map-cache.mjs
USER node
EXPOSE 8080
CMD ["node", "services/map-server/server.mjs"]
