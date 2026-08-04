import type { Dictionary } from "./types";

export const it: Dictionary = {
  nav: {
    items: [
      { label: "BLOG", slug: "#blog", isAnchor: true },
      { label: "GUIDA", slug: "guide" },
      { label: "FONTI", slug: "sources" },
      { label: "SUGGERIMENTI", slug: "tips" },
      { label: "FAQ", slug: "faq" },
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
  faqPage: {
    kicker: "DOMANDE · RISPOSTE",
    h1: "FAQ.",
    introBody:
      "Tutto quello che ci chiedono prima di iscriversi, in un unico posto: cosa fa MultivRSS, come gestiamo i tuoi dati, cosa è gratuito e come funzionano gli aspetti tecnici.",
    aiDisclaimer:
      "Questa pagina FAQ è stata redatta con l'aiuto dell'IA e rivista dal nostro team. Se qualcosa ti sembra impreciso o non aggiornato, faccelo sapere.",
    categories: [
      {
        id: "product",
        title: "Prodotto e funzionalità",
        items: [
          {
            question: "Cos'è MultivRSS?",
            answer:
              "Un lettore RSS e una lista di lettura in un'unica dashboard: segui gli aggiornamenti dei tuoi feed, salva qualsiasi link da leggere più tardi e cerca tra entrambi.",
          },
          {
            question: "Qual è la differenza tra Front Page e River?",
            answer:
              "La Front Page è un riepilogo personalizzato di ciò che vale la pena leggere ora. La River è il flusso cronologico completo di tutti gli aggiornamenti dei tuoi feed, dal più vecchio o dal più recente.",
          },
          {
            question: "Come decide la Front Page cosa mostrarmi?",
            answer:
              "Si ricostruisce una volta al giorno. In cima trovi la striscia For You, poi il resto è raggruppato per categoria: per ogni categoria peschiamo prima gli articoli dalle fonti che hai letto o salvato di recente, poi completiamo con gli articoli non letti più freschi delle altre fonti della categoria, così non resta mai vuota. Non ripete mai qualcosa che ti ha già mostrato lì.",
          },
          {
            question: "Come viene scelta la striscia For You?",
            answer:
              "For You guarda cosa hai letto e salvato davvero negli ultimi 30 giorni per capire quali fonti ti interessano di più: gli articoli salvati contano più di quelli semplicemente letti. Poi prende gli articoli non letti più freschi da quelle fonti, li ordina in base a quanto è forte questo segnale e mescola le prime scelte nella striscia, così non è sempre nello stesso ordine ogni giorno.",
          },
          {
            question: "Cos'è la Modalità Lettura (Reader Mode)?",
            answer:
              "Una visualizzazione pulita dell'articolo completo, senza pubblicità né layout distraenti, estratta direttamente dalla pagina originale: non devi mai uscire da MultivRSS per leggere.",
          },
          {
            question: "La ricerca copre anche i link salvati o solo i feed?",
            answer:
              "Entrambi. La ricerca è unificata tra tutto ciò che segui e tutto ciò che hai salvato, e puoi filtrare i risultati per categoria, intervallo di tempo, fonte o stato di lettura.",
          },
          {
            question: "Con che frequenza si aggiornano i feed?",
            answer:
              "I feed si sincronizzano automaticamente in background. Se non vuoi aspettare, c'è anche un pulsante di sincronizzazione manuale che aggiorna tutto subito.",
          },
        ],
      },
      {
        id: "account",
        title: "Account e privacy",
        items: [
          {
            question: "Come creo un account?",
            answer:
              "Con email e password (dovrai prima verificare l'email), oppure accedendo con il tuo account Google o GitHub.",
          },
          {
            question: "Vendete o condividete i miei dati?",
            answer:
              "No. MultivRSS non usa pubblicità né tracker di analytics, e non vende né affitta i tuoi dati. Un numero ridotto di fornitori di servizi (come il nostro strumento di monitoraggio errori) ci aiuta a gestire il prodotto: l'elenco completo è nella Privacy Policy.",
          },
          {
            question: "MultivRSS è open source? Posso auto-ospitarlo?",
            answer:
              "Non ancora. L'auto-hosting è qualcosa che stiamo valutando, non è ancora disponibile né deciso.",
          },
          {
            question: "Posso eliminare il mio account e i miei dati?",
            answer:
              "Sì: non è ancora self-service dalla dashboard, quindi scrivi a privacy@multivrss.com e cancelleremo il tuo account e i tuoi dati entro 30 giorni.",
          },
        ],
      },
      {
        id: "pricing",
        title: "Prezzi e limiti",
        items: [
          {
            question: "Quanto costa MultivRSS?",
            answer: "MultivRSS è gratuito. Non c'è nessun piano a pagamento oggi.",
          },
          {
            question: "Ci sono limiti nel piano gratuito?",
            answer:
              "Due, e preferiamo dirtelo subito: un massimo di 200 feed per account, e gli articoli non salvati vengono rimossi automaticamente dopo 90 giorni. Tutto ciò che salvi nella lista di lettura resta per sempre.",
          },
          {
            question: "Cosa succede a un articolo dopo 90 giorni?",
            answer:
              "Se non l'hai salvato nella lista di lettura, viene rimosso automaticamente per tenere tutto in ordine. Salvarlo in qualsiasi momento prima lo conserva per sempre.",
          },
          {
            question: "Ci sarà un piano a pagamento in futuro?",
            answer:
              "Forse, ma per ora non c'è nulla di deciso o attivo: il piano gratuito non è una prova a tempo. Se cambierà, lo annunceremo chiaramente, qui e altrove.",
          },
        ],
      },
      {
        id: "technical",
        title: "Aspetti tecnici",
        items: [
          {
            question: "A che tipo di feed posso iscrivermi?",
            answer:
              "Qualsiasi feed RSS o Atom standard. Molti siti senza un feed evidente ne espongono comunque uno: consulta la pagina Suggerimenti per i trucchi URL su Google News, Substack, Reddit, YouTube, Medium, WordPress, GitHub e altro.",
          },
          {
            question: "Posso iscrivermi a un canale YouTube?",
            answer:
              "Sì: incolla l'URL del canale (o uno @handle) e MultivRSS lo risolve automaticamente nel feed video di quel canale.",
          },
          {
            question: "Posso importare o esportare la mia lista di feed?",
            answer:
              "Sì, dalle Impostazioni: esporta tutte le tue fonti in CSV in qualsiasi momento, oppure importa un file CSV per aggiungere feed in blocco (è richiesta una colonna URL; categoria e titolo sono opzionali).",
          },
          {
            question: "Esiste un'estensione per il browser?",
            answer:
              "Non ancora: è nella nostra roadmap. L'API che verrà usata per aggiungere feed e salvare articoli esiste già oggi.",
          },
          {
            question: "Posso installare MultivRSS sul telefono o sul desktop?",
            answer:
              "Sì: MultivRSS è un'app installabile. Su Android e su Chrome o Edge desktop, cerca \"Installa\" nel menu del browser. Su iOS, usa il menu Condividi di Safari e scegli \"Aggiungi a Home\".",
          },
        ],
      },
    ],
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
      { label: "FAQ", slug: "faq" },
      { label: "Feed RSS", href: "#" },
      { label: "Changelog", slug: "changelog" },
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
