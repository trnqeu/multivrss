# Production Launch Plan

Step-by-step checklist to go live on `multivrss.com`.

## Blockers — must be done before launch

| Item | File / location |
|------|----------------|
| Security headers (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy) | Nginx config |
| SSRF guard for `resolvePageTitle` | `src/app/actions.ts` |
| Password reset token via POST body (not URL param) | `src/app/actions.ts` |
| Nginx rate limiting on login / auth / API endpoints | Nginx config |

Nice-to-have before launch (non-blocking):

- Sentry error tracking
- Database backups

---

## Phase 0 — Security fixes

Resolve all four blockers above. See [deploy-strategy.md](./deploy-strategy.md) for context on Nginx config patterns.

---

## Phase 1 — Server provisioning

If not already done:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

git clone https://github.com/trnq-eu/multivrss.git ~/multivrss
```

Production can run on the same server as staging (different project name `multivrss-prod`, different port `3001`).

---

## Phase 2 — DNS

Add A records pointing to the server IP:

```
multivrss.com     A  <server-ip>
www.multivrss.com A  <server-ip>
```

Do this early — propagation can take up to 24h.

---

## Phase 3 — SSL certificate

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d multivrss.com -d www.multivrss.com
```

Certbot edits the Nginx config automatically and installs a renewal cron.

---

## Phase 4 — Nginx config

Create `/etc/nginx/sites-available/multivrss.com`:

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

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location ~ ^/(login|register|forgot-password|reset-password|api/auth) {
        limit_req zone=auth burst=10 nodelay;
        proxy_pass http://127.0.0.1:3001;
        include /etc/nginx/proxy_params;
    }

    location / {
        proxy_pass http://127.0.0.1:3001;
        include /etc/nginx/proxy_params;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/multivrss.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## Phase 5 — Production env file

Create `~/multivrss/.env.production` on the server:

```env
DATABASE_URL=postgresql://USER:PASS@db:5432/multivrss?schema=public
MEILI_HOST=http://meilisearch:7700
MEILI_MASTER_KEY=<strong-random>
REDIS_URL=redis://redis:6379
NEXTAUTH_URL=https://multivrss.com
NEXTAUTH_SECRET=<strong-random>
GITHUB_ID=<prod-oauth-id>
GITHUB_SECRET=<prod-oauth-secret>
GOOGLE_ID=<prod-oauth-id>
GOOGLE_SECRET=<prod-oauth-secret>
CRON_SECRET=<strong-random>
RESEND_API_KEY=<key>
NODE_ENV=production
POSTGRES_USER=USER
POSTGRES_PASSWORD=PASS
POSTGRES_DB=multivrss
APP_PORT=3001
```

`NEXTAUTH_URL` must be `https://multivrss.com` — wrong value breaks OAuth callbacks and session cookies.

---

## Phase 6 — GitHub secrets for `production` environment

In **GitHub → Settings → Environments → production**:

| Secret | Value |
|--------|-------|
| `SSH_HOST` | production server IP |
| `SSH_USER` | deploy user |
| `SSH_KEY` | ed25519 private key |

Set a required reviewer on the environment (manual approval gate before deploy job runs).

---

## Phase 7 — OAuth redirect URIs

Add to GitHub and Google OAuth app consoles:

```
https://multivrss.com/api/auth/callback/github
https://multivrss.com/api/auth/callback/google
```

Option A: add production URIs to the existing staging OAuth apps (simpler).
Option B: create separate production OAuth apps (cleaner separation).

---

## Phase 8 — First production deploy

```bash
git checkout main
git merge dev
git push origin main
```

The `deploy-production.yml` workflow pauses at the `deploy` job and waits for manual approval in GitHub Actions. After approving:

1. Syncs `docker-compose.prod.yml` from `main`
2. Pulls new images from GHCR
3. Runs `prisma migrate deploy` (creates schema from scratch on a fresh DB)
4. Starts all 5 services
5. Health-checks `http://localhost:3001/api/health` — must return `{ status: "ok" }`

---

## Phase 9 — Post-launch validation

```bash
# All containers running
docker compose -f docker-compose.prod.yml --project-name multivrss-prod ps

# Health endpoint
curl https://multivrss.com/api/health

# Worker processing jobs
docker compose -f docker-compose.prod.yml --project-name multivrss-prod logs worker --tail=50

# SSL and security headers
curl -I https://multivrss.com
```

Manual checks in browser:
- Register new account (email verification flow)
- OAuth login (GitHub + Google)
- Add a feed, trigger sync, verify items appear
- Forgot-password flow
- Dark/light mode toggle persists across sessions

---

## Phase 10 — Database backups (week 1)

Add to server crontab (`crontab -e`):

```bash
# Daily pg_dump at 3am, keep last 7
0 3 * * * docker exec multivrss-prod-db-1 pg_dump -U $POSTGRES_USER $POSTGRES_DB | gzip > ~/backups/multivrss-$(date +\%Y\%m\%d).sql.gz
0 4 * * * find ~/backups/ -name "*.sql.gz" -mtime +7 -delete
```

---

## Status at a glance

| Item | Status |
|------|--------|
| Staging pipeline end-to-end | done |
| `docker-compose.prod.yml` | done |
| GitHub `production` environment | done |
| Security headers (Nginx) | **todo** |
| SSRF guard (`resolvePageTitle`) | **todo** |
| Password reset token in POST body | **todo** |
| Nginx rate limiting | **todo** |
| DNS + SSL | **todo** |
| `.env.production` on server | **todo** |
| OAuth redirect URIs for prod | **todo** |
| Sentry | post-launch |
| CSP nonce | post-launch |
| Database backups | post-launch day 1 |
