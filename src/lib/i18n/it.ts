import type { Dictionary } from "./types";

export const it: Dictionary = {
  nav: {
    openApp: "APRI MULTIVRSS →",
    githubLabel: "Codice sorgente di MultivRSS su GitHub (si apre in una nuova scheda)",
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
    subCta: "GRATIS E OPEN SOURCE",
  },
  blog: {
    kicker: "DIARIO",
    title: "Pensieri dal MultivRSSo.",
    subtitle:
      "Guide, note di prodotto e manuali brevi.",
    feedLabel: "Iscriviti al feed",
    feedHint: "FEED: /blog/en.xml · /blog/it.xml",
    seeAll: "VEDI TUTTI I POST →",
  },
  sources: {
    kicker: "FONTI CURATE",
    title: "Le nostre fonti preferite.",
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
              "Sì. Il codice è su GitHub (github.com/trnqeu/multivrss) con licenza MIT, e il file SELF_HOSTING.md nella repository spiega come installare la tua copia con Docker.",
          },
          {
            question: "Posso eliminare il mio account e i miei dati?",
            answer:
              "Sì: vai su Impostazioni → Account nella dashboard e usa Elimina account nella danger zone. Il tuo account e tutti i tuoi dati vengono eliminati subito e non possono essere recuperati.",
          },
        ],
      },
      {
        id: "saved-fading",
        title: "Elementi salvati e dissolvenza",
        items: [
          {
            question: "Quello che salvo resta per sempre?",
            answer:
              "Non se per il tuo account è attiva la dissolvenza. Gli elementi salvati a cui non torni mai sbiadiscono piano piano: prima perdono la descrizione, poi il titolo, e alla fine spariscono. Quello a cui continui a tornare resta. I nuovi account partono con la dissolvenza attiva; gli account creati prima che esistesse la hanno spenta finché non la attivi da Impostazioni → Account.",
          },
          {
            question: "Quanto velocemente sbiadiscono gli elementi salvati?",
            answer:
              "Un elemento che non tocchi più perde la descrizione dopo circa dieci settimane. Dopo circa cinque mesi diventa una traccia: niente titolo, solo il sito da cui viene, il mese in cui l'hai salvato e i suoi tag. Dopo circa nove mesi sparisce. Ogni volta che ci torni, per quell'elemento il tempo rallenta.",
          },
          {
            question: "Come tengo qualcosa?",
            answer:
              "Usandolo. Aprire un elemento salvato, ritrovarlo con la ricerca, leggerlo in Reader Mode o modificarne titolo e tag gli dà più vita, e leggerlo conta più di tutto. Tornare su qualcosa che stava per sbiadire conta più che cliccarlo di continuo quando è ancora fresco. Ogni settimana la sezione Fading soon in cima ai salvati mostra cosa sta per perdere qualcosa, con un pulsante Keep per ogni elemento. Non c'è un «tieni tutto»: scegli un elemento alla volta. Leggere, cercare o tenere un elemento dà anche un po' di vita agli elementi salvati più affini, per tag o per parole.",
          },
          {
            question: "Un elemento sbiadito può tornare com'era?",
            answer:
              "No. Ciò che sbiadisce viene cancellato dal nostro database, senza annullamento e senza copie nascoste. Tornare su un elemento sbiadito gli impedisce di sbiadire ancora, ma non gli restituisce quello che ha già perso. Una precisazione onesta: i backup del database vengono conservati per 30 giorni, quindi un link dimenticato può ancora esistere in un backup per un massimo di 30 giorni, poi sparisce del tutto.",
          },
          {
            question: "Cosa succede a un articolo salvato da uno dei miei feed?",
            answer:
              "Il suo testo appartiene al feed, quindi la dissolvenza non lo cancella mai: cambia solo come l'articolo appare nei tuoi salvati. Quando è il salvataggio a essere dimenticato, l'articolo torna a essere un normale elemento del feed e segue la regola consueta degli articoli non salvati.",
          },
          {
            question: "Posso disattivare la dissolvenza?",
            answer:
              "Sì, da Impostazioni → Account. Disattivandola si ferma tutto; ciò che è già sbiadito resta com'è. Riattivandola, ogni elemento salvato riparte da capo. Anche i link importati da Pocket, Instapaper o da un file CSV partono da capo, qualunque sia la loro data originale.",
          },
          {
            question: "Perché una lista di lettura dovrebbe dimenticare?",
            answer:
              "Perché salviamo tutto, rileggiamo poco e non dimentichiamo nulla, e una lista che cresce soltanto smette di essere letta. Sapere che un elemento può sbiadire è ciò che ti fa tornare su quelli che contano. MultivRSS fa parte di Undurable (undurable.com), un laboratorio che toglie l'infinito alle macchine e osserva cosa restituisce la fine.",
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
              "Due, e preferiamo dirtelo subito: un massimo di 200 feed per account, e un articolo non salvato viene rimosso circa 90 giorni dopo che sparisce dal feed di origine. Ciò che salvi nella lista di lettura resta finché ci torni: vedi Elementi salvati e dissolvenza qui sopra.",
          },
          {
            question: "Per quanto tempo restano gli articoli non salvati?",
            answer:
              "Finché il feed di origine li elenca, più circa 90 giorni dopo che ne escono. Salva un articolo nella lista di lettura in qualsiasi momento prima di allora e resta salvato finché ci torni.",
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
  openSource: {
    kicker: "OPEN SOURCE",
    title: "Ti piace? Prenditelo.",
    body:
      "MultivRSS è open source con licenza MIT. Usa la versione ospitata, oppure installa gratuitamente su qualsiasi server con Docker: codice, guida all'installazione e segnalazione dei bug sono tutti su GitHub.",
    facts: [
      { label: "LICENZA", value: "MIT" },
      { label: "STACK", value: "Next.js · PostgreSQL · Redis" },
      { label: "DEPLOY", value: "Docker Compose" },
    ],
    githubCta: "→ VEDI SU GITHUB ↗",
    selfHostCta: "GUIDA AL SELF-HOSTING ↗",
    newTabHint: "(si apre in una nuova scheda)",
  },
  closing: {
    kicker: "END_OF_FEED",
    headlinePre: "Riprenditi la tua ",
    headlineAccent: "attenzione",
    headlineSuffix: ".",
    body: "Ti ricordi di quando internet era bellissimo? MultivRSS è il posto dove vieni a leggere internet in pace: solo i tuoi aggiornamenti e i tuoi segnalibri, in un formato aperto che è tuo e fatto per durare.",
    cta: "→ CREA IL TUO ACCOUNT",
    secondaryCta: "LEGGI IL BLOG ↗",
  },
  digest: {
    saveLabel: "Salva",
    savedLabel: "Salvato",
    addFeedLabel: "Aggiungi feed",
    alreadySubscribedLabel: "Già nei tuoi feed",
    saveErrorMessage: "Salvataggio non riuscito. Riprova.",
    addFeedErrorMessage: "Aggiunta non riuscita. Riprova.",
  },
  footer: {
    tagline:
      "Un aggregatore RSS e lista di lettura in un'unica dashboard semplice e minimale.",
    partOf: "PARTE DI",
    madeBy: "REALIZZATO DA",
  },
  meta: {
    home: {
      title: "MultivRSS · Leggi il web. Salva i tuoi contenuti.",
      description:
        "La tua stanza di lettura su Internet. Un aggregatore di feed RSS e segnalibri in un'unica dashboard calma e minimale.",
    },
  },
};
