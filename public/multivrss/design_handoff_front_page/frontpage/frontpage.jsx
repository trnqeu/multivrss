/* global React, window */
// The personalized FRONT PAGE view — 3 layouts: editorial · digest · sections.
// Personalization signal is configurable: reasons · affinity · badge · none.

const { Bookmark } = window;

// Two recommendation engines, surfaced distinctly:
//   source  → affinity with a feed you read/save from   (filled diamond)
//   similar → Meilisearch relevance on your recent reads (spark)
function Reason({ item, signal }) {
  if (signal === 'none') return null;
  if (!item.reason && signal !== 'affinity') {
    if (signal === 'badge') return <span className="fp-badge">PICKED</span>;
    return null;
  }
  if (signal === 'badge') return <span className="fp-badge">{item.reason ? 'FOR YOU' : 'PICKED'}</span>;
  const type = item.reasonType || 'similar';
  const glyph = type === 'source' ? '◆' : '✦';
  const affTip = type === 'source' ? `${item.affinity}% source affinity` : `${item.affinity}% relevance`;
  return (
    <span className={`reason reason--${type}`}>
      <span className="reason__spark" title={type === 'source' ? 'From a source you follow closely' : 'Similar to what you read & saved'}>{glyph}</span>
      <span className="reason__txt">{item.reason || 'Picked for you'}</span>
      {signal === 'affinity' && typeof item.affinity === 'number' && (
        <span className="reason__aff" title={affTip}>
          <span className="reason__bar"><span className="reason__fill" style={{ width: item.affinity + '%' }} /></span>
          <span className="reason__pct">{item.affinity}</span>
        </span>
      )}
    </span>
  );
}

function CatTag({ name }) { return <span className="fp-cat">{name}</span>; }

// ── Masthead ──
function Masthead() {
  return (
    <div className="mast">
      <div className="mast__l">
        <h1 className="mast__title">THE FRONT PAGE</h1>
        <div className="mast__rule" />
      </div>
      <div className="mast__meta lbl">
        <span>YOUR EDITION</span><span className="mast__dot">·</span>
        <span>FRI · JUN 20 2026</span><span className="mast__dot">·</span>
        <span className="tc">ASSEMBLED FROM WHAT YOU READ &amp; SAVED</span>
      </div>
      <div className="mast__legend lbl muted">
        <span className="mast__leg"><b className="tc">◆</b> FROM SOURCES YOU FOLLOW</span>
        <span className="mast__dot">·</span>
        <span className="mast__leg"><b className="tc">✦</b> SIMILAR TO YOUR READS &amp; SAVES</span>
      </div>
    </div>
  );
}

// ════════════════ EDITORIAL ════════════════
function Editorial({ signal }) {
  const { LEAD, FORYOU, STORIES } = window.FP_DATA;
  return (
    <div className="fp fp--editorial">
      <Masthead />
      {/* FOR YOU band */}
      <section className="band">
        <div className="band__head"><span className="band__kick">— FOR YOU</span><span className="band__line" /><span className="band__sub lbl muted">TOP PICKS · ALL CATEGORIES</span></div>
        <div className="band__grid">
          <article className="hero">
            <div className="hero__top"><CatTag name={LEAD.cat} /><Reason item={LEAD} signal={signal} /></div>
            <h2 className="hero__title">{LEAD.title}</h2>
            <p className="hero__dek">{LEAD.dek}</p>
            <div className="hero__foot"><span className="src">{LEAD.src}</span><span className="mid">·</span><span className="date">{LEAD.date}</span><span className="mid">·</span><span className="rt">{LEAD.read_min} MIN</span><span className="hero__bk"><Bookmark size={12} /></span></div>
          </article>
          <div className="picks">
            {FORYOU.map((it, i) => (
              <article key={i} className="pick">
                <div className="pick__top"><CatTag name={it.cat} /><Reason item={it} signal={signal} /></div>
                <h3 className="pick__title">{it.title}</h3>
                {it.dek && <p className="pick__dek">{it.dek}</p>}
                <div className="pick__foot"><span className="src">{it.src}</span><span className="mid">·</span><span className="date">{it.date}</span></div>
              </article>
            ))}
          </div>
        </div>
      </section>
      {/* Category sections */}
      <div className="sections">
        {Object.keys(STORIES).map(cat => <CatSection key={cat} cat={cat} items={STORIES[cat]} signal={signal} />)}
      </div>
    </div>
  );
}

