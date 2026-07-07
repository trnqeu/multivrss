# MultivRSS — Piano Marketing (pre-lancio, budget zero)

> Ultimo aggiornamento: 2026-07-05

## Punto di partenza

MultivRSS è tecnicamente pronto (RSS reader + reading list, ricerca full-text, PWA share target, CSV import/export, sync in background) ma è ancora **alpha, non lanciato**: il badge in nav dice `NODE_multivrss_alpha`, e la Soft Launch Checklist in `notes.md` (setup ambienti CI/CD, Sentry, backup Postgres) non è ancora chiusa — l'ultimo step è "invitare i primi utenti selezionati", non ancora fatto. Budget: zero. Questo piano usa solo leve gratuite: contenuti già scritti, community, rete personale.

---

## 1. Posizionamento e pubblico (ICP)

Nessun target è dichiarato nel codice: va dedotto dal copy già scritto ("Read the web. Skip the noise.", "Reclaim your attention", "no sponsorships, no rankings") e dalla lista feed curata (Hacker News, Simon Willison, Stratechery, Quanta Magazine, Guardian, Reuters).

**Segmento primario (pre-lancio → primi 3 mesi):**
"Lettori forti" stanchi dei feed algoritmici — seguono già blog, newsletter, Substack, HN, ma non necessariamente si definiscono utenti RSS "tecnici". È il pubblico più coerente col copy esistente e il più facile da raggiungere senza budget: si trova già dentro le community giuste (Indie Hackers, HN, Mastodon, newsletter di nicchia).

**Segmento secondario (dopo il lancio pubblico):**
Utenti Pocket / Instapaper / Readwise / Feedly che cercano un'alternativa. Si raggiungono via SEO e content comparativo, non via community diretta — richiede che gli articoli "alternative a X" esistano e vengano indicizzati, quindi ha senso solo dopo qualche mese di blog attivo.

**Messaggi chiave da riusare ovunque** (già validati nel copy del sito, non serve reinventarli):
- Calma contro rumore: "a calm place to read the internet"
- Ownership dei dati: "your reading history is not a feature, it's data"
- Anti dark-pattern: "infinite scroll was invented to keep you on the page longer, not to help you"
- Curatela senza sponsor: "no sponsorships, no rankings"

**Decisione aperta da prendere prima del lancio pubblico:** la sezione "Self-Hosting" nel roadmap è segnata *optional / not yet decided*. Su Show HN e Indie Hackers la domanda "è open source?" arriva quasi sempre nei primi commenti — meglio avere una risposta decisa in anticipo (anche "non ancora, ma è nei piani") che risponderne a braccio.

---

## 2. Fase pre-lancio (ora → invito primi utenti)

Obiettivo: validare con un piccolo gruppo di fiducia prima di aprire a tutti.

- [ ] Chiudere la checklist infra di `notes.md`: ambienti GitHub (`staging`/`production`), Sentry, backup Postgres automatico + test di restore. È un prerequisito tecnico che blocca la data di lancio, non marketing in sé, ma senza questo non si invita nessuno in sicurezza.
- [ ] Aggiungere un modo leggero per raccogliere interesse prima di dare accesso pieno (form email sulla landing o semplicemente un indirizzo a cui scrivere per farsi invitare) — evita di aprire l'iscrizione libera mentre il prodotto è ancora alpha.
- [ ] **Outreach 1:1**: lista di 20-30 persone reali (rete Torino/tech, ex colleghi, chi scrive newsletter o blog che leggi tu stesso) contattate a mano, non con un annuncio generico. Offri onboarding assistito (10 minuti in call o messaggio guidato) — genera feedback di qualità molto più alto di un post pubblico, e i primi utenti soddisfatti sono la fonte più credibile di passaparola.
- [ ] **Building in public**: un thread/post ricorrente (settimanale o a ogni milestone) su X, Bluesky o Mastodon con progressi reali — screenshot, decisioni tecniche, numeri (anche piccoli). Il pubblico indie hacker premia la trasparenza ed è un canale a costo zero che pre-costruisce un'audience per il lancio pubblico.

---

## 3. Lancio pubblico

**Asset da preparare prima del giorno del lancio:**
- Screenshot o gif del prodotto in uso (Front Page, River, ricerca, save-to-reading-list)
- One-liner riusabile: *"MultivRSS: read the web, skip the noise — an RSS reader and reading list in one calm dashboard."*
- FAQ scritta in anticipo sui limiti attuali (max 200 feed/account, retention 90 giorni sugli articoli non salvati) — meglio dichiararli con trasparenza che farseli chiedere nei commenti
- Risposta pronta sulla domanda open source / self-hosting (vedi sopra)

