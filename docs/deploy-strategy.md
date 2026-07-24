# Deploy Strategy

## Pipeline overview

```
push → dev   →  [Quality Gate] → [Build & Push] → [SSH Deploy] →  staging.multivrss.com  (auto)
push → main  →  [Quality Gate] → [Build & Push] → [SSH Deploy] →  multivrss.com          (manual approval)
PR → dev/main →  [Quality Gate only]                                                       (no deploy)
```

## Stage 1 — Quality Gate (`ci.yml`)

Runs as `workflow_call` from both deploy workflows (no duplication). Steps in order:

| Step | Command | Fails on |
|------|---------|----------|
| Install | `npm ci` | lock file drift |
| Prisma | `npx prisma generate` | schema errors |
| Types | `npx tsc --noEmit` | type errors |
| Lint | `npm run lint` | ESLint violations |
| Tests | `npm run test` | failing Vitest tests |
| Audit | `npm audit --audit-level=critical` | critical CVEs only |

## Stage 2 — Build & Push (GHCR)

Two images are built per deploy, tagged with `${{ github.sha }}`:

| Image tag | Dockerfile target | Used for |
|-----------|-------------------|----------|
| `$SHA-migrator` | `builder` | one-shot Prisma migration container |
| `$SHA` + `:staging` or `:production`/`:latest` | `runner` | actual running app + worker |

Build cache uses GitHub Actions cache (`type=gha`) — layer cache survives between runs.

## Stage 3 — SSH Deploy

Both staging and production run identical scripts, differing only in project name, env file, and health check port.

```
1. git checkout origin/{branch} -- docker-compose.prod.yml   # prevent compose drift
2. save PREV_SHA for rollback
3. docker pull $SHA-migrator + $SHA
4. docker network create multivrss-{env}_internal || true    # idempotent
5. docker run --rm migrator: npx prisma migrate deploy       # before app swap
6. docker compose up -d --remove-orphans --force-recreate    # atomic restart
7. curl /api/health  ×12, every 5s  →  rollback if all fail
8. cleanup old GHCR images (keep last 10)
```

**Rollback:** re-pulls `$PREV_SHA` image and re-runs `docker compose up`. No schema rollback — migrations are forward-only.

### GitHub Environments

| Environment | Trigger | Approval |
|-------------|---------|----------|
| `staging` | push → `dev` | automatic |
| `production` | push → `main` | manual reviewer required |

Secrets (`SSH_HOST`, `SSH_USER`, `SSH_KEY`) are scoped to their environment — repo-level secrets are ignored.

## Stack (`docker-compose.prod.yml`)

```
app          Next.js, port 127.0.0.1:3001:3000
worker       BullMQ feed-sync, same image, command: node dist/worker.js
db           postgres:16-alpine, named volume pgdata
redis        redis:8-alpine, named volume redisdata
```

All services on the `internal` network — nothing exposed to the public internet except the app port bound to loopback (Nginx in front).

## Health check endpoint (`/api/health`)

Returns `{ status: "ok"|"degraded", db, redis }`. Checks both backing services via `Promise.allSettled`. Returns 503 if any service is down. The deploy script gates on `status === "ok"`.

## Port map

| Environment | Internal port | Nginx proxies from |
|-------------|---------------|--------------------|
| Staging | `127.0.0.1:3002:3000` | `staging.multivrss.com:443` |
| Production | `127.0.0.1:3001:3000` | `multivrss.com:443` |

## Database access

Neither Postgres instance is exposed to the public internet. Access is via `docker exec` on the server or through Adminer over an SSH tunnel.

### Option A — psql via docker exec (quick, no setup)

SSH into the server, then:

```bash
# Staging
docker exec -it multivrss-staging-db-1 psql -U $POSTGRES_USER $POSTGRES_DB

# Production
docker exec -it multivrss-prod-db-1 psql -U $POSTGRES_USER $POSTGRES_DB
```

Replace `$POSTGRES_USER` and `$POSTGRES_DB` with the values from the env file (`.env.staging` / `.env.production`).

### Option B — Adminer via SSH tunnel (GUI, browser-based)

Adminer is already defined in `docker-compose.prod.yml` under the `tools` profile. It is not started by default.

**Step 1 — start Adminer on the server:**

```bash
# Staging
docker compose -f docker-compose.prod.yml --project-name multivrss-staging --env-file .env.staging --profile tools up -d adminer

# Production
docker compose -f docker-compose.prod.yml --project-name multivrss-prod --env-file .env.production --profile tools up -d adminer
```

Adminer listens on `127.0.0.1:8082` (loopback only — not reachable from outside).

**Step 2 — open an SSH tunnel from your local machine:**

```bash
ssh -L 8082:localhost:8082 user@<server-ip>
```

**Step 3 — open in browser:**

```
http://localhost:8082
```

Login with:
- System: `PostgreSQL`
- Server: `db`
- Username / Password / Database: values from the env file

**Step 4 — stop Adminer when done:**

```bash
# Staging
docker compose -f docker-compose.prod.yml --project-name multivrss-staging --env-file .env.staging stop adminer

# Production
docker compose -f docker-compose.prod.yml --project-name multivrss-prod --env-file .env.production stop adminer
```

> Adminer has `restart: "no"` — it will not restart automatically after a server reboot, only when explicitly started with `--profile tools`.

### Volume isolation

Staging and production use completely separate named volumes, even on the same physical server:

| | Staging | Production |
|---|---|---|
| DB container | `multivrss-staging-db-1` | `multivrss-prod-db-1` |
| DB volume | `multivrss-staging_pgdata` | `multivrss-prod_pgdata` |
| Env file | `.env.staging` | `.env.production` |

---

## Known pitfalls

- **Network orphan on re-deploy** — if a network was created manually (e.g. `docker network create`), Docker Compose will reject it with `incorrect label`. The deploy script runs `docker network rm multivrss-{env}_internal 2>/dev/null || true` before each deploy to avoid this.
- **SSH secrets are environment-scoped** — updating repo-level secrets has no effect on deploy jobs that use `environment: staging` or `environment: production`. Always update secrets inside the GitHub Environment.
- **Migration order** — the migrator container must run and succeed before `docker compose up`. If the migrator fails, the deploy aborts before the app is replaced.
- **Floating tags** — `:staging`, `:production`, `:latest` are floating and updated on each deploy. The rollback mechanism uses the pinned `$SHA` tag, not the floating one.