function CatSection({ cat, items }) {
  const lead = items[0];
  const rest = items.slice(1);
  return (
    <section className="sect">
      <div className="sect__head"><span className="sect__name">— {cat}</span><span className="sect__line" /><span className="sect__arr">→</span></div>
      <div className="sect__body">
        <article className="sect__lead">
          {lead.reason && <Reason item={lead} signal={window.__FP_SIGNAL} />}
          <h3 className="sect__leadtitle">{lead.title}</h3>
          {lead.dek && <p className="sect__leaddek">{lead.dek}</p>}
          <div className="sect__leadfoot"><span className="src">{lead.src}</span><span className="mid">·</span><span className="date">{lead.date}</span></div>
        </article>
        <ul className="sect__list">
          {rest.map((it, i) => (
            <li key={i} className="sl">
              <a className="sl__title">{it.title}</a>
              <div className="sl__foot"><span className="src">{it.src}</span><span className="mid">·</span><span className="date">{it.date}</span></div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ════════════════ DIGEST (compact ranked) ════════════════
function Digest({ signal }) {
  const { LEAD, FORYOU, STORIES } = window.FP_DATA;
  const ranked = [LEAD, ...FORYOU,
    ...Object.values(STORIES).flat().filter(s => !s.lead || true).slice(0, 0)];
  // build a single ranked list: lead + foryou + each section lead, sorted by affinity
  const pool = [LEAD, ...FORYOU, ...Object.keys(STORIES).map(c => ({ ...STORIES[c][0], cat: c }))]
    .sort((a, b) => (b.affinity || 0) - (a.affinity || 0));
  return (
    <div className="fp fp--digest">
      <Masthead />
      <section className="band">
        <div className="band__head"><span className="band__kick">— TODAY’S DIGEST</span><span className="band__line" /><span className="band__sub lbl muted">RANKED BY MATCH</span></div>
        <ol className="dg">
          {pool.map((it, i) => (
            <li key={i} className="dg__row">
              <span className="dg__rank">{String(i + 1).padStart(2, '0')}</span>
              <div className="dg__body">
                <div className="dg__top"><CatTag name={it.cat} /><Reason item={it} signal={signal} /></div>
                <h3 className="dg__title">{it.title}</h3>
                {it.dek && <p className="dg__dek">{it.dek}</p>}
                <div className="dg__foot"><span className="src">{it.src}</span><span className="mid">·</span><span className="date">{it.date}</span></div>
              </div>
              <span className="dg__bk"><Bookmark size={12} /></span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

// ════════════════ SECTIONS (category grid, equal weight) ════════════════
function Sections({ signal }) {
  const { LEAD, FORYOU, STORIES } = window.FP_DATA;
  const strip = [LEAD, ...FORYOU].slice(0, 4);
  return (
    <div className="fp fp--sections">
      <Masthead />
      <section className="strip">
        <div className="strip__head"><span className="band__kick">— FOR YOU</span><span className="band__line" /></div>
        <div className="strip__row">
          {strip.map((it, i) => (
            <article key={i} className="scard scard--foryou">
              <div className="scard__top"><CatTag name={it.cat} />{signal !== 'none' && <span className="reason__spark">✦</span>}</div>
              <h3 className="scard__title">{it.title}</h3>
              <div className="scard__foot"><span className="src">{it.src}</span><span className="mid">·</span><span className="date">{it.date}</span></div>
              <Reason item={it} signal={signal === 'badge' ? 'badge' : (signal === 'none' ? 'none' : 'reasons')} />
            </article>
          ))}
        </div>
      </section>
      <div className="grid">
        {Object.keys(STORIES).map(cat => (
          <section key={cat} className="gcol">
            <div className="gcol__head"><span className="sect__name">— {cat}</span><span className="gcol__n lbl muted">{window.FP_DATA.CATS.find(c => c.name === cat)?.count}</span></div>
            <ul className="gcol__list">
              {STORIES[cat].map((it, i) => (
                <li key={i} className={`gl ${i === 0 ? 'gl--lead' : ''}`}>
                  <a className="gl__title">{it.title}</a>
                  <div className="gl__foot"><span className="src">{it.src}</span><span className="mid">·</span><span className="date">{it.date}</span></div>
                  {i === 0 && it.reason && <Reason item={it} signal={signal} />}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function FrontPage({ layout, signal }) {
  window.__FP_SIGNAL = signal;
  if (layout === 'digest') return <Digest signal={signal} />;
  if (layout === 'sections') return <Sections signal={signal} />;
  return <Editorial signal={signal} />;
}

Object.assign(window, { FrontPage, Reason });
