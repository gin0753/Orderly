# Build from the repository root: docker build -f apps/api/Dockerfile -t orderly-api .
FROM node:22-bookworm-slim AS base
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

FROM base AS build
WORKDIR /workspace
RUN npm install --global pnpm@10.14.0
COPY . .
RUN pnpm --filter api... install --frozen-lockfile
RUN pnpm --filter api exec prisma generate
RUN pnpm --filter api... run build
# Legacy deploy supports this workspace without enabling injected dependencies.
RUN pnpm --filter api deploy --legacy --prod /out/api
# Generate against the isolated production dependency tree, before copying it.
RUN cd /out/api && ./node_modules/.bin/prisma generate

FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /out/api/node_modules ./node_modules
COPY --from=build --chown=node:node /workspace/apps/api/dist ./dist
COPY --from=build --chown=node:node /workspace/apps/api/package.json ./package.json
COPY --from=build --chown=node:node /workspace/apps/api/prisma/schema.prisma ./prisma/schema.prisma
COPY --from=build --chown=node:node /workspace/apps/api/prisma/migrations ./prisma/migrations
ENV PATH="/app/node_modules/.bin:${PATH}"
USER node
EXPOSE 4000
CMD ["node", "dist/src/main.js"]
