/* global React, window */
// MultivRSS app chrome — faithful recreation: sidebar, top bar, telemetry, RIVER view.

function Bookmark({ filled, size = 11 }) {
  return (
    <svg width={size} height={size * 1.25} viewBox="0 0 12 15" style={{ display: 'inline-block', verticalAlign: 'baseline' }}>
      <path d="M1 1h10v12.4l-5-3.1-5 3.1z" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
function RssGlyph() {
  return <svg width="12" height="12" viewBox="0 0 12 12"><circle cx="2" cy="10" r="1.4" fill="currentColor" /><path d="M1 5.5a5.5 5.5 0 0 1 5.5 5.5M1 1.5A9.5 9.5 0 0 1 10.5 11" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>;
}
function DiscoverGlyph() {
  return <svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M8.2 3.8 6.6 6.6 3.8 8.2 5.4 5.4z" fill="currentColor" /></svg>;
}

function Sidebar({ view }) {
  const { CATS } = window.FP_DATA;
  return (
    <aside className="sb">
      <div className="sb__brand">
        <img src="assets/multivrss-ico.png" alt="" className="sb__logo" />
        <span className="sb__name">multivrss</span>
      </div>
      <div className="sb__sync"><span className="sb__dot" /> LAST SYNC 4M AGO</div>
      <nav className="sb__nav">
        <span className="lbl muted">NAV_ROOT</span>
        <div className={`navitem ${view === 'river' ? 'active' : ''}`}><span className="navitem__i"><RssGlyph /></span><span>All Feeds</span></div>
        <div className="navitem"><span className="navitem__i"><Bookmark size={11} /></span><span className="navitem__l">Saved</span><span className="navitem__c">28</span></div>
        <div className="navitem"><span className="navitem__i"><DiscoverGlyph /></span><span className="navitem__l">Suggested</span></div>
        <span className="lbl muted sb__catlbl">CATEGORIES</span>
        {CATS.map(c => (
          <div key={c.name} className="sbcat">
            <div className="sbcat__head"><span className="lbl">{c.name}</span><span className="lbl sbcat__n">{String(c.sources.length).padStart(2, '0')}</span></div>
            <div className="sbcat__src">{c.sources.map(s => <div key={s} className="sbcat__s">{s}</div>)}</div>
          </div>
        ))}
      </nav>
      <div className="sb__foot lbl">Connection: [PROTECTED]<br />Node: MULTIVRSS_ALPHA</div>
    </aside>
  );
}

function TopBar({ view, setView, switchStyle }) {
  return (
    <header className="top">
      <div className="flex1" />
      <div className="search"><span className="search__q">Q</span><span className="search__ph">filter the stream...</span></div>
      {switchStyle === 'segmented' && <ViewSwitch view={view} setView={setView} kind="seg" />}
      {switchStyle === 'pill' && <ViewSwitch view={view} setView={setView} kind="pill" />}
      <div className="ingest">
        <span className="ingest__plus">+</span>
        <button className="ingest__b">SOURCE</button>
        <button className="ingest__b">URL</button>
      </div>
      <button className="top__sync">↻ SYNC</button>
      <span className="top__ico">◑</span>
      <span className="top__ico">⚙</span>
    </header>
  );
}

function ViewSwitch({ view, setView, kind }) {
  if (kind === 'seg') {
    return (
      <div className="vswitch" role="tablist" aria-label="View">
        <button role="tab" aria-selected={view === 'river'} className={`vswitch__b ${view === 'river' ? 'on' : ''}`} onClick={() => setView('river')}>≡ RIVER</button>
        <button role="tab" aria-selected={view === 'front'} className={`vswitch__b ${view === 'front' ? 'on' : ''}`} onClick={() => setView('front')}>▤ FRONT PAGE</button>
      </div>
    );
  }
  // pill: single toggle that flips
  const next = view === 'river' ? 'front' : 'river';
  return (
    <button className="vpill" onClick={() => setView(next)} aria-label="Toggle view">
      <span className={`vpill__s ${view === 'river' ? 'on' : ''}`}>RIVER</span>
      <span className="vpill__knob" data-pos={view} />
      <span className={`vpill__s ${view === 'front' ? 'on' : ''}`}>FRONT</span>
    </button>
  );
}

// Tabs that sit above the content (alternative switch placement)
function ViewTabs({ view, setView }) {
  return (
    <div className="vtabs" role="tablist" aria-label="View">
      <button role="tab" aria-selected={view === 'river'} className={`vtab ${view === 'river' ? 'on' : ''}`} onClick={() => setView('river')}>≡ RIVER</button>
      <button role="tab" aria-selected={view === 'front'} className={`vtab ${view === 'front' ? 'on' : ''}`} onClick={() => setView('front')}>▤ FRONT PAGE</button>
      <div className="vtabs__spacer" />
      <span className="vtabs__hint lbl muted">{view === 'front' ? 'CURATED FOR YOU' : 'NEWEST FIRST'}</span>
    </div>
  );
}

function Telemetry({ view }) {
  if (view === 'front') {
    return (
      <div className="tele">
        CURATED FROM <b>142 READ</b><span className="tg">·</span><b>28 SAVED</b><span className="tg">·</span>
        ACROSS <b>6 CATEGORIES</b><span className="tg">·</span>UPDATED <b>4M AGO</b>
      </div>
    );
  }
  return (
    <div className="tele">
      INDEX: <b>11 / 373 ITEMS</b><span className="tg">·</span>TIME: <b>3 MS</b><span className="tg">·</span>
      FILTER: <b className="tcu">ALL</b><span className="tg-s">·</span><span className="tg-d">UNREAD</span><span className="tg-s">·</span><span className="tg-d">READ</span>
      <span className="tg">·</span>CAT: <b className="tg-d">ALL ▾</b>
    </div>
  );
}

function RiverView() {
  const { RIVER } = window.FP_DATA;
  let lastDay = null;
  return (
    <div className="river">
      {RIVER.map((it, i) => {
        const day = it.date;
        const newDay = day !== lastDay; lastDay = day;
        return (
          <React.Fragment key={i}>
            {newDay && (
              <div className="daymark"><span className="daymark__l">— {it.date.toUpperCase()}</span><span className="daymark__line" /><span className="daymark__a">→</span></div>
            )}
            <span className={`rv ${it.read ? 'read' : ''}`}>
              <span className="rv__dot">{it.read ? '●' : '○'}</span>
              <span className="rv__src">{it.src}</span><span className="rv__mid">·</span>
              <span className="rv__date">{it.date}</span><span className="rv__mid">·</span>
              <span className="rv__title">{it.title}</span> <span className="rv__mid">—</span> <span className="rv__body">{it.body}…</span>
              <span className="rv__bk"><Bookmark size={11} /></span>
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );
}

Object.assign(window, { Bookmark, Sidebar, TopBar, ViewSwitch, ViewTabs, Telemetry, RiverView });
