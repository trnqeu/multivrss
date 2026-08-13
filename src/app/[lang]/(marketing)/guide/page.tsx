import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidLang, localizedAlternates, type Lang } from "@/lib/i18n";

interface Props {
  params: Promise<{ lang: string }>;
}

export async function generateStaticParams() {
  return [{ lang: "en" }, { lang: "it" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isValidLang(lang)) return {};

  const copy =
    lang === "it"
      ? {
          title: "Come funziona · MultivRSS",
          description:
            "Tutto quello che fa MultivRSS, in otto piccole mosse. Uno screenshot e un soffio di testo per ogni passo.",
        }
      : {
          title: "How it works · MultivRSS",
          description:
            "Everything MultivRSS does, in eight small moves. One screenshot and one breath of text per step.",
        };

  return { ...copy, alternates: localizedAlternates(lang, "/guide") };
}

// ─── Shared primitives ───────────────────────────────────────────────────────

function ShotBar({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 border-b-2 border-black bg-[#f6f3ec] font-mono text-[9.5px] font-bold tracking-[0.14em] text-black/30 uppercase">
      <span>{label}</span>
      <span className="flex gap-[5px]" aria-hidden="true">
        <i className="w-[7px] h-[7px] border border-black block" />
        <i className="w-[7px] h-[7px] border border-black block" />
        <i className="w-[7px] h-[7px] border border-black block" />
      </span>
    </div>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10.5px] font-bold tracking-[0.08em] uppercase border border-black px-[10px] py-[7px] inline-flex items-center gap-[7px]">
      {children}
    </span>
  );
}

// ─── Step layout ─────────────────────────────────────────────────────────────

interface StepProps {
  id: string;
  num: string;
  kicker: string;
  headline: React.ReactNode;
  body: React.ReactNode;
  keys: React.ReactNode[];
  media: React.ReactNode;
  mediaFirst?: boolean;
}

function Step({ id, num, kicker, headline, body, keys, media, mediaFirst }: StepProps) {
  return (
    <article
      id={id}
      className="grid grid-cols-1 min-[960px]:grid-cols-2 gap-[54px] items-center py-[54px] border-t border-black/12 scroll-mt-6"
    >
      <div className={mediaFirst ? "min-[960px]:order-last" : ""}>
        <div className="font-mono text-[11px] font-extrabold tracking-[0.2em] text-terracotta mb-4 flex items-center gap-3">
          {num} — <span>{kicker}</span>
          <span className="flex-1 h-px bg-black/12" aria-hidden="true" />
        </div>
        <h3 className="normal-case font-black text-[clamp(26px,3vw,40px)] leading-[1.02] tracking-[-0.02em] m-0 mb-[14px]">
          {headline}
        </h3>
        <div className="text-[15.5px] leading-[1.62] text-black/55 max-w-[440px] [&_b]:text-black [&_b]:font-bold mb-0">
          {body}
        </div>
        <div className="flex flex-wrap gap-2 mt-[18px]">
          {keys.map((k, i) => <Key key={i}>{k}</Key>)}
        </div>
      </div>
      <div className={mediaFirst ? "min-[960px]:order-first" : ""}>
        {media}
      </div>
    </article>
  );
}

// ─── Step 01 media: Option B mock ────────────────────────────────────────────

function AddMock() {
  return (
    <div className="border-2 border-black bg-[#efeae0]">
      <ShotBar label="TOP BAR · ADD" />
      <div className="p-6 flex flex-col gap-0">
        {/* Simulated top bar */}
        <div className="flex items-center gap-2 border-2 border-black bg-white px-3 py-2.5">
          <div className="flex-1 flex items-center gap-2 border border-black/12 bg-[#f6f3ec] px-3 py-2 font-mono text-[11px] font-semibold tracking-[0.08em] text-black/30">
            <span>⌕</span>
            <span>FILTER THE STREAM…</span>
          </div>
          <div className="flex items-center gap-[7px] bg-black text-[#f6f3ec] font-mono text-[11px] font-extrabold tracking-[0.12em] uppercase px-[13px] py-[9px]">
            <span className="text-terracotta">+</span>
            <span>ADD</span>
            <span className="text-[9px]">▾</span>
          </div>
        </div>

        {/* Popover */}
        <div className="self-end w-[min(340px,100%)] border-2 border-black bg-white mt-3">
          <div className="font-mono text-[9.5px] font-extrabold tracking-[0.16em] uppercase text-black/30 px-[13px] py-[10px] border-b border-black/12">
            PASTE A LINK
          </div>
          <div className="m-3 flex items-center gap-2 border border-black bg-[#f6f3ec] px-3 py-[10px] font-mono text-[11px] text-black/30">
            <span className="text-terracotta font-extrabold">›</span>
            <span>https://…</span>
          </div>
          {/* Choice: Follow */}
          <div className="flex items-start gap-3 px-[13px] py-3 border-t border-black/12">
            <div className="w-7 h-7 shrink-0 border-2 border-black flex items-center justify-center font-mono text-[14px] font-bold">+</div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[13px] font-extrabold text-black">Follow as source</span>
              <span className="text-[11px] text-black/55 leading-[1.4]">Get every new post in your stream.</span>
            </div>
          </div>
          {/* Choice: Save */}
          <div className="flex items-start gap-3 px-[13px] py-3 border-t border-black/12">
            <div className="w-7 h-7 shrink-0 bg-terracotta flex items-center justify-center text-black">
              <svg width="13" height="15" viewBox="0 0 14 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M2 1.6 H12 V14.4 L7 10.4 L2 14.4 Z" strokeLinejoin="miter" />
              </svg>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[13px] font-extrabold text-black">Save the link</span>
              <span className="text-[11px] text-black/55 leading-[1.4]">Drop it in Saved, to read once.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 07 media: CSV terminal card ────────────────────────────────────────

function CsvCard() {
  return (
    <div className="border-2 border-black bg-black text-[#f6f3ec]">
      <div className="flex items-center justify-between px-[13px] py-[9px] border-b border-white/16 font-mono text-[9.5px] font-bold tracking-[0.14em] uppercase text-white/55">
        <span>SETTINGS · DATA</span>
        <span className="text-terracotta font-bold">CSV</span>
      </div>
      <div className="px-5 py-6 font-mono text-[12.5px] leading-[2] flex flex-col gap-0">
        <div className="flex gap-3"><span className="text-terracotta">›</span><span><span className="text-white/55">open</span> <span className="text-[#f6f3ec] font-semibold">⚙ Settings</span></span></div>
        <div className="flex gap-3"><span className="text-terracotta">›</span><span><span className="text-[#f6f3ec] font-semibold">Import CSV</span> <span className="text-white/55">· upload your list</span></span></div>
        <div className="flex gap-3"><span className="text-terracotta">›</span><span><span className="text-[#f6f3ec] font-semibold">Export CSV</span> <span className="text-white/55">· download a backup</span></span></div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function GuidePage({ params }: Props) {
  const { lang } = await params;
  if (!isValidLang(lang)) notFound();
  const isIt = (lang as Lang) === "it";

  return (
    <>
      {/* Hero */}
      <header className="px-[34px] pt-[74px] pb-[30px] max-[960px]:px-[22px] max-[960px]:pt-12 max-[960px]:pb-6">
        <div className="max-w-[1200px] mx-auto">
          <p className="font-mono text-[10.5px] font-bold tracking-[0.18em] text-terracotta uppercase mb-[22px]">
            {isIt ? "// COME FUNZIONA · 8 COSE CHE PUOI FARE" : "// HOW IT WORKS · 08 THINGS YOU CAN DO"}
          </p>
          <div className="grid grid-cols-1 min-[960px]:grid-cols-[1.15fr_1fr] gap-12 items-end">
            <h1 className="normal-case font-black text-[clamp(38px,5vw,78px)] leading-[0.99] tracking-[-0.03em] m-0">
              {isIt ? (
                <>Tutto quello che fa MultivRSS, in <em className="not-italic text-terracotta">otto piccole mosse.</em></>
              ) : (
                <>Everything MultivRSS does, in{" "}
                <em className="not-italic text-terracotta">eight small moves.</em></>
              )}
            </h1>
            <p className="text-[16px] leading-[1.62] text-black/55 m-0 max-w-[480px]">
              {isIt ? (
                <>
                  Nessun manuale richiesto. Incolla un link, scegli qualche fonte, e hai
                  una stanza di lettura tranquilla tutta tua. Ecco tutto quanto:{" "}
                  <strong className="text-black font-bold">
                    ogni passo è uno screenshot e un soffio di testo.
                  </strong>
                </>
              ) : (
                <>
                  No manual required. Paste a link, pick a few sources, and you have
                  a calm reading room that&apos;s all yours. Here&apos;s the whole thing:{" "}
                  <strong className="text-black font-bold">
                    each step is one screenshot and one breath of text.
                  </strong>
                </>
              )}
            </p>
          </div>
        </div>
      </header>

      {/* Quick index */}
      <section className="px-[34px] pb-[40px] max-[960px]:px-[22px] max-[960px]:pb-7" aria-label={isIt ? "Indice dei passi" : "Steps index"}>
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-4 max-[960px]:grid-cols-2 max-[560px]:grid-cols-1 border-t-2 border-l-2 border-black">
            {(isIt
              ? [
                  ["01", "#s01", "Aggiungi una fonte"],
                  ["02", "#s02", "Organizza in categorie"],
                  ["03", "#s03", "Front Page & River"],
                  ["04", "#s04", "Salva e assegna tag"],
                  ["05", "#s05", "Cerca e filtra"],
                  ["06", "#s06", "Sincronizza"],
                  ["07", "#s07", "Importa / Esporta CSV"],
                  ["08", "#s08", "Sul telefono"],
                ]
              : [
                  ["01", "#s01", "Add a source"],
                  ["02", "#s02", "Sort into categories"],
                  ["03", "#s03", "Front Page & River"],
                  ["04", "#s04", "Save & tag"],
                  ["05", "#s05", "Search & filter"],
                  ["06", "#s06", "Sync"],
                  ["07", "#s07", "Import / Export CSV"],
                  ["08", "#s08", "On your phone"],
                ]
            ).map(([num, href, label]) => (
              <a
                key={num}
                href={href}
                className="border-r-2 border-b-2 border-black px-4 py-4 pb-[18px] flex flex-col gap-[7px] transition-colors hover:bg-black hover:text-[#f6f3ec] group"
              >
                <span className="font-mono text-[10.5px] font-extrabold tracking-[0.16em] text-terracotta group-hover:text-terracotta">
                  {num}
                </span>
                <span className="text-[14.5px] font-bold tracking-[-0.005em] leading-[1.2]">{label}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="px-[34px] pb-5 max-[960px]:px-[22px]">
        <div className="max-w-[1200px] mx-auto">

          {/* 01 — Add a source */}
          <Step
            id="s01"
            num="01"
            kicker={isIt ? "AGGIUNGI UNA FONTE" : "ADD A SOURCE"}
            headline={isIt
              ? <>Un solo bottone. <em className="not-italic text-terracotta">Poi scegli.</em></>
              : <>One button. <em className="not-italic text-terracotta">Then choose.</em></>}
            body={
              isIt ? (
                <p className="m-0">
                  Premi <b>+ Add</b> e incolla un link qualsiasi: un blog, una Substack, un
                  canale YouTube. MultivRSS ti chiede una cosa sola: <b>seguirlo come fonte</b> per
                  ricevere ogni nuovo post, oppure <b>salvare il link</b> per leggerlo una volta sola.
                  Niente gergo, niente indovinelli.
                </p>
              ) : (
                <p className="m-0">
                  Hit <b>+ Add</b> and paste any link: a blog, a Substack, a YouTube channel.
                  MultivRSS asks one simple thing: <b>follow it as a source</b> to get every new
                  post, or <b>save the link</b> to read once. No jargon, no guessing.
                </p>
              )
            }
            keys={[
              <><span className="text-terracotta">+</span> ADD</>,
              <><span className="text-terracotta">+</span> FOLLOW</>,
              <><span className="text-terracotta">🔖</span> SAVE</>,
            ]}
            media={<AddMock />}
            mediaFirst={false}
          />

          {/* 02 — Categories */}
          <Step
            id="s02"
            num="02"
            kicker={isIt ? "CATEGORIE" : "CATEGORIES"}
            headline={isIt
              ? <>Tieni i tuoi feed <em className="not-italic text-terracotta">in ordine.</em></>
              : <>Keep your feeds <em className="not-italic text-terracotta">tidy.</em></>}
            body={
              isIt ? (
                <p className="m-0">
                  Ogni fonte vive in una categoria nella barra laterale: Cultura, Musica,
                  Notizie, quello che vuoi. Il piccolo <b>+</b> accanto a una categoria aggiunge
                  una fonte direttamente lì dentro, e puoi rinominare o riordinare quando vuoi.
                </p>
              ) : (
                <p className="m-0">
                  Every source lives in a category in the left sidebar: Culture, Music, News,
                  whatever you like. The little <b>+</b> next to a category adds a source straight
                  into it, and you can rename or reorder anytime.
                </p>
              )
            }
            keys={[
              "SIDEBAR",
              <><span className="text-terracotta">+</span> ADD TO CATEGORY</>,
            ]}
            media={
              <div className="border-2 border-black bg-[#efeae0]">
                <ShotBar label="SIDEBAR · NAV_ROOT" />
                <div className="flex items-center justify-center p-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/guide/img/sidebar.png"
                    alt={isIt ? "Barra laterale con categorie e pulsanti per aggiungere fonti" : "Sidebar with categories and add buttons"}
                    className="w-auto max-h-[520px] max-w-full block"
                    style={{ padding: "22px" }}
                  />
                </div>
              </div>
            }
            mediaFirst
          />

          {/* 03 — Front Page & River */}
          <Step
            id="s03"
            num="03"
            kicker="FRONT PAGE & RIVER"
            headline={isIt
              ? <>Due modi di <em className="not-italic text-terracotta">leggere.</em></>
              : <>Two ways to <em className="not-italic text-terracotta">read.</em></>}
            body={
              isIt ? (
                <p className="m-0">
                  La <b>Front Page</b> è la tua edizione personale, costruita da quello che
                  leggi e salvi davvero, raggruppata per categoria. Vuoi il flusso grezzo e
                  senza filtri? Passa a <b>River</b> per avere tutto in ordine, dal più recente.
                </p>
              ) : (
                <p className="m-0">
                  The <b>Front Page</b> is your personal edition, assembled from what you actually
                  read and saved, grouped by category. Want the raw, unfiltered flow instead? Flip
                  to <b>River</b> for everything in order, newest first.
                </p>
              )
            }
            keys={["▤ FRONT PAGE", "≡ RIVER"]}
            media={
              <div className="border-2 border-black bg-[#efeae0]">
                <ShotBar label="YOUR EDITION · FOR YOU" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/guide/img/frontpage.png" alt={isIt ? "La Front Page con le card For You" : "The Front Page with For You cards"} className="w-full h-auto block" />
              </div>
            }
            mediaFirst={false}
          />

          {/* 04 — Save & tag */}
          <Step
            id="s04"
            num="04"
            kicker={isIt ? "SALVA E TAGGA" : "SAVE & TAG"}
            headline={isIt
              ? <>Tieni le cose buone, <em className="not-italic text-terracotta">etichettale.</em></>
              : <>Keep the good ones, <em className="not-italic text-terracotta">label them.</em></>}
            body={
              isIt ? (
                <p className="m-0">
                  Tocca il segnalibro su qualsiasi elemento per metterlo in <b>Saved</b>. Poi premi{" "}
                  <b>+ TAG</b> per archiviarlo sotto le tue etichette: scrivine una nuova o
                  scegline una dall&apos;elenco. Il te del futuro lo ritroverà in un secondo.
                </p>
              ) : (
                <p className="m-0">
                  Tap the bookmark on any item to drop it in <b>Saved</b>. Then hit <b>+ TAG</b> to
                  file it under your own labels: type a new one or pick from the directory.
                  Future-you will find it in seconds.
                </p>
              )
            }
            keys={[
              <><span className="text-terracotta">▢</span> SAVE</>,
              <><span className="text-terracotta">#</span> ASSIGN TAGS</>,
            ]}
            media={
              <div className="border-2 border-black bg-[#efeae0]">
                <ShotBar label="SAVED · ASSIGN_TAGS" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/guide/img/tags-modal.png" alt={isIt ? "Modale per assegnare i tag sopra l'elenco dei salvati" : "Assign tags modal over the saved list"} className="w-full h-auto block" />
              </div>
            }
            mediaFirst
          />

          {/* 05 — Search & filter */}
          <Step
            id="s05"
            num="05"
            kicker={isIt ? "CERCA E FILTRA" : "SEARCH & FILTER"}
            headline={isIt
              ? <>Trova qualsiasi cosa, <em className="not-italic text-terracotta">in fretta.</em></>
              : <>Find anything, <em className="not-italic text-terracotta">fast.</em></>}
            body={
              isIt ? (
                <p className="m-0">
                  Inizia a scrivere in <b>Filter the stream</b> e i risultati si restringono
                  all&apos;istante su tutte le tue fonti. Vuoi restringere ancora? Passa tra{" "}
                  <b>All · Unread · Read</b>, oppure vai direttamente a una singola categoria.
                </p>
              ) : (
                <p className="m-0">
                  Start typing in <b>Filter the stream</b> and results narrow instantly across all
                  your sources. Need to tighten it? Switch between <b>All · Unread · Read</b>, or
                  jump to a single category.
                </p>
              )
            }
            keys={[
              <><span className="text-terracotta">⌕</span> FILTER THE STREAM</>,
              "ALL / UNREAD / READ",
            ]}
            media={
              <div className="border-2 border-black bg-[#efeae0]">
                <ShotBar label="TOP BAR · FILTER" />
                <div className="flex items-center justify-center p-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/guide/img/cmd-search.png" alt={isIt ? "Campo di ricerca Filter the stream" : "Filter the stream search field"} className="w-full h-auto block" />
                </div>
              </div>
            }
            mediaFirst={false}
          />

          {/* 06 — Sync */}
          <Step
            id="s06"
            num="06"
            kicker={isIt ? "SINCRONIZZAZIONE" : "SYNC"}
            headline={isIt
              ? <>Sempre <em className="not-italic text-terracotta">aggiornato.</em></>
              : <>Always <em className="not-italic text-terracotta">up to date.</em></>}
            body={
              isIt ? (
                <p className="m-0">
                  MultivRSS aggiorna i tuoi feed in background, quindi di solito non c&apos;è
                  nulla da fare. Vuoi l&apos;ultimissima novità proprio adesso? Premi{" "}
                  <b>Sync</b> e in un secondo scarica tutto di fresco.
                </p>
              ) : (
                <p className="m-0">
                  MultivRSS refreshes your feeds in the background, so there&apos;s usually nothing
                  to do. Want the very latest right now? Hit <b>Sync</b> and it pulls everything
                  fresh in a second.
                </p>
              )
            }
            keys={[
              <><span className="text-terracotta">↻</span> SYNC</>,
              "AUTO · BACKGROUND",
            ]}
            media={
              <div className="border-2 border-black bg-[#efeae0]">
                <ShotBar label="TOP BAR · SYNC" />
                <div className="flex items-center justify-center p-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/guide/img/cmd-sync.png" alt={isIt ? "Pulsante Sync nella barra superiore" : "Sync button in the top bar"} className="w-full h-auto block" />
                </div>
              </div>
            }
            mediaFirst
          />

          {/* 07 — Import / Export */}
          <Step
            id="s07"
            num="07"
            kicker={isIt ? "IMPORTA / ESPORTA" : "IMPORT / EXPORT"}
            headline={isIt
              ? <>Il tuo elenco, <em className="not-italic text-terracotta">portatile.</em></>
              : <>Your list, <em className="not-italic text-terracotta">portable.</em></>}
            body={
              isIt ? (
                <p className="m-0">
                  Vieni da un altro lettore? Porta tutto il tuo elenco di iscrizioni con un file{" "}
                  <b>CSV</b>. Stai lasciando il servizio, facendo un backup o condividendo?
                  Esportalo allo stesso modo. Le tue fonti sono sempre tue da portare via.
                </p>
              ) : (
                <p className="m-0">
                  Coming from another reader? Bring your whole subscription list in as a <b>CSV</b>.
                  Leaving, backing up, or sharing? Export it the same way. Your sources are always
                  yours to take.
                </p>
              )
            }
            keys={[
              <><span className="text-terracotta">⚙</span> SETTINGS</>,
            ]}
            media={<CsvCard />}
            mediaFirst={false}
          />

          {/* 08 — On mobile */}
          <Step
            id="s08"
            num="08"
            kicker={isIt ? "SU MOBILE" : "ON MOBILE"}
            headline={isIt
              ? <>La stessa stanza, <em className="not-italic text-terracotta">in tasca.</em></>
              : <>The same room, <em className="not-italic text-terracotta">in your pocket.</em></>}
            body={
              isIt ? (
                <p className="m-0">
                  Tutto sta in un telefono. La barra delle schede in basso ti porta tra Front
                  Page, River e Saved; scorri la striscia delle categorie per cambiare sezione.
                  Stessa lettura tranquilla, un solo pollice.
                </p>
              ) : (
                <p className="m-0">
                  Everything fits a phone. The bottom tab bar takes you between Front Page, River
                  and Saved; swipe the category strip to switch sections. Same calm reading, one
                  thumb.
                </p>
              )
            }
            keys={["TAB BAR", "CATEGORY STRIP"]}
            media={
              <div className="border-2 border-black bg-[#efeae0]">
                <ShotBar label="MOBILE · RESPONSIVE" />
                {/* eslint-disable @next/next/no-img-element */}
                <div className="flex gap-5 items-center justify-center p-6 bg-[#1d1b18] max-[560px]:flex-wrap">
                  <img src="/guide/img/mobile-front.png" alt={isIt ? "Front Page su mobile" : "Mobile front page"} className="h-[360px] w-auto block border border-white/14 max-[560px]:h-[280px]" />
                  <img src="/guide/img/mobile-river.png" alt={isIt ? "River su mobile" : "Mobile river"} className="h-[360px] w-auto block border border-white/14 max-[560px]:h-[280px]" />
                  <img src="/guide/img/mobile-cat.png" alt={isIt ? "Vista categorie su mobile" : "Mobile category view"} className="h-[360px] w-auto block border border-white/14 max-[560px]:h-[280px]" />
                </div>
                {/* eslint-enable @next/next/no-img-element */}
              </div>
            }
            mediaFirst
          />

        </div>
      </section>

      {/* Closing CTA */}
      <section className="px-[34px] py-[92px] bg-black text-[#f6f3ec] border-t-2 border-black text-center max-[960px]:px-[22px] max-[960px]:py-[66px]">
        <p className="font-mono text-[11px] font-extrabold tracking-[0.24em] text-terracotta mb-[18px]">
          {isIt ? "// TUTTO QUI" : "// THAT'S THE WHOLE THING"}
        </p>
        <h2 className="normal-case font-black text-[clamp(32px,4.4vw,64px)] tracking-[-0.03em] leading-[1.02] m-0 mb-5">
          {isIt ? (
            <>Otto mosse. <em className="not-italic text-terracotta">Un fiume tranquillo.</em></>
          ) : (
            <>Eight moves. <em className="not-italic text-terracotta">One quiet river.</em></>
          )}
        </h2>
        <p className="text-[15.5px] text-white/55 max-w-[520px] mx-auto mb-8 leading-[1.6]">
          {isIt ? (
            <>Aggiungi qualche fonte, salva ciò che conta, e lascia che la Front Page faccia
            il resto. Nessun algoritmo, nessun rumore: solo le novità dal web che hai scelto.</>
          ) : (
            <>Add a few sources, save what matters, and let the Front Page do the rest. No
            algorithm, no noise: just what&apos;s new from the web you chose.</>
          )}
        </p>
        <Link
          href="/register"
          className="inline-block bg-terracotta text-black border-2 border-terracotta px-[20px] py-[14px] font-mono text-[11.5px] font-extrabold tracking-[0.2em] uppercase hover:bg-black hover:text-terracotta hover:border-black transition-colors"
        >
          {isIt ? "→ INIZIA A LEGGERE" : "→ START READING"}
        </Link>
      </section>
    </>
  );
}