**Canali, stessa finestra temporale (max 1-2 giorni di distanza tra loro per effetto cumulativo):**
- **Show HN** — titolo diretto, non promozionale ("Show HN: MultivRSS, an RSS reader that also keeps your reading list")
- **Product Hunt** — richiede assets pronti (gallery, tagline, primo commento del maker)
- **Indie Hackers** — post di lancio + link al log "building in public" già accumulato nella fase precedente
- **Reddit** — puntare su community di lettura/produttività/minimalismo digitale piuttosto che community RSS strette: pubblico più ampio e più coerente col posizionamento "reclaim your attention" che con "feature RSS tecniche"

---

## 4. Content marketing (canale gratuito che si accumula nel tempo)

Il blog esiste già: 3 post EN/IT (`content/blog/{en,it}/`) — guida pratica sui feed nascosti, manifesto anti-infinite-scroll, data ownership. Due filoni per continuare, entrambi a costo marginale quasi zero:

**Filone pratico/SEO** — contenuto già scritto in `README.md`, va solo impacchettato in post o thread social, uno a settimana:
1. Google News → RSS (trucco URL `/rss`)
2. Ogni Substack ha un feed su `/feed`
3. Reddit: `.rss` su qualunque subreddit
4. Il feed nascosto di YouTube (Atom via channel ID)
5. Medium: `/feed/@username`
6. WordPress: quasi ogni sito ha `/feed`
7. GitHub: feed Atom per release/commit/tag
8. Kill the Newsletter (newsletter → RSS)
9. RSS-Bridge per siti senza feed nativo

Ogni voce è già una bozza pronta all'uso: basta un titolo tipo "Il trucco RSS che nessuno ti dice: [sito]" e il link a MultivRSS in chiusura.

**Filone posizionamento/manifesto** — continua la linea già iniziata (attenzione, non scroll infinito, ownership dei dati). È quello che differenzia MultivRSS da un semplice reader e regge la coerenza col messaggio del sito.

**Filone comparativo (dal mese 2-3, per il segmento secondario)** — articoli tipo "alternativa a Pocket che non perde la tua reading list", pensati per intercettare traffico di ricerca da chi già usa Pocket/Instapaper/Feedly.

Cadenza consigliata: 1 post/settimana nella fase pre-lancio (filone pratico, rapido da produrre), poi alternare con il filone manifesto una volta partito il lancio pubblico.

---

## 5. Community & distribuzione (zero budget)

- **Mastodon / Fediverse** e **Bluesky** — pubblico affine al messaggio anti-algoritmo, molto attivo, nessun costo.
- **Rete italiana** — founder a Torino, copy IT già completo: vale la pena presidiare community italiane (subreddit/community dev italiane, gruppi Telegram indie hacker) in parallelo a quelle internazionali, invece di lanciare solo in inglese.
- **Micro-partnership** con newsletter/blogger di dimensioni simili alla tua (non i grandi nomi della lista feed curata — quelli sono ispirazione, non target di outreach): proponi uno scambio, una menzione in cambio di una citazione nella loro newsletter.

---

## 6. Metriche e cadenza di verifica

**Pre-lancio:** iscritti in lista d'attesa, inviti accettati, feedback qualitativo raccolto dagli utenti invitati a mano.

**Post-lancio:** traffico sul blog, upvote/commenti sui post nelle community, nuove registrazioni per canale (se tracciabile).

**Cadenza:** rassegna leggera settimanale durante la fase di lancio, poi mensile a regime — sostenibile per un founder solo senza team marketing.

---

## 7. Timeline indicativa

| Periodo | Attività |
|---|---|
| Settimane 1-2 | Chiudere checklist infra (Sentry, backup, ambienti CI/CD) + preparare asset di lancio + iniziare outreach 1:1 |
| Settimane 3-4 | Soft launch: primi 20-30 utenti invitati, raccolta feedback, iterazione veloce |
| Settimane 5-6 | Preparazione lancio pubblico: asset finali, decisione su open source/self-hosting, coda di post blog pronti |
| Settimana 7 | Lancio pubblico coordinato: Show HN + Product Hunt + Indie Hackers + social nella stessa finestra |
| Ongoing | Cadenza editoriale settimanale/bisettimanale, presidio community, revisione metriche mensile |

---

## Nota

Non essendo una modifica di codice, il modo migliore per "verificare" questo piano è rileggerlo e correggere priorità, canali o tono in base al tuo giudizio — sei tu a conoscere la rete di contatti reale e il tempo che puoi dedicarci.
