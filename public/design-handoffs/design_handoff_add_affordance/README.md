# Handoff: "+" condiviso davanti al gruppo — `[ + | SOURCE | URL ]`

## Overview
Nell'header dell'app (`PageHeader.tsx`) oggi ci sono **due bottoni affiancati** in un gruppo bordato — `+ SOURCE` e `URL`. Il simbolo `+` vive *dentro* il bottone SOURCE, quindi **non si capisce che governa entrambe le azioni**: l'utente non percepisce che da lì può aggiungere sia una *fonte* (feed RSS) sia un *singolo URL*.

Questo handoff antepone al gruppo **una cella `+` condivisa, non interattiva**, in terracotta, che fa da "etichetta di scope" per entrambi i bottoni:

```
┌─────┬───────────┬─────────┐
│  +  │ ⌗ SOURCE  │ 🔗 URL  │
└─────┴───────────┴─────────┘
   ↑        ↑           ↑
 scope   apre modale  apre popover
 (deco)  AddFeedForm  SaveLinkBar
```

**Vantaggio scelto (V1):** zero click in più. I due bottoni restano cliccabili **direttamente** — il `+` chiarisce solo *visivamente* che entrambi appartengono all'azione "aggiungi". Nessun menu, nessuna tendina.

> Variante scelta: **V1** (tra le 4 esplorate nel prototipo). Le altre — V2 (`+ ADD` → menu), V3 (`+ ADD SOURCE / URL`), V4 (etichetta `+ ADD` separata) — restano nel prototipo come riferimento ma **non** vanno implementate.

## About the Design Files
I file in questo bundle sono **riferimenti di design realizzati in HTML/React (Babel in-browser)** — prototipi che mostrano aspetto e comportamento voluti, **non codice di produzione da copiare**. Il compito è **ricreare il design nel codebase reale** (Next.js + React + Tailwind, già presente in `multivrss/`), riusando token e icone esistenti.

## Fidelity
**High-fidelity.** Colori, tipografia, spaziature e stati sono definitivi e mappati sui token esistenti. Ricreare con Tailwind, **non** con CSS ad-hoc.

## Dov'è il codice da modificare
**File principale:** `multivrss/src/components/PageHeader.tsx` — **un solo blocco** cambia.
**Nuovo file:** `multivrss/src/components/icons/Plus.tsx`.

Nessun comportamento cambia: i due bottoni mantengono identici `onClick` (`setShowAdd(true)` e `openSaveUrl(desktopUrlToggleRef)`). Si aggiunge **solo** un elemento visivo davanti.

---

## La modifica, nel dettaglio

### 1. Nuova icona "+"
Oggi non esiste un `PlusIcon` dedicato (il `+` è il glifo di `SourceIcon`, di fatto una croce). Crea `src/components/icons/Plus.tsx`, coerente con le altre icone monoline:
```tsx
export function PlusIcon({ size = 13, className = '' }: { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 14 14" className={className} aria-hidden="true">
            <path d="M7 1.6v10.8M1.6 7h10.8" stroke="currentColor" strokeWidth="1.7" />
        </svg>
    );
}
```
E importarla in `PageHeader.tsx`:
```tsx
import { PlusIcon } from './icons/Plus';
```

> **Evita due `+` identici.** `SourceIcon` attuale (`M7 1.5v11M1.5 7h11`) è anch'essa un `+`. Con la nuova cella `+` davanti, il bottone SOURCE mostrerebbe un secondo `+`. Dai a `SourceIcon` un glifo "feed/RSS" più riconoscibile (vedi `IcoSource` in `add-affordance.jsx`: pallino in basso a sinistra + due archi concentrici). Concorda col team.

### 2. DESKTOP — anteporre la cella `+` al gruppo
Nel blocco `{/* Ingest action group: [ SOURCE | URL ] */}`, **aggiungere come primo figlio** del `<div className="hidden md:flex items-stretch border border-foreground/30">` la cella `+`. Il resto del gruppo resta **invariato**:

```tsx
{/* Ingest action group: [ + | SOURCE | URL ] — il + abbraccia entrambe le azioni */}
<div
    className="hidden md:flex items-stretch border border-foreground/30"
    role="group"
    aria-label="Aggiungi una fonte o un URL"
>
    {/* NUOVO: cella + condivisa, non interattiva, fa da etichetta di scope */}
    <span
        aria-hidden="true"
        className="flex items-center justify-center w-[34px] text-terracotta bg-terracotta/10 border-r border-foreground/20"
    >
        <PlusIcon size={14} />
    </span>

    {/* invariato */}
    <button
        onClick={() => setShowAdd(true)}
        className="flex items-center gap-2 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-foreground bg-transparent border-r border-foreground/20 hover:bg-foreground hover:text-background transition-colors"
    >
        <SourceIcon size={12} /> Source
    </button>

    {/* invariato */}
    <button
        ref={desktopUrlToggleRef}
        onClick={() => openSaveUrl(desktopUrlToggleRef)}
        aria-expanded={showSaveUrl}
        className={`flex items-center gap-2 px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors ${
            showSaveUrl ? 'bg-foreground text-background' : 'bg-transparent text-foreground hover:bg-foreground hover:text-background'
        }`}
    >
        <PasteUrlIcon size={12} /> URL
    </button>
</div>
```

