# Self-Hosting MultivRSS

A guide to running your own long-lived MultivRSS instance — for personal use, not just to hack on the code. If you only want to run the app briefly to explore the codebase, the shorter [Running locally section in the README](./README.md#running-locally) is enough; this guide goes further (OAuth app registration, running the background worker, exposing the app to the internet, updates).

There is currently no all-in-one `docker compose up` that starts the app itself — `app` runs as a plain Node process outside Docker, with Postgres and Redis in containers. That's a known gap, tracked in the [Roadmap](./ROADMAP.md#infrastructure--scaling). Until then, this guide is the accurate path.

## 1. Prerequisites

- Node.js 24+
- Docker (for Postgres and Redis)
- A domain name and a reverse proxy — only if you want the instance reachable from the internet. A purely local instance (`localhost`) skips this entirely.

## 2. Get the code

```bash
git clone git@github.com:trnqeu/multivrss.git
cd multivrss
npm install
```

## 3. Configure the environment

```bash
cp .env.example .env
```

`.env.example` lists every variable with a short comment on where it comes from. A few are worth walking through in more detail:

**GitHub OAuth app** (for "Sign in with GitHub"):
1. [github.com/settings/developers](https://github.com/settings/developers) → "New OAuth App"
2. Homepage URL: `http://localhost:3002` (or your real domain, see step 7)
3. Authorization callback URL: `http://localhost:3002/api/auth/callback/github`
4. Copy the generated Client ID / Client Secret into `GITHUB_ID` / `GITHUB_SECRET`

**Google OAuth app** (for "Sign in with Google"):
1. [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials) → "Create Credentials" → "OAuth client ID" → "Web application"
2. Authorized redirect URI: `http://localhost:3002/api/auth/callback/google`
3. Copy the Client ID / Client Secret into `GOOGLE_ID` / `GOOGLE_SECRET`

Both OAuth providers are optional — email/password sign-in works without either. Leave the corresponding vars blank to disable that provider.

**Resend** (transactional email — password reset, email verification): create an account at [resend.com](https://resend.com), grab an API key from the dashboard, set `RESEND_API_KEY`. Without it, password reset and email verification links won't be sent — registration/login by password still work, but new accounts stay unverified.

**Secrets** (`NEXTAUTH_SECRET`, `CRON_SECRET`, `INTERNAL_SECRET`): generate each with

```bash
openssl rand -base64 32
```

Never reuse the same value across secrets.

## 4. Start Postgres and Redis

```bash
docker-compose up -d
npx prisma migrate deploy
```

This brings up Postgres on `localhost:5435` and Redis on `localhost:6379` (see `docker-compose.yml`), then applies the existing schema.

## 5. Start the app

For trying it out:

```bash
npm run dev
```

Open `http://localhost:3002`.

For running it longer-term, a production build is more efficient (no hot-reload overhead, smaller memory footprint):

```bash
npm run build
npm start
```

## 6. Start the background worker — easy to forget, but required

Feed syncing runs in a **separate process**, not inside the web app:

```bash
npm run worker
```

This runs `src/workers/feed-sync.ts`, which processes the BullMQ job queue and periodically re-syncs feeds in the background. Without it running, feeds you add will sit unsynced — `GET /api/cron/sync` still exists, but it's a manual/backup trigger (bearer-token authenticated with `CRON_SECRET`), not a replacement for the worker. Keep this process running alongside the app (a second terminal, a second systemd unit, a second `pm2` process — whatever fits your setup).

## 7. Expose it to the internet (optional)

If you want the instance reachable outside your own machine/network, put a reverse proxy in front of it with your own domain and a TLS certificate. A minimal Nginx front (TLS via certbot, rate limiting on the auth endpoints, everything proxied to the app):

```nginx
limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location ~ ^/(login|register|forgot-password|reset-password|api/auth) {
        limit_req zone=auth burst=10 nodelay;
        proxy_pass http://127.0.0.1:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Leave the security headers (HSTS, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`) to the app — `next.config.ts` already sets them; adding `add_header` lines in Nginx just produces conflicting duplicates. For a full container-based production setup (Docker Compose topology, health checks, migrations before code swap), see `docker-compose.prod.yml` and the workflows in `.github/workflows/`.

Remember to update `NEXTAUTH_URL` and the OAuth callback URLs (steps 3 above) to your real domain once you have one — mismatched values break OAuth login and session cookies.

## 8. First login

Register a normal account through the app's `/register` page. If `RESEND_API_KEY` is set, you'll need to verify your email before logging in; if it's unset, verification is effectively skipped (no email can be sent).

For a faster local account that skips email verification entirely:

```bash
npx tsx --tsconfig tsconfig.test.json scripts/create-test-users.ts 1 MyPassword1!
```

This talks directly to the database and refuses to run against anything but `localhost`/`127.0.0.1` — safe for local use, not something to run against a real deployment.

## 9. Keeping it updated

```bash
git pull
npm install
npx prisma migrate deploy
npm run build   # if running the production build
```

Restart the app and worker processes after updating.

## 10. Troubleshooting

`GET /api/health` reports the status of both backing services:

```bash
curl http://localhost:3002/api/health
# {"status":"ok","db":"ok","redis":"ok"}
```

A `"degraded"` status with `db` or `redis` not `"ok"` means Postgres or Redis isn't reachable — check `docker-compose ps` and that `DATABASE_URL`/`REDIS_HOST`/`REDIS_PORT` in `.env` match the containers' actual ports.
