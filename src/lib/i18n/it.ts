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
    kicker: "I tuoi contenuti. E basta.",
    headline1: "Aggiornamenti",
    headline2: "Segnalibri",
    bodyIntro:
      "MultivRSS è un posto tranquillo in cui leggere il web, un aggregatore di contenuti minimale per gestire gli ",
    bodyBold1: "aggiornamenti ",
    bodyMid: "dei tuoi siti preferiti e ",
    bodyBold2: "salvare i link ",
    bodySuffix: "degli articoli più interessanti.",
    bodyReclaim: "",
    cta: "→ INIZIA",
    subCta: "È GRATIS!",
  },
  blog: {
    kicker: "DIARIO",
    title: "Pensieri dal MultivRSS.",
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
  sourcesPage: {
    kicker: "FONTI CURATE · PUBBLICO",
    h1: "Lo scaffale.",
    introBody:
      "Sono i feed che leggiamo davvero su MultivRSS: scelti a mano, senza sponsor, senza classifiche. Cerca per nome o argomento, salta a una categoria, seleziona più fonti e aggiungile tutte insieme.",
    statsSourcesLabel: "FONTI",
    statsCategoriesLabel: "CATEGORIE · AGGIORNATA SETTIMANALMENTE",
    searchLabel: "Cerca tra le fonti",
    searchPlaceholder: "cerca fonte, dominio o argomento…",
    allChipLabel: "TUTTE",
    resultsLabel: "risultati",
    selectAllLabel: "SELEZIONA TUTTE",
    emptyState: "Nessuna fonte trovata. Prova un altro termine.",
    bulkCountLabel: "fonti selezionate",
    bulkDeselect: "DESELEZIONA",
    bulkAddButton: "→ AGGIUNGI SELEZIONATE",
    closingKicker: "READY_TO_READ",
    closingHeadlinePre: "Aggiungi tutto lo ",
    closingHeadlineAccent: "scaffale",
    closingHeadlineSuffix: ".",
    closingBody:
      "Crea la tua reading room e importa tutte le fonti qui sopra in un solo passaggio, poi rendila tua: aggiungi, rimuovi, organizza per categoria.",
    closingCta: "→ INIZIA GRATIS",
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
  footer: {
    tagline:
      "Un aggregatore RSS e lista di lettura in un'unica dashboard semplice e minimale.",
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
    legalLinks: [
      { label: "Privacy Policy", slug: "privacy" },
      { label: "Cookie Policy", slug: "cookies" },
    ],
  },
  meta: {
    home: {
      title: "MultivRSS · Leggi il web. Salva i tuoi contenuti.",
      description:
        "La tua stanza di lettura su Internet. Un aggregatore di feed RSS e segnalibri in un'unica dashboard calma e minimale.",
    },
  },
};
