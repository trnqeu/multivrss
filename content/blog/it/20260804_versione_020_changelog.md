---
title: "Multivrss 0.2 vista da vicino"
category: "PRODUCT DESIGN"
date: "05 AUG 2026"
translationSlug: "20260804_version_0_2_0_changelog"
featured: false
author: "Stefano Trinchero"
excerpt: "Nel mio progetto iniziale multivrss.com avrebbe dovuto essere semplice e minimale, ma come può un Product Manager resistere alla tentazione di aggiungere un sacco di features inutili?"
---

Nel mio progetto iniziale MultivRSS avrebbe dovuto essere semplice e minimale, ma come può un Product Manager resistere alla tentazione di aggiungere un sacco di features inutili? A forza di aggiungere cose ho dovuto creare una pagina per cercare di tenere traccia delle modifiche e provare a impormi una qualche disciplina nella pubblicazione degli sviluppi.

## Changelog e tracciamento delle versioni

Qui trovate la pagina con il [changelog](https://multivrss.com/it/changelog), con una descrizione sintetica di tutti i cambiamenti apportati in ogni versione.


## Readability per la lettura in app

La funzionalità di cui sono più orgoglioso è l'integrazione con la libreria [Readability](https://github.com/mozilla/readability) di Mozilla che consente agli utenti di MultivRSS di leggere gli articoli direttamente all'interno della dashboard. 

![Vista di un articolo aperto in Reader Mode dentro MultivRSS](/blog/20260804/readability.png)


E sono ancora più orgoglioso del fatto che da oggi si possano:

- **copiare gli articoli in formato testo** (e magari incollarli dentro al prompt di un modello di linguaggio)
- **scaricare gli articoli in markdown** (e magari inserirli all'interno del vostro *second brain* preferito. E se non avete un *second brain* vi consiglio di partire [da qui](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f))

## Altre novità assortite

- Inizialmente il motore di ricerca interno all'applicativo utilizzava [Meilisearch](https://www.meilisearch.com/): velocissimo, iperperformante ma anche il più classico degli *overkill*. Mi sono accorto che la **ricerca full text di Postgres** era più che sufficiente per cercare tra i *feed* e gli articoli salvati, per cui ho deciso di tornare sui miei passi e rimuovere interamente **Meilisearch**. Se questo progetto avesse degli utenti probabilmente non si sarebbero accorti di nulla
- **Cancellazione dell'account**: se questo progetto avesse degli utenti questi utenti avrebbero ora la possibilità di cancellare il proprio account
- **Progressive Web App**: da Chrome è possibile installare il sito come app e usare la PWA sia su *desktop* che su *,mobile*. Personalmente la uso su entrambi gli ambienti con grande profitto.
- Possibilità di **taggare** gli articoli salvati
- Si può incollare un **link di un canale  YouTube** e seguirlo come fonte
- Vistosi miglioramenti alla pagina dei **feed suggeriti**, nella speranza di aggiornarla regolarmente
- Pagina [**FAQ**](https://multivrss.com/it/faq)
- Integrazione con [Sentry](https://sentry.io/) per il reporting degli errori


Più una serie di altre piccole cose troppo noiose per essere menzionate qui. 