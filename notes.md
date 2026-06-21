## Roadmap

Roadmap e todo list aggiornate in `README.md` — riferirsi a quello.

---

## Soft Launch Checklist

### 1. CI/CD — setup su GitHub (workflow files già scritti, manca la config)

- [ ] Creare Environment `staging` in `Settings → Environments`
  - Deployment branch: `dev`, nessun reviewer
  - Secrets: `SSH_HOST`, `SSH_USER`, `SSH_KEY`
- [ ] Creare Environment `production` in `Settings → Environments`
  - Deployment branch: `main`, reviewer: trnq-eu
  - Secrets: `SSH_HOST`, `SSH_USER`, `SSH_KEY`
- [ ] Branch protection su `main`: require PR + status check `quality-gate` + no bypass
- [ ] Sul server: `docker network create multivrss_internal 2>/dev/null || true`
- [ ] Push su `dev` e verificare che il pipeline giri end-to-end (quality gate → build → deploy staging → health check OK)
- [ ] Verificare `https://staging.multivrss.com/api/health` → `{"status":"ok"}`

### 2. Prisma logging — verificare che non sia attivo in produzione

- [ ] Aprire `src/lib/prisma.ts` e confermare che il verbose logging sia dentro `if (process.env.NODE_ENV !== 'production')`

### 3. Error monitoring — Sentry

- [ ] Creare progetto su sentry.io (tier free, sufficiente)
- [ ] Installare `@sentry/nextjs` e configurare in `next.config.ts`
- [ ] Verificare che gli errori server-side arrivino nella dashboard Sentry
- [ ] Aggiungere `SENTRY_DSN` nelle env vars di staging e production

### 4. Backup Postgres

- [ ] Aggiungere cron sul server per `pg_dump` giornaliero
  ```bash
  # esempio: backup alle 3:00 ogni notte, tieni gli ultimi 7 giorni
  0 3 * * * docker exec multivrss-db pg_dump -U $POSTGRES_USER $POSTGRES_DB | gzip > ~/backups/db_$(date +\%Y\%m\%d).sql.gz
  0 3 * * * find ~/backups -name "db_*.sql.gz" -mtime +7 -delete
  ```
- [ ] Testare il restore da backup su staging prima del lancio

### 5. Soft Launch

- [ ] Deploy su production (`dev → main` PR, approva il workflow)
- [ ] Verificare `https://multivrss.com/api/health` → `{"status":"ok"}`
- [ ] Invitare i primi utenti selezionati

## Context hub
Esempio: Use the CLI command chub to get the latest Next js 16 documentation and create a skill to reuse this knowledge. Run 'chub help' to understand how it works

## Adminer
```
docker compose -f docker-compose.prod.yml --profile tools up -d adminer

ssh -L 9000:127.0.0.1:8082 joao

http://localhost:9000/

docker compose -f docker-compose.prod.yml stop adminer

```

## Feeds list
{
  "TECH": [
    {
      "name": "Hacker News",
      "url": "https://news.ycombinator.com/rss"
    },
    {
      "name": "Simon Willison's Weblog",
      "url": "https://simonwillison.net/atom/entries/"
    },
    {
      "name": "NYT > Technology",
      "url": "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml"
    }
  ],
  "NEWS": [
    {
      "name": "NYT > World News",
      "url": "https://rss.nytimes.com/services/xml/rss/nyt/World.xml"
    },
    {
      "name": "Repubblica.it",
      "url": "https://www.repubblica.it/rss/homepage/rss2.0.xml"
    },
    {
      "name": "Adnkronos - ultimoratop",
      "url": "https://www.adnkronos.com/rss/ultimora"
    },
    {
      "name": "The Guardian",
      "url": "https://www.theguardian.com/world/rss"
    }
  ],
  "SPORT": [
    {
      "name": "NYT > Sports > Baseball",
      "url": "https://rss.nytimes.com/services/xml/rss/nyt/Baseball.xml"
    },
    {
      "name": "NYT > Sports > N.F.L.",
      "url": "https://rss.nytimes.com/services/xml/rss/nyt/ProFootball.xml"
    },
    {
      "name": "NYT > Sports > College Football",
      "url": "https://rss.nytimes.com/services/xml/rss/nyt/CollegeFootball.xml"
    },
    {
      "name": "CBS Sports Headlines",
      "url": "https://www.cbssports.com/rss/headlines/"
    },
    {
      "name": "MLB News",
      "url": "https://www.mlb.com/feeds/news/rss.xml"
    }
  ]
}