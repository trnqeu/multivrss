# Handoff — Reader: Front Page & River (redesign)

## Panoramica
Ridisegno delle due viste principali del reader MultivRSS (`/u/<user>`):

- **Front Page** = *Section Fronts*: una pagina "profonda" fatta di mini front page per categoria, con una fascia **FOR YOU** in cima e un pulsante **VIEW ALL** molto evidente in fondo a ogni sezione che porta alla River filtrata su quella categoria.
- **River** = *Ledger*: flusso cronologico denso ma scansionabile, **una riga per item** (fonte a colonna fissa + titolo/preview), con i filtri **FILTER** (letti/non letti) e **CATEGORY** implementati come **due menu a tendina identici** nella barra telemetry.

Entrambe le viste condividono sidebar, top bar e telemetry, e supportano **light e dark mode**.

---

## Cosa contiene questo bundle (⚠️ leggere)
I file in questo pacchetto sono **reference di design realizzate in HTML/CSS/React (Babel in-browser)** — prototipi che mostrano aspetto e comportamento voluti, **non** codice di produzione da copiare così com'è.
Il compito è **ricreare questi design nell'ambiente del vostro codebase reale** (React/Vue/Svelte/…, con i vostri componenti, token e convenzioni). Se non esiste ancora un ambiente, scegliete il framework più adatto e implementate lì.

Trattare valori esatti (hex, spaziature, font, dimensioni) come **specifica**; trattare la struttura React del prototipo come **guida di comportamento**, non come architettura obbligata.

## Fedeltà
**Hi-fi.** Colori, tipografia, spaziature e interazioni sono definitivi. Da ricreare fedelmente con le librerie/pattern del vostro codebase.

---

## Le modifiche richieste (changelog rispetto alla versione staging attuale)
1. **River — rimossa la barra "CATEGORY" a chip cliccabili.** Il filtro per categoria vive ora **solo** nella riga telemetry.
2. **River — `CAT` → `CATEGORY` (per esteso) come menu a tendina.**
3. **River — `FILTER ALL / UNREAD / READ` diventa un menu a tendina** con la **stessa identica UX** del filtro CATEGORY (prima erano tre opzioni scritte per esteso). Il filtro è **funzionante**: filtra il river per stato letto/non letto.
4. **Front Page — rimossa la fascia/masthead con l'intestazione "FRONT PAGE"** (ridondante con la tab già attiva). La pagina ora inizia direttamente dalla fascia **FOR YOU**.
5. **Aggiunto dark mode** (toggle nella top bar, icona ◑ / ☀).

---

## Design tokens

Definiti come CSS custom properties su `:root` (light) e sovrascritti da `body[data-theme="dark"]`.
Le variabili `--fNN` sono l'inchiostro (`--fg`) a diverse opacità — **cambiano tra i due temi** perché in dark l'inchiostro è chiaro.

### Light (default)
```css
--bg:      #f6f3ec;   /* carta */
--fg:      #14110d;   /* quasi-nero caldo */
--tc:      #E2725B;   /* terracotta (accento, invariato nei due temi) */
--f70: rgba(20,17,13,.70);
--f55: rgba(20,17,13,.55);
--f45: rgba(20,17,13,.45);
--f35: rgba(20,17,13,.35);
--f25: rgba(20,17,13,.25);
--f14: rgba(20,17,13,.14);
--f08: rgba(20,17,13,.07);
--tc-soft: rgba(226,114,91,.10);   /* fondo hover/attivo tenue */
```

### Dark (`body[data-theme="dark"]`)
```css
--bg:      #0e0d0b;   /* quasi-nero caldo */
--fg:      #f4f1ea;   /* crema */
--tc:      #E2725B;   /* terracotta (identica) */
--f70: rgba(244,241,234,.72);
--f55: rgba(244,241,234,.55);
--f45: rgba(244,241,234,.42);
--f35: rgba(244,241,234,.32);
--f25: rgba(244,241,234,.20);
--f14: rgba(244,241,234,.14);
--f08: rgba(244,241,234,.07);
--tc-soft: rgba(226,114,91,.15);
```

