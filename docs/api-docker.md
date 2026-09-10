# API Docker deployment

Build from the repository root:

```sh
docker build -f apps/api/Dockerfile -t orderly-api:production .
```

The image uses Node.js 22 and runs as the unprivileged `node` user. Its default
command is `node dist/src/main.js`, matching the existing Nest build output.
Only the API and its workspace dependencies are built. pnpm's legacy deploy
mode creates an isolated production dependency tree without changing workspace
settings. Prisma Client is generated in Linux during the build, including in
the isolated dependency tree. No database connection is needed to build.

Supply configuration at runtime through ECS environment variables and secrets:

- `DATABASE_URL`: reachable PostgreSQL database with the appropriate TLS settings.
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `JWT_REFRESH_TTL_DAYS`: the
  existing authentication configuration.
- `JWT_ACCESS_TTL` and `JWT_REFRESH_TTL`: durations such as `15m` and `7d`;
  the refresh duration must match `JWT_REFRESH_TTL_DAYS` (for example, `7`).
- `WEB_ORIGIN`: the production frontend origin.
- `PORT`: listening port; falls back to `API_PORT`, then `4000`.
- `OPENAI_API_KEY` and `OPENAI_MODEL` if using the existing AI menu feature.

`NODE_ENV=production` is set in the image. Authentication cookies therefore
require HTTPS. Match the ECS container port and load balancer target port to
the runtime listening port. `/api/health` is the existing health endpoint; it
does not query the database on each request. The API connects to PostgreSQL
at startup. The image architecture must match the Fargate task architecture
(for example, build with `--platform linux/amd64` for X86_64 tasks).

Run migrations as a separate one-off task using the same image and override
the container command with:

```json
["prisma", "migrate", "deploy"]
```

The Prisma CLI, schema, and committed migrations are included. The command
runs in `/app` and needs `DATABASE_URL`, database network access, and migration
permissions. It does not seed the database. Wait for a successful task exit
before deploying API tasks that require the new schema. API startup does not
automatically apply migrations. Existing databases need migration history
compatible with the committed migrations.

No `.env` files are sent to Docker. The final image contains production
dependencies, compiled code, the package manifest, schema, and migrations.
No ECS resources or deployment pipeline are provisioned by this change.
