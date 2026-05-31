## Roadmap

Roadmap e todo list aggiornate in `README.md` — riferirsi a quello.

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