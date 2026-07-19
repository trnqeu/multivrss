---
title: Cookie Policy
updated: "2026-07-19"
---

MultivRSS usa un numero ridotto di cookie. Sono tutti **strettamente necessari** al funzionamento del servizio: nessuno è usato per pubblicità, tracciamento o analytics, per cui non mostriamo un banner di consenso ai cookie (i cookie strettamente necessari sono esenti da consenso secondo la direttiva ePrivacy; questa informativa resta comunque dovuta).

## Cookie che impostiamo

| Cookie | Scopo | Scadenza |
|---|---|---|
| `next-auth.session-token` (o `__Secure-next-auth.session-token` in produzione) | Ti mantiene connesso | 30 giorni o al logout |
| `next-auth.csrf-token` | Protegge login e form da cross-site request forgery | Sessione |
| `next-auth.callback-url` | Usato internamente dal flusso di login per riportarti alla pagina giusta | Sessione |
| `default-view` | Ricorda se preferisci la vista front-page o river del feed | 1 anno |

Se usi la Basic Auth su un ambiente di staging, è il browser stesso a memorizzare la credenziale: MultivRSS non imposta un cookie per questo.

## Cookie di terze parti

Nessuno. Sentry (error tracking) e i nostri provider OAuth (Google, GitHub) potrebbero impostare propri cookie durante il redirect di accesso OAuth, regolati dalle loro rispettive cookie policy. MultivRSS non li legge né li controlla.

## Gestione dei cookie

Poiché i nostri cookie sono tutti strettamente necessari, bloccarli comprometterà il login. Puoi comunque cancellare o bloccare i cookie dalle impostazioni del tuo browser in qualsiasi momento; verrai semplicemente disconnesso e ti verrà richiesto di accedere di nuovo alla visita successiva.

Vedi la nostra [Informativa sulla Privacy](/it/privacy) per come trattiamo i dati dietro questi cookie.