### Tipografia
- **Mono / UI**: `"JetBrains Mono"` — label, meta, telemetry, pulsanti, contatori. Sempre `text-transform:uppercase` + `letter-spacing` ampio (.08em–.28em).
- **Serif / editoriale**: `"Newsreader"` — titoli, occhielli lead, dek, testo river. Pesi 400/500/600.
- Google Fonts: `JetBrains Mono` (400,500,600,700,800) + `Newsreader` (opsz 6..72; 400,500,600 + italic 400).

Scala tipografica ricorrente (px): 7.5 · 8.5 · 9 · 9.5 · 10 · 10.5 · 11 · 12.5 · 13.5 · 14 · 14.5 · 15 · 21 · 42.

### Bordi & superfici
- Bordi "forti" strutturali: **2px solid var(--fg)** (sidebar, top bar, telemetry, header sezione, ribbon, pulsante View All).
- Hairline interni: **1px solid var(--f08 / --f14)**.
- **Nessun border-radius** in tutta la UI (spigoli vivi). Nessun gradiente.
- Ombre solo sui menu a tendina: `0 14px 34px rgba(0,0,0,.20)`.

---

## Layout globale (app shell)
```
.app  (display:flex; height:100vh; overflow:hidden)
├── .sb        sidebar, larghezza fissa 212px, border-right 2px
└── .mainc     (flex:1; flex-column; min-width:0)
    ├── .top       top bar, height 54px, border-bottom 2px
    ├── .tele      telemetry, border-bottom 2px  (contiene i dropdown in River)
    └── .scroll    (flex:1; overflow-y:auto)  → FrontPage | River
```
Nota: la **sidebar è a tutta altezza**; la top bar/telemetry stanno solo nella colonna contenuto.

---

## Sidebar — spec dettagliata (light + dark)

Vedi `screenshots/01-front-light.png` e `02-front-dark.png` (sidebar visibile in entrambi i temi).
La struttura è identica nei due temi: cambiano solo i token (`--bg`, `--fg`, `--fNN`); **il terracotta resta uguale**.

```
.sb   width:212px; flex-shrink:0; border-right:2px solid var(--fg); background:var(--bg); flex-column
```

**1) Brand** `.sb__brand`
- `padding:18px; border-bottom:2px solid var(--fg); display:flex; align-items:center; gap:11px`
- Logo `img.sb__logo` 28×28px (`assets/multivrss-ico.png`, icosaedro terracotta).
- Wordmark `.sb__name`: testo `multivrss`, 14px / 800 / `letter-spacing:.16em` / uppercase / **color:var(--tc)**.

**2) Nav** `.sb__nav` — `flex:1; padding:18px 14px; display:flex; flex-column; gap:8px; overflow-y:auto` (scrollbar nascosta).
- Label `NAV_ROOT`: classe `.lbl` (9px/800/.2em/uppercase) colore `--f35`.
- Voci principali `.nvi` (bottoni full-width, `text-align:left`): `display:flex; gap:9px; font:11px/700; letter-spacing:.1em; uppercase; color:var(--fg); padding:3px 4px`.
  - `◈ ALL FEEDS` — attiva (`.on`, color `--tc`) quando `view==='river' && cat==='ALL'`.
  - `▢ SAVED` + contatore `.nvi__c` (`04`, 9px, `--f35`, `margin-left:auto`).
  - `◷ SUGGESTED`.
  - Hover: `color:var(--tc)`.
- Label `CATEGORIES`: `.lbl` `--f35`, `margin-top:10px`.
- Righe categoria `.sbc` (bottoni full-width): `display:flex; gap:8px; padding:6px 4px; border-top:1px solid var(--f08)`.
  - `.sbc__n` nome categoria (es. `CULTURE`) 10.5px/700/.13em, color `--f55`.
  - `.sbc__c` contatore totale feed (es. `42`, zero-pad a 2 cifre) 9px, `--f25`.
  - `.sbc__go` freccia `→` 11px, `--f25`, `margin-left:auto`, **opacity:0** di default.
  - **Hover**: `background:var(--tc-soft)`; nome → `--fg`; freccia opacity 1, color `--tc`.
  - **Attiva** (`.on`, quando quella categoria filtra il River): `background:var(--tc-soft)`; nome color `--tc`; freccia visibile color `--tc`.
  - Click su una riga categoria → **naviga a River filtrato su quella categoria** (`go('river', key)`).

**3) Footer** `.sb__foot` — `padding:13px 18px; border-top:2px solid var(--fg)`, classe `.lbl` color `--f35`, `line-height:1.7`. Contenuto su due righe: `NODE · MULTIVRSS_ALPHA` / `SYNC 4M AGO`.

