---
title: "Self-host MultivRSS with Docker in ten minutes."
category: "SELF-HOST"
date: "14 MAY 2026"
readTime: "8 MIN"
excerpt: "A step-by-step guide to running MultivRSS on your own server using Docker Compose."
---

MultivRSS is open source and designed to run on any server with Docker installed. This guide takes you from zero to a working instance in under ten minutes.

## Prerequisites

- A server (VPS, home server, Raspberry Pi) with Docker and Docker Compose installed
- A domain name pointed at your server (or a local hostname)
- 512 MB of free RAM

## 1. Clone the repository

```bash
git clone https://github.com/trnq-eu/multivrss.git
cd multivrss
```

## 2. Create your environment file

```bash
cp .env.example .env.production
```

Edit `.env.production` with your values:

```env
DATABASE_URL=postgresql://user:password@db:5432/multivrss
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-here
MEILI_MASTER_KEY=your-meilisearch-key
```

Generate a secret with `openssl rand -base64 32`.

## 3. Start the stack

```bash
docker compose -f docker-compose.prod.yml up -d
```

This starts Postgres, Meilisearch, and the Next.js app. The first run pulls images and runs database migrations automatically.

## 4. Put Nginx in front

The app listens on `127.0.0.1:3001`. Point Nginx at it and add a TLS certificate with Certbot:

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
    }
}
```

## 5. Set up the cron sync

RSS feeds need periodic syncing. Add a cron job to call the sync endpoint every 15 minutes:

```bash
*/15 * * * * curl -s -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.com/api/cron/sync
```

That's it. Your instance is live.
