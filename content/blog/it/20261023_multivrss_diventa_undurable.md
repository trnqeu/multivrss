---
title: "MultivRSS diventa Undurable"
category: "PRODUCT DESIGN"
date: "23 OCT 2026"
translationSlug: "20261023_multivrss_goes_undurable"
featured: false
author: "Stefano Trinchero"
excerpt: "I link che salvi su MultivRSS ora possono sbiadire: prima perdono i dettagli, poi il titolo, poi spariscono. Perché l'ho fatto? "
---

Ho da poco lanciato il progetto [Undurable](https://undurable.com). L'ho chiamato un "laboratorio di impermanenza tecnologica" perché sarà un luogo dedicato a esplorare i concetti di "**dimenticanza controllata**", "data fading", "de-databasing" e altri concetti inventati per provare a risolvere il problema, probabilmente solo mio, dell'abuso di memoria negli ecosistemi digitali. 

Chi volesse approfondire l'argomento può leggere un sintetico [manifesto](https://undurable.com/it/manifesto) in cui provo a spiegare le ragioni di questo lavoro.

Ho voluto che Multivrss entrasse a far parte del progetto Undurable perché a un certo punto mi sono fatto una domanda: non è che forse con Multivrss mi sono semplicemente costruito **un altro posto in cui accumulare cose all'infinito**? E questo non è esattamente il problema che sto cercando di affrontare con Undurable?

Uso Multivrss principalmente per leggere e salvare link interessanti. Però questi "link interessanti" prima li salvavo su Pocket. Poi quando Pocket ha chiuso li ho scaricati tutti e li ho rimessi su Instapaper. E poi quando ho creato Multivrss li ho scaricati da Instapaper e li ho reimportati su Multivrss. E probabilmente andrò avanti a fare la stessa cosa per il resto della mia vita, ma mi sono chiesto: perché lo sto facendo? Quanti di questi articoli verranno effettivamente "usati"? Probabilmente nessuno. Molti non li ho nemmeno letti proprio perché li stavo salvando. "Questo lo salvo e poi lo leggerò dopo", si dice, ma poi il dopo non arriva mai, l'elenco di roba da leggere si allunga e ci si trascina dietro una collezione inerte di oggetti digitali abbandonati. Non sarebbe più sensato salvare meno cose e leggerne di più? Oppure salvarne meno, leggerne di meno e capire più a fondo le poche che si leggono?

Allora ho pensato di inserire all'interno di Multivrss una nuova funzionalità che genera il decadimento nel tempo dei link salvati. 

## Come funziona concretamente

Un link che salvi e non riapri più perde la descrizione dopo circa dieci settimane. Dopo circa cinque mesi diventa una **traccia**: niente titolo, solo il sito da cui veniva, il mese in cui l'hai salvato e i suoi tag. Qualcosa come "un link da theguardian.com, salvato a marzo, con il tag clima". Dopo circa nove mesi sparisce.

Tornare su un link invece ne prolunga l'esistenza. Aprire un elemento, ritrovarlo con la ricerca, leggerlo in Reader Mode, modificarne il titolo o i tag: ogni gesto gli dà più vita. E in cima alla pagina dei salvati c'è una nuova sezione, **Fading soon**, che ogni settimana mostra cosa sta per perdere qualcosa, con un pulsante **Keep** accanto a ciascun elemento.

Il fading è facoltativo. Per gli account esistenti è spento finché non lo attivi da *Impostazioni → Account*.

## Le scelte

Prima di scrivere una riga di codice ho fissato alcune regole, e le ho trattate come vincoli più che come buone intenzioni.

**Opt-in, mai retroattivo.** Nessuno ha perso niente con l'aggiornamento. Chi attiva il fading fa ripartire da zero tutti i suoi salvati: un link salvato due anni fa e mai riaperto non sparisce la notte stessa.

**Dimenticare è irreversibile.** Ciò che sbiadisce viene cancellato dal database: niente cestino, niente cronologia, niente "annulla". Spegnere il fading lo ferma, ma non restituisce nulla. Una precisazione onesta: i backup del database vengono conservati per 30 giorni, quindi un link dimenticato può ancora esistere in un backup per un massimo di 30 giorni, poi sparisce del tutto.

**Si sbiadisce per sottrazione, non per contrasto.** La tentazione ovvia era rendere il testo sempre più chiaro. Ma il design system di MultivRSS non ha grigi e chiede un contrasto di almeno 4.5:1: un testo illeggibile è un problema di accessibilità, non una metafora. Un elemento sbiadito quindi perde *informazioni*, e lo dice: un'etichetta testuale (FADED, TRACE) e un separatore tratteggiato o puntinato. Quello che resta si legge benissimo.

**Uno alla volta.** Non esiste un "tieni tutto". Sarebbe stato il primo pulsante richiesto e l'ultimo da aggiungere: scegliere cosa tenere, un elemento alla volta, è proprio il punto.

**L'eternità non è in vendita.** Il fading non sarà mai una funzione Premium al contrario, del tipo "paga e i tuoi link restano per sempre".

**Gli import non retrodatano.** I link importati da Pocket, Instapaper o CSV partono da capo, qualunque sia la loro data originale. Altrimenti chi arriva con dieci anni di archivio lo vedrebbe evaporare in una notte.

## Come funziona tecnicamente

Ho voluto che il "ricordo" dei link ricalcasse molto da lontano il funzionamento della memoria umana, provando a integrare alcuni meccanismi di rafforzamento del ricordo attraverso l'affinità, il richiamo, l'utilizzo di quella particolare informazione.

Ogni elemento salvato ha due attributi numerici: quando l'hai toccato l'ultima volta e una **stabilità**, misurata in giorni, che parte da 60. Da questi due numeri si calcola la **ritenzione**, cioè quanto lo ricordi:

```
R = exp(-giorni dall'ultimo tocco / stabilità)
```

R vale 1 subito dopo un tocco e scende lentamente verso zero. Non viene mai salvata nel database: si ricalcola ogni volta. Quando scende sotto 0,30 l'elemento perde la descrizione, sotto 0,08 diventa una traccia, sotto 0,01 viene dimenticato. Con una stabilità di 60 giorni le tre soglie cadono a 72, 152 e 276 giorni.

### I tocchi

Ogni interazione è un "tocco" e fa due cose: aumenta la stabilità, così la curva scende più lentamente, e riporta indietro l'orologio dell'ultimo tocco. Quanto, dipende dal gesto:

| Gesto | Peso |
|---|---|
| Aprire il link | il più leggero |
| Modificare titolo o tag | un po' di più |
| Ritrovarlo con la ricerca | di più |
| Keep in Fading soon | ancora di più |
| Leggerlo in Reader Mode | il più forte |

Cercare vale più di aprire per una ragione semplice: scorrere una lista è *riconoscere*, cercare è *ricordare*. Se vai a cercare qualcosa, vuol dire che ti era rimasto in testa.

C'è un dettaglio che rende il modello più simile alla memoria che a un contatore di clic. L'aumento di stabilità è proporzionale a quanto l'elemento era vicino a sbiadire: è l'*effetto spaziatura*, noto da più di un secolo negli studi sulla memoria. Un esempio con i numeri veri:

- apri un link il giorno dopo averlo salvato: la stabilità passa da 60 a circa 61 giorni. Quasi niente;
- lo leggi in Reader Mode dopo 70 giorni, quando stava per perdere la descrizione: la stabilità sale a 93 giorni, e il prossimo sbiadimento si sposta di oltre tre mesi.

Dieci clic di fila su un elemento appena salvato non aggiungono quasi nulla. Recuperarne uno quasi perso vale molto. E c'è un tetto: anche un elemento usatissimo, se poi lo abbandoni, sparisce nel giro di qualche anno.

Un'ultima regola: un tocco può far risalire la ritenzione, ma non fa mai tornare indietro uno stadio. Se un link ha già perso la descrizione, quella descrizione non esiste più. Le parole perse restano perse.

### Associazione di idee

Questa parte non era nel progetto iniziale. Quando leggi, cerchi o tieni un elemento, i due salvati più affini ricevono un tocco più debole: un tag in comune, parole in comune nel titolo, lo stesso sito. Un po' come quando un articolo te ne fa tornare in mente un altro.

È un tocco che aumenta solo la stabilità, senza riportare indietro l'orologio, e si ferma a un passo: un'associazione non ne genera altre a catena, altrimenti resterebbe vivo tutto. E ogni elemento può riceverne al massimo uno al giorno, per evitare che un articolo molto generico venga tenuto in vita da tutti i suoi vicini.

L'affinità si calcola sul testo che esiste ancora. Così un elemento che sbiadisce perde anche le sue associazioni: una traccia, che non ha più parole, si collega agli altri solo attraverso tag e sito.

### Come funziona ancora più tecnicamente

Non c'è nessun servizio nuovo. Il modello è una manciata di funzioni pure in TypeScript, senza database e senza orologio: il tempo è un parametro, e questo permette di testare mesi di oblio in un millisecondo. Lo stato vive in tre colonne su PostgreSQL, accanto a ogni elemento salvato.

Ogni notte un job del worker che già sincronizza i feed fa tre passaggi, in quest'ordine: dimentica ciò che è sotto 0,01, riduce a traccia ciò che è sotto 0,08, toglie la descrizione a ciò che è sotto 0,30. Lavora a blocchi di mille righe, con query SQL che calcolano la ritenzione direttamente nel database, ed è idempotente: lanciarlo due volte di fila non cambia niente la seconda volta. Ha anche una modalità di prova che conta cosa farebbe senza toccare nulla. Nei log finiscono solo numeri, mai titoli o URL.

I tocchi partono dal browser con `sendBeacon`, che non rallenta la navigazione, e solo da gesti espliciti. Mai mentre una pagina viene generata sul server: Next.js precarica i link, e un tocco registrato durante il rendering conterebbe come letture anche le pagine che nessuno ha guardato.

## E adesso

Il fading è spento per tutti gli account esistenti: se vuoi provarlo, lo trovi in *Impostazioni → Account*. Lì e nelle [FAQ](https://multivrss.com/it/faq#faq-saved-fading) trovi anche come funziona nel dettaglio.

Non so ancora cosa tutto questo comporti. Ci aiuterà a dare maggiore peso alle cose che salviamo? Leggeremo di più? Quello che leggeremo ci resterà maggiormente impresso? Non lo so, ma so che una lista che cresce soltanto ha smesso da tempo di essere letta, e sapere che qualcosa può sparire è forse l'unico motivo per tornarci.
