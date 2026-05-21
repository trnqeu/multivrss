## To-do

[ ] Interfaccia di aggiunta dei feed
[ ] Barra di ricerca
[ ] Collapsible categories in the left sidebar (open/close feed sources per category)
[ ] Pagina di consultazione dei feed
[ ] Apertura / Chiusura sidebar
[ ] Integrazione agente
[ ] Database vettoriale 
[ ] REST API: src/app/api/feeds/route.ts
[ ] Salva articoli preferiti
[ ] Chrome extension: detect RSS feeds on the current page and add them to MultivRSS with one click (requires a REST API endpoint — see REST API task above)
[ ] Export feeds as CSV (all feed sources for a user)
[ ] Marketing homepage at / (project presentation, landing page)
[ ] Protect staging.multivrss.com (HTTP basic auth or IP allowlist via Nginx)
[ ] Server hardening: add Fail2ban + rate limiting in Nginx to protect against bots and brute-force attacks (consider Crowdsec or a WAF like ModSecurity as alternatives)
[ ] Onboarding: show curated feed suggestions to new users on first login (seed list available in Feeds list section below)

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