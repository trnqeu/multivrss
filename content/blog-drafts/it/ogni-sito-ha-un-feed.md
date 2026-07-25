---
title: "Ogni sito ha ancora un feed — basta chiederlo."
category: "GUIDA"
date: "18 JUN 2026"
lang: "en · it"
featured: true
excerpt: "Google News, Substack, Reddit, YouTube, GitHub releases. Una mappa degli endpoint RSS nascosti nel web moderno e come trasformarli in un'iscrizione con un clic."
---

Il web aperto non ha mai smesso di avere i feed. Ci siamo semplicemente dimenticati di cercarlo.

## I soliti noti

**Substack** pubblica un feed all'indirizzo `https://autore.substack.com/feed`. Nessuna impostazione da attivare, nessun account richiesto.

**I canali YouTube** espongono un feed Atom su `https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID`. Trova il channel ID nel sorgente della pagina o nell'URL.

**Reddit** aggiunge `.rss` a qualsiasi subreddit o pagina utente: `https://reddit.com/r/programming.rss`.

**Le release di GitHub** hanno un feed su `https://github.com/USER/REPO/releases.atom`. Funziona con qualsiasi repository pubblico.

**I podcast** sono RSS per natura — copia l'URL del feed dall'app di podcast che usi.

## Trovare i feed nascosti

Quando un sito non pubblicizza il suo feed, cerca nel `<head>` dell'HTML:

```html
<link rel="alternate" type="application/rss+xml" href="/feed.xml" />
```

Oppure prova ad aggiungere `/feed`, `/rss`, `/atom.xml`, `/feed.xml` al dominio e vedi cosa risponde.

La maggior parte dei siti WordPress, Ghost e Hugo risponde a uno di questi percorsi. Le pubblicazioni Medium rispondono su `https://medium.com/feed/NOME-PUBBLICAZIONE`.

## Quando non c'è davvero nessun feed

Usa un servizio che converte una pagina in un feed — oppure chiedi a MultivRSS di monitorarla per te (in arrivo).

Il punto è: l'infrastruttura non è mai scomparsa. RSS è vivo, ha solo smesso di fare rumore.
