import type { Dictionary } from "./types";

export const it: Dictionary = {
  nav: {
    items: [
      { label: "BLOG", slug: "#blog", isAnchor: true },
      { label: "GUIDA", slug: "guide" },
      { label: "FONTI", slug: "sources" },
      { label: "SUGGERIMENTI", slug: "tips" },
    ],
    signIn: "ACCEDI",
    getStarted: "INIZIA →",
  },
  hero: {
    kicker: "LA TUA STANZA DI LETTURA DIGITALE",
    headline1: "Leggi il web.",
    headline2: "Cancella il rumore",
    bodyIntro:
      "MultivRSS è la tua stanza di lettura digitale. Uno spazio tranquillo e minimale in cui i gestire i tuoi ",
    bodyBold1: "aggiornamenti",
    bodyMid: " e ",
    bodyBold2: "segnalibri",
    bodySuffix: ": i feed che hai scelto, i link che hai salvato. ",
    bodyReclaim: "",
    cta: "→ INIZIA",
    subCta: "È GRATIS!",
  },
  blog: {
    kicker: "DIARIO",
    title: "Pensieri dal MultivRSSo.",
    subtitle:
      "Guide, note di prodotto e manuali brevi, scritti in Markdown, distribuiti in formato aperto.",
    feedLabel: "Iscriviti al feed",
    feedHint: "FEED: /blog/en.xml · /blog/it.xml",
    seeAll: "VEDI TUTTI I POST →",
  },
  sources: {
    kicker: "FONTI CURATE",
    title: "I feed che leggiamo davvero.",
    subtitle:
      "Una selezione curata da cui partire: nessun accordo commerciale, nessuna classifica. Aggiungi qualsiasi fonte al tuo lettore; ti verrà chiesto di registrarti.",
    seeAll: "VEDI TUTTE LE FONTI →",
    add: "AGGIUNGI",
    footer: "SELEZIONE PUBBLICA · /sources · AGGIORNATA SETTIMANALMENTE · SENZA ACCOUNT",
  },
  closing: {
    kicker: "END_OF_FEED",
    headlinePre: "Riprendi la tua ",
    headlineAccent: "attenzione",
    headlineSuffix: ".",
    body: "MultivRSS è il posto dove vieni a leggere internet in pace: solo i tuoi aggiornamenti e i tuoi segnalibri, in un formato aperto che è tuo e fatto per durare. Il web era fatto per essere letto, non scorrere.",
    cta: "→ CREA IL TUO ACCOUNT",
    secondaryCta: "LEGGI IL BLOG ↗",
  },
  twoThings: {
    kicker: "Tutto quello che ti serve · Niente di superfluo",
    updatesLabel: "01 · Aggiornamenti",
    updatesBody:
      "I nuovi post di tutti i siti che segui, raccolti in un unico posto tranquillo, nell'ordine in cui arrivano.",
    bookmarksLabel: "02 · Segnalibri",
    bookmarksBody:
      "Gli articoli che hai salvato per dopo. Conservati, senza pubblicità, e sempre tuoi.",
  },
  footer: {
    tagline:
      "Un aggregatore RSS e lista di lettura in un'unica dashboard in formato aperto. Senza pubblicità, calmo, tuo.",
    productLabel: "Prodotto",
    resourcesLabel: "Risorse",
    productLinks: [
      { label: "Lettore", href: "#" },
      { label: "Lista di lettura", href: "#" },
      { label: "Ricerca", href: "#" },
      { label: "Blog", href: "#blog", isAnchor: true },
    ],
    resourceLinks: [
      { label: "Fonti curate", slug: "sources" },
      { label: "Suggerimenti", slug: "tips" },
      { label: "Feed RSS", href: "#" },
      { label: "Changelog", href: "#" },
      { label: "Stato", href: "#" },
    ],
  },
  meta: {
    home: {
      title: "MultivRSS · Leggi il web aperto. Salva quello che conta.",
      description:
        "La tua stanza di lettura su Internet. Tutti i tuoi feed RSS e segnalibri in un'unica dashboard calma, senza pubblicità e in formato aperto.",
    },
  },
};