Elenco categorie e contatori usati: `CULTURE 42 · HUMOR 18 · MUSIC 54 · NEWS 117 · PODCAST 33 · SCIENCE 26`.

---

## Top bar `.top`
`height:54px; border-bottom:2px solid var(--fg); padding:0 18px; display:flex; align-items:center; gap:12px`.

- **Tab di vista** `.tabs` — box `border:1.5px solid var(--fg)`; due bottoni `.tab` (9.5px/800/.12em, `padding:7px 12px`, color `--f35`, `border-right:1.5px` tra i due):
  - `▤ FRONT PAGE` e `≡ RIVER`.
  - Attiva `.tab.on`: `background:var(--fg); color:var(--bg)`.
- **Search** `.search` (solo visuale nel prototipo) — `height:30px; padding:0 12px; border:1px solid var(--f25); min-width:220px`; `Q` iniziale in terracotta 800; placeholder `FILTER THE STREAM…` 10px/600/.08em color `--f35`.
- `.spring` (`flex:1`) spinge a destra i controlli.
- **`+ ADD ▾`** `.tbtn.tbtn--solid`: `background:var(--fg); color:var(--bg)`; hover `background:var(--tc)`.
- **`↻ SYNC`** `.tbtn`: 9.5px/800/.12em color `--f55`; hover `--fg`.
- **Toggle tema** `.tico` — icona **`◑` in light**, **`☀` in dark**; click → `toggleTheme()` (vedi Stato). color `--f45`, hover `--fg`.
- **`⚙`** `.tico` (impostazioni, visuale).

---

## Telemetry + i due menu a tendina `.tele`
`padding:9px 18px; border-bottom:2px solid var(--fg); font:9.5px/700 mono; letter-spacing:.13em; uppercase; color:var(--f45); display:flex; align-items:center; gap:5px; white-space:nowrap; overflow:visible; position:relative; z-index:20`.
`.tele b{color:var(--fg);font-weight:800}` · separatore `.tele i{color:var(--f25); margin:0 4px}` (carattere `·`).

- **Front Page** (testo statico):
  `CURATED FROM **142 READ** · **28 SAVED** · ACROSS **6 CATEGORIES** · UPDATED **4M AGO**`
- **River**:
  `INDEX **{count} / 1000** · TIME **3 MS** · FILTER [dropdown] · CATEGORY [dropdown]`
  dove `{count}` = numero di item attualmente visibili dopo i filtri.

### Componente Dropdown (condiviso da FILTER e CATEGORY — **stessa UX**)
```
.dd        position:relative; display:inline-flex; align-items:center; gap:6px
.dd__lbl   color:var(--f45)                         /* la parola "FILTER" / "CATEGORY" */
.dd__btn   inline-flex; gap:6px; font:9.5px/800 mono; letter-spacing:.13em; uppercase;
           color:var(--tc); padding:3px 7px; border:1px solid var(--f14)
.dd__btn:hover  border-color:var(--tc)
.dd__btn b      color:var(--tc); font-weight:800    /* valore corrente, es. ALL / MUSIC */
.dd__car   color:var(--f35); font-size:8px          /* caret ▾ */
.dd__menu  position:absolute; top:calc(100% + 7px); left:0; z-index:80; min-width:158px;
           background:var(--bg); border:2px solid var(--fg); padding:4px;
           box-shadow:0 14px 34px rgba(0,0,0,.20)
.dd__opt   display:block; width:100%; text-align:left; font:10px/700 mono;
           letter-spacing:.12em; uppercase; color:var(--f55); padding:8px 11px
.dd__opt:hover  background:var(--tc-soft); color:var(--fg)
.dd__opt.on     color:var(--tc)                      /* opzione selezionata */
```
- **FILTER** — opzioni `ALL · UNREAD · READ`. Filtra il river per stato letto.
- **CATEGORY** — opzioni `ALL · CULTURE · HUMOR · MUSIC · NEWS · PODCAST · SCIENCE`. Filtra per categoria.
- **Comportamento** (identico per entrambi): click sul bottone apre/chiude il menu; si chiude su **click fuori** o **Esc**; la selezione aggiorna lo stato, chiude il menu e riporta lo scroll del river in cima. Il valore mostrato nel bottone riflette sempre lo stato corrente (quindi cambia anche se la categoria è impostata da sidebar o da "View All").