**Note importanti**
- La cella `+` è **decorativa** (`aria-hidden`, nessun `onClick`): il significato "aggiungi" è già trasmesso da `role="group"` + `aria-label` sul contenitore. Non renderla un bottone — non deve essere un terzo target cliccabile.
- Larghezza fissa `w-[34px]`, centrata, con bordo destro `border-foreground/20` identico a quello tra i due bottoni → la cella legge come prima colonna del gruppo.
- Tinta di sfondo leggera `bg-terracotta/10` per distinguerla dai bottoni e far risaltare il `+`.

### 3. MOBILE
Sul ramo mobile (`{!searchOpen && …}`) i due bottoni `+` (→ `setShowAdd`) e icona URL (→ `openSaveUrl`) sono **già separati e leggibili** come icone. La confusione del `+` riguarda essenzialmente il gruppo desktop, quindi **mobile può restare invariato**.
Opzionale, per coerenza: racchiudere i due bottoni mobile in un piccolo gruppo bordato con la stessa cella `+` davanti — ma non necessario.

---

## Interactions & Behavior
- **`+` (cella):** nessuna interazione. Solo visiva. Stato statico (no hover).
- **SOURCE:** invariato → apre il modale `AddFeedForm` (`setShowAdd(true)`). Hover: `bg-foreground / text-background`.
- **URL:** invariato → apre la striscia popover `SaveLinkBar` sotto l'header (`openSaveUrl(...)`). Stato attivo quando `showSaveUrl`: `bg-foreground / text-background`. Hover idem.
- **Transizioni:** `transition-colors` (≈120ms) solo sui due bottoni. Nessuna animazione sulla cella `+`.

## State Management
**Nessuna modifica.** `showAdd`, `showSaveUrl`, `desktopUrlToggleRef`, `lastUrlTogglerRef` restano com'erano. Nessun nuovo stato. Nessuna nuova chiamata dati.

## Design Tokens
| Token | Valore | Uso |
|---|---|---|
| `terracotta` | `#E2725B` | glifo `+` (`text-terracotta`), fondo cella (`bg-terracotta/10`) |
| `foreground` | ink / nero | testo bottoni, bordo gruppo `border-foreground/30`, divisori `border-foreground/20`, hover `bg-foreground` |
| `background` | paper `#f6f3ec` | testo su hover/stato attivo |
| Cella `+` | larghezza `34px`, centrata, `border-r border-foreground/20` | prima colonna del gruppo |
| Label bottoni | `10px` · `font-bold` · `uppercase` · `tracking-widest` | SOURCE / URL |
| Icone | `+` 14px · SOURCE/URL 12px | — |
| Gap icona/testo | `gap-2` · padding `px-3 py-1` | bottoni |

## Assets / Icone
- `PlusIcon` — **da creare** in `src/components/icons/Plus.tsx` (snippet §1)
- `SourceIcon` — `src/components/icons/Source.tsx` (esistente; consigliato restyle a glifo RSS, §1)
- `PasteUrlIcon` — `src/components/icons/PasteUrl.tsx` (esistente, invariato)

## Copy (testo esatto)
- Bottone 1: **SOURCE** · Bottone 2: **URL** (invariati)
- `aria-label` del gruppo: **Aggiungi una fonte o un URL**
- La cella `+` non ha testo.

## Confronto con la V2 (per contesto)
Avevi inizialmente scelto la V2 (`+ ADD` → menu a tendina con descrizioni). La **V1** è preferita perché **toglie un click**: nessun menu da aprire, le due azioni restano a portata diretta. In cambio rinuncia alle descrizioni esplicite ("feed RSS" / "singolo link") che la V2 mostrava nel menu — se in futuro servisse onboarding più esplicito, la V2 resta nel prototipo.

## Files in questo bundle
- `Save URL on Dashboard.html` — prototipo completo. Sezione **"Tasto + — aggiungere fonti e URL"** in cima; **V1** = artboard "V1 · + condiviso davanti al gruppo — [ + | SOURCE | URL ]".
- `add-affordance.jsx` — componenti React delle 4 varianti. **V1 = `AddSharedPlus`** + classi `.tb-grp`, `.tb-grp__plus`, `.tb-grp__b` (fonte autorevole per markup/stili).
- `topbar-variants.jsx`, `dashboard.jsx` — dipendenze del prototipo (solo per farlo girare).

## File reali da toccare (nel codebase `multivrss/`)
- `src/components/PageHeader.tsx` — anteposizione cella `+` al gruppo desktop (§2), import `PlusIcon`
- `src/components/icons/Plus.tsx` — **nuovo** (§1)
- `src/components/icons/Source.tsx` — *opzionale*, restyle glifo a RSS (§1)
