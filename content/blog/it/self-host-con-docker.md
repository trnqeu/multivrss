---
title: "Self-host di MultivRSS con Docker in dieci minuti."
category: "SELF-HOST"
date: "14 MAY 2026"
readTime: "8 MIN"
excerpt: "Una guida passo passo per eseguire MultivRSS sul tuo server con Docker Compose."
---

MultivRSS è open source e progettato per girare su qualsiasi server con Docker installato. Questa guida ti porta da zero a un'istanza funzionante in meno di dieci minuti.

## Prerequisiti

- Un server (VPS, server casalingo, Raspberry Pi) con Docker e Docker Compose installati
- Un nome di dominio puntato al tuo server (o un hostname locale)
- 512 MB di RAM libera

## 1. Clona il repository

```bash
git clone https://github.com/trnq-eu/multivrss.git
cd multivrss
```

## 2. Crea il file di ambiente

```bash
cp .env.example .env.production
```

Modifica `.env.production` con i tuoi valori:

```env
DATABASE_URL=postgresql://user:password@db:5432/multivrss
NEXTAUTH_URL=https://tuo-dominio.com
NEXTAUTH_SECRET=il-tuo-secret
MEILI_MASTER_KEY=la-tua-chiave-meilisearch
```

Genera un secret con `openssl rand -base64 32`.

## 3. Avvia lo stack

```bash
docker compose -f docker-compose.prod.yml up -d
```

Questo avvia Postgres, Meilisearch e l'app Next.js. Al primo avvio scarica le immagini ed esegue automaticamente le migrazioni del database.

## 4. Metti Nginx davanti

L'app ascolta su `127.0.0.1:3001`. Punta Nginx verso di essa e aggiungi un certificato TLS con Certbot:

```nginx
server {
    listen 443 ssl;
    server_name tuo-dominio.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
    }
}
```

## 5. Configura il cron di sincronizzazione

I feed RSS devono essere sincronizzati periodicamente. Aggiungi un cron job per chiamare l'endpoint di sync ogni 15 minuti:

```bash
*/15 * * * * curl -s -H "Authorization: Bearer IL_TUO_CRON_SECRET" https://tuo-dominio.com/api/cron/sync
```

Fatto. La tua istanza è online.
