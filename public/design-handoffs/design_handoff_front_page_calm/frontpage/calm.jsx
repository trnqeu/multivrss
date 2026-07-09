/* global React, window */
// MultivRSS — FRONT PAGE, minimalism restored.
// Same data & cream theme as the live product, but the chrome is dialed back so
// the headlines carry the page again. Four levers let you compare directions:
//   chrome  calm | busy        — actions hover-reveal vs always-on; meta density
//   header  oneline | full     — one quiet dateline vs the 3 stacked meta rows
//   accent  restrained | everywhere — terracotta as a rare highlight vs on everything

const { FP_DATA } = window;

// ── tiny icons ──
function Bookmark({ filled, size = 13 }) {
  return (
    <svg width={size} height={size * 1.25} viewBox="0 0 12 15" style={{ display: 'block' }}>
      <path d="M1 1h10v12.4l-5-3.1-5 3.1z" fill={filled ? 'currentColor' : 'none'}
            stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
function RssGlyph() {
  return <svg width="13" height="13" viewBox="0 0 12 12"><circle cx="2" cy="10" r="1.5" fill="currentColor" /><path d="M1 5.5a5.5 5.5 0 0 1 5.5 5.5M1 1.5A9.5 9.5 0 0 1 10.5 11" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>;
}
function DiscoverGlyph() {
  return <svg width="13" height="13" viewBox="0 0 12 12"><circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" strokeWidth="1.4" /><path d="M8.2 3.8 6.6 6.6 3.8 8.2 5.4 5.4z" fill="currentColor" /></svg>;
}

// ════════════════ SIDEBAR ════════════════
function Sidebar() {
  const { CATS } = FP_DATA;
  return (
    <aside className="sb">
      <div className="sb__brand">
        <img src="assets/multivrss-ico.png" alt="" className="sb__logo" />
        <span className="sb__name">multivrss</span>
      </div>
      <nav className="sb__nav">
        <div className="navitem active"><span className="navitem__i"><RssGlyph /></span><span className="navitem__l">All Feeds</span></div>
        <div className="navitem"><span className="navitem__i"><Bookmark size={12} /></span><span className="navitem__l">Saved</span><span className="navitem__c">28</span></div>
        <div className="navitem"><span className="navitem__i"><DiscoverGlyph /></span><span className="navitem__l">Suggested</span></div>
        <div className="sb__cats">
          {CATS.map(c => (
            <div key={c.name} className="sbcat">
              <span className="sbcat__n">{c.name}</span>
              <span className="sbcat__c">{String(c.count).padStart(2, '0')}</span>
            </div>
          ))}
        </div>
      </nav>
    </aside>
  );
}

// ════════════════ TOP BAR ════════════════
function TopBar() {
  return (
    <header className="top">
      <div className="search"><span className="search__q">Q</span><span className="search__ph">Filter the stream…</span></div>
      <div className="flex1" />
      <div className="tabs">
        <button className="tab on">Front Page</button>
        <button className="tab">River</button>
      </div>
      <div className="flex1" />
      <button className="tbtn tbtn--source"><span className="tbtn__plus">+</span>Source</button>
      <button className="tbtn tbtn--url">URL</button>
      <button className="tbtn tbtn--ghost">↻ Sync</button>
      <span className="tico">◑</span>
      <span className="tico">⚙</span>
    </header>
  );
}

// ── hover-reveal action cluster ──
function Actions() {
  return (
    <span className="acts">
      <button className="act" title="Save"><Bookmark size={12} /></button>
      <button className="act act--tag" title="Tag">＋</button>
      <button className="act act--x" title="Dismiss">×</button>
    </span>
  );
}

function Meta({ item, accent }) {
  return (
    <span className="meta">
      <span className={accent === 'everywhere' ? 'meta__src meta__src--tc' : 'meta__src'}>{item.src}</span>
      <span className="meta__dot">·</span>
      <span className="meta__date">{item.date}</span>
    </span>
  );
}

// ════════════════ MASTHEAD ════════════════
function Masthead({ header }) {
  return (
    <div className="mast">
      {header === 'full' ? (
        <>
          <div className="mast__meta">
            <span>Your Edition</span><span className="mast__dot">·</span>
            <span>Mon, Jun 22 2026</span><span className="mast__dot">·</span>
            <span className="tc">Assembled from what you read &amp; saved</span>
          </div>
          <div className="mast__meta">
            <span>Curated from</span><b>25 read</b><span className="mast__dot">·</span>
            <b>2 saved</b><span className="mast__dot">·</span><span>across</span><b>11 categories</b>
          </div>
        </>
      ) : (
        <div className="mast__meta mast__line">
          <span>Mon, Jun 22</span><span className="mast__dot">·</span>
          <span>Curated from <b>25 read</b>, <b>2 saved</b> across <b>11 categories</b></span>
        </div>
      )}
    </div>
  );
}

// ════════════════ FOR YOU ════════════════
function ForYou({ t }) {
  const { LEAD, FORYOU } = FP_DATA;
  const items = [LEAD, ...FORYOU].slice(0, 4);
  return (
    <section className="band">
      <div className="band__head"><span className="band__kick">For You</span><span className="band__line" /></div>
      <div className="strip">
        {items.map((it, i) => (
          <article key={i} className="card">
            <span className="card__cat">{it.cat}</span>
            <h3 className="card__title">{it.title}</h3>
            <div className="card__foot">
              <Meta item={it} accent={t.accent} />
              <Actions />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

// ════════════════ CATEGORY SECTION ════════════════
function Section({ cat, items, t }) {
  const [lead, ...rest] = items;
  return (
    <section className="sect">
      <div className="sect__head"><span className="sect__name">{cat}</span><span className="sect__line" /></div>
      <div className="sect__body">
        <article className="lead">
          <h3 className="lead__title">{lead.title}</h3>
          {lead.dek && <p className="lead__dek">{lead.dek}</p>}
          <div className="lead__foot"><Meta item={lead} accent={t.accent} /><Actions /></div>
        </article>
        <ul className="list">
          {rest.map((it, i) => (
            <li key={i} className="row">
              <a className="row__title">{it.title}</a>
              <div className="row__foot"><Meta item={it} accent={t.accent} /><Actions /></div>
            </li>
          ))}
        </ul>
      </div>
      <div className="sect__foot"><a className="sect__all"><span className="sect__all__t">See all in {cat}</span><span className="sect__all__arr">→</span></a></div>
    </section>
  );
}

function FrontPage({ t }) {
  const { STORIES } = FP_DATA;
  return (
    <div className={`fp accent-${t.accent} chrome-${t.chrome}`}>
      <Masthead header={t.header} />
      <ForYou t={t} />
      <div className="sects">
        {Object.keys(STORIES).map(cat => <Section key={cat} cat={cat} items={STORIES[cat]} t={t} />)}
      </div>
    </div>
  );
}

Object.assign(window, { CalmSidebar: Sidebar, CalmTopBar: TopBar, CalmFrontPage: FrontPage });
