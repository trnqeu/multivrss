---
title: "Multivrss 1.0, ora open source"
category: "PRODUCT DESIGN"
date: "17 SET 2026"
translationSlug: "20260917_open_source_en"
featured: true
author: "Stefano Trinchero"
excerpt: "Tra la 0.2 e oggi, MultivRSS è diventato un prodotto vero. Quindi la chiamo 1.0, e metto il codice all'aperto."
---

*BOZZA, non ancora pubblicata. Rivedi, riscrivi, poi sposta in content/blog/it/ (e la controparte inglese in content/blog/en/) quando è pronta.*

Tra la versione 0.2 e oggi, MultivRSS è diventato, senza troppo clamore, un prodotto di cui mi fido abbastanza da chiamarlo finito, o almeno "finito abbastanza da smettere di chiamarlo beta." Quindi oggi porto la versione a 1.0, e faccio l'altra cosa che avevo rimandato: rendo pubblico il codice.

## Perché open source

Se hai letto il [manifesto](https://multivrss.com/it/blog/20260725_perche-internet-mi-odia), sai già perché MultivRSS esiste. Questo è il seguito pratico: il codice è ora pubblico su [GitHub](https://github.com/trnqeu/multivrss), con licenza MIT.

Per essere chiaro su cosa significa e cosa non significa: non sto cercando contributor, e non accetto Pull Request esterne. Non perché non mi fidi di nessuno con il codice, ma perché rivedere e mantenere le modifiche di qualcun altro sopra un progetto solo mio non è un lavoro che ho tempo di sostenere in questo momento. Le segnalazioni di bug sono invece davvero benvenute, e se vuoi far girare una tua istanza invece di usare quella hosted, è esattamente per questo che il codice è pubblico. C'è una [guida al self-hosting](https://github.com/trnqeu/multivrss/blob/main/SELF_HOSTING.md) apposta.

## Le novità dalla 0.2

Un po' di cose sono arrivate nel percorso verso la 1.0:

- **La Modalità Lettura funziona ora anche sui link salvati**, non solo sugli articoli dai feed. Salvi qualsiasi cosa da qualsiasi posto, e la leggi dentro l'app.
- **Importa ed esporta i link salvati come CSV**, compatibile con le esportazioni di Instapaper e Pocket, così lasciare quegli strumenti non significa ripartire da zero.
- **La pagina Salvati è stata ridisegnata** e ora si aggiorna davvero quando ci torni, invece di restare silenziosamente non aggiornata.
- **La Front Page** mostra ora tutte le categorie e un breve estratto per ogni articolo, con un conteggio dei progressi della giornata.
- **Digest**, un piccolo esperimento sul blog: salva un articolo o iscriviti a un feed che cito in un post, senza uscire dalla pagina.

C'è il [changelog](https://multivrss.com/it/changelog) completo se vuoi la lista intera.

Fino alla prossima.