---

## Front Page (Section Fronts) `.fp`
`padding:22px 26px 90px`. Ordine: **ribbon FOR YOU** → **griglia di sezioni**. *(Nessun masthead.)*

### Fascia FOR YOU `.ribbon`
`display:flex; align-items:stretch; gap:16px; padding:14px 16px; border:2px solid var(--fg); margin:6px 0 26px`.
- `.rib__lbl` = `FOR YOU`, mono 9.5px/800/.2em, color `--tc`, `align-self:center`.
- N pick `.rib` (flex:1, colonna, gap 4): `.rib__cat` (categoria, 7.5px/800/.14em, `--f35`) · `.rib__t` (titolo serif 600/14.5px, `line-height:1.16`, **clamp 2 righe**, hover `--tc`) · `.rib__why` (motivo, 7.5px/800/.1em, `--f35`).
- Separatori `.rib__sep` (linea verticale 1px, `--f14`) tra i pick.
- Contenuto pick (esempi reali usati): vedi `feedapp/data.js` → `FORYOU`.

### Griglia sezioni `.secgrid`
`display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:var(--f14); border:1px solid var(--f14)`
→ il `gap:1px` su fondo `--f14` disegna gli hairline tra le celle. Responsive: `repeat(2,1fr)` ≤1240px, `1fr` ≤900px.

Una sezione per categoria (6 in totale), componente **`.sec`** (`background:var(--bg); padding:20px 20px 0; flex-column`):
1. **Header** `.sec__h` — `border-bottom:2px solid var(--fg); padding-bottom:10px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:baseline`.
   - `.sec__n` nome categoria (12.5px/800/.18em).
   - `.sec__c` contatore totale (10px, `--f35`).
2. **Lead** `.sec__lead` — titolo `.sec__lt` (serif 600/21px, `line-height:1.12`, hover `--tc`) + `.dek.small` (serif 13.5px, `line-height:1.5`, `--f55`) + `.metaline` (fonte in terracotta · data · minuti di lettura).
3. **Lista** `.sec__list` (`border-top:1px solid var(--f14)`) di 3–5 righe `.sec__row` (`border-bottom:1px solid var(--f08)`): titolo `.sec__rt` (serif 500/14.5px, hover `--tc`) + `.sec__rm` (fonte · data). Riga letta → `.is-read { opacity:.4 }`.
4. **VIEW ALL** `.sec__all` — pulsante che **esce a tutta larghezza** della cella (`margin:14px -20px 0`), `padding:13px 20px; background:var(--fg); color:var(--bg); display:flex; justify-content:space-between; font:10px/800 mono; letter-spacing:.16em; uppercase`.
   - Testo: **`VIEW ALL {count} IN {CATEGORY}`** + freccia `→` (`.sec__all-arr`).
   - **Hover**: `background:var(--tc); color:#fff`; la freccia trasla di `+4px`.
   - **Click** → `go('river', categoryKey)`: passa alla vista River **già filtrata** su quella categoria.

Le **azioni di riga** (`.acts`: `SAVE` bookmark, `TAG`, `✓` mark-read) sono `opacity:0` e compaiono solo all'hover del lead/della riga.

---

## River (Ledger) `.river`
`padding:6px 20px 90px`. Nessuna barra filtro qui: i filtri sono nella telemetry.

- **Separatore giorno** `.lgday` — `— JUL 5` (mono 9px/800/.28em, `--tc`) + filetto orizzontale (`background:rgba(226,114,91,.3)`). `margin:16px 0 8px`.
- **Riga item** `.lg` — **CSS grid** a colonne fisse:
  ```
  grid-template-columns: 16px 150px 42px 1fr auto auto;
  align-items:baseline; gap:0 12px; padding:6px; margin:0 -6px; border-top:1px solid var(--f08);
  ```
  1. `.lg__dot` — pallino stato (`○` non letto / `●` letto), **bottone** che fa toggle del letto; color `--tc`, 11px.
  2. `.lg__src` — fonte, mono 9px/800/.1em, color `--tc`, ellipsis.
  3. `.lg__date` — data, mono 9.5px, `--f35`.
  4. `.lg__main` — `min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis`; contiene `.lg__title` (serif 600/15px, hover `--tc`, click = toggle letto) + `.lg__prev` (` — ` + estratto, serif 14px, `--f45`).
  5. `.lg__c` — numero commenti (mono 9px/700, `--f35`), vuoto se 0.
  6. `.acts` — cluster azioni (hidden → hover).
  - **Hover riga**: `background:var(--tc-soft)` + azioni visibili.
  - **Riga letta** `.is-read`: `opacity:.42`, pallino `--f35`.
- **Vuoto**: `.lg-empty` "No items match this filter." (serif 16px, `--f35`).

---

## Cluster azioni `.acts` (condiviso River + Front)
`display:inline-flex; gap:9px; opacity:0; transition:opacity .13s` → `opacity:1` all'hover del contenitore (riga/lead).
- `SAVE` — icona bookmark (SVG inline, `viewBox 0 0 12 15`, path `M1 1h10v12.4l-5-3.1-5 3.1z`), `fill` pieno quando salvato (color `--tc`), altrimenti solo stroke.
- `TAG` — testo, mono 8.5px/800/.12em, hover `--tc`.
- `✓` — mark read, color `--tc` quando letto.

---

## Interazioni & stato

Stato applicativo (nel prototipo è React `useState`; adattatelo al vostro store):
| Stato | Valori | Effetto |
|---|---|---|
| `view` | `'front' \| 'river'` | vista attiva (tab) |
| `cat` | `'ALL' \| <categoryKey>` | filtro categoria River + highlight sidebar + valore dropdown CATEGORY |
| `readFilter` | `'ALL' \| 'UNREAD' \| 'READ'` | filtro River per stato letto + valore dropdown FILTER |
| `theme` | `'light' \| 'dark'` | scritto come attributo `data-theme` su `<body>` |
| `read` | Set di id item | item marcati letti |
| `saved` | Set di id item | item salvati |

- **Persistenza**: tutto serializzato in `localStorage["mv_reader_v1"]` (i Set come array). Ripristino al load.
- **Navigazione "View All" / click categoria in sidebar**: `setView('river')`, `setCat(key)`, scroll river in cima.
- **Toggle tema**: inverte `theme`; un effetto scrive `document.body.setAttribute('data-theme', theme)`.
- **Toggle letto**: click su pallino o titolo → aggiunge/rimuove l'id da `read`.
- **Filtro River** (ordine): prima per `cat`, poi per `readFilter` (`READ` = id ∈ read, `UNREAD` = id ∉ read).
- **Dropdown**: apertura esclusiva, chiusura su click-fuori/Esc, selezione applica + chiude + scroll top.

### Responsive
- `≤1240px`: griglia sezioni a 2 colonne; ribbon va a capo.
- `≤900px`: **sidebar nascosta**; griglia sezioni 1 colonna; riga River si riduce a `16px 1fr auto` (nascondendo fonte/data/commenti in colonna, restano nel main).

---

## Assets
- `assets/multivrss-ico.png` — logo (icosaedro terracotta), usato 28×28 nella sidebar. Nel vostro codebase usate l'asset di brand esistente.
- Font: Google Fonts **JetBrains Mono** + **Newsreader** (import in `<head>`).
- Icone testuali/Unicode usate al posto di un icon set: `◈ ▢ ◷ → ▤ ≡ ◑ ☀ ⚙ ↻ ○ ●`. Sostituibili con le icone del vostro design system.

## File in questo bundle
- `MultivRSS Reader.html` — shell + **tutta la CSS** (inline in `<head>`) + import script. È qui la fonte autorevole per token/regole CSS.
- `feedapp/data.js` — corpus di esempio (categorie, FOR YOU, sezioni, river). Sostituire con dati reali; **la forma dei dati documenta i campi necessari** (`src, date, day, title, body, c` per il river; `lead + rows` per le sezioni).
- `feedapp/app.jsx` — componenti React del prototipo (Sidebar, TopBar, Telemetry, Dropdown, FrontPage/SectionCard, River, App). Riferimento di comportamento.
- `screenshots/` — reference visive:
  - `01-front-light.png`, `02-front-dark.png` (Front Page + sidebar nei due temi)
  - `03-river-light.png`, `04-river-dark.png` (River + dropdown nei due temi)

> Per vedere il prototipo dal vivo: aprire `MultivRSS Reader.html` in un browser (serve connessione per i font/React CDN).
