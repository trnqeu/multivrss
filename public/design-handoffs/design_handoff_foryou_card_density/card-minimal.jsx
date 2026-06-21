/* global React, window */
// For You card — density studies. Baseline (current) + 3 minimal directions.

const FY = [
  { cat: 'MUSIC',   type: 'similar', reason: 'SIMILAR TO YOUR READS', aff: 100, src: 'PITCHFORK',    date: 'Jun 19',
    title: '9 New Albums You Should Listen to Now: Tierra Whack, Evilgiane, and More' },
  { cat: 'CULTURE', type: 'source',  reason: 'FROM A SAVED SOURCE',   aff: 95,  src: 'ARTNEWS',      date: 'Jun 28',
    title: '‘You don’t have to go to special places to find beauty’: Takeshi’s lens' },
  { cat: 'CULTURE', type: 'source',  reason: 'FROM A SAVED SOURCE',   aff: 95,  src: 'ARTNEWS',      date: 'Jun 28',
    title: 'Frank Bowling: ‘Guiltiest pleasure? Sixteen-year-old single malt’' },
  { cat: 'CULTURE', type: 'similar', reason: 'SIMILAR TO YOUR READS', aff: 87,  src: 'THE GUARDIAN', date: 'Sep 28',
    title: 'The Fifth Floor: Who is Mexico’s first female president?' },
];

const glyphOf = t => (t === 'source' ? '◆' : '✦');
const whyWord = t => (t === 'source' ? 'SAVED SOURCE' : 'SIMILAR');

// same bookmark used in the RIVER (chrome.jsx)
function Bookmark({ filled, size = 11 }) {
  return (
    <svg width={size} height={size * 1.25} viewBox="0 0 12 15" style={{ display: 'block' }}>
      <path d="M1 1h10v12.4l-5-3.1-5 3.1z" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function Cat({ name }) { return <span className="fpc-cat">{name}</span>; }
function Meta({ it, tone }) {
  return (
    <>
      <span className={`fpc__src ${tone === 'tc' ? 'fpc__src--tc' : ''}`}>{it.src}</span>
      <span className="fpc__mid">·</span>
      <span className="fpc__date">{it.date}</span>
    </>
  );
}

// ── BASELINE — current implementation, recreated 1:1 ──
function CardBaseline({ it }) {
  return (
    <article className="fpc fpc--base">
      <div className="fpc__top"><Cat name={it.cat} /><span className="fpc__glyph">{glyphOf(it.type)}</span></div>
      <h3 className="fpc__title">{it.title}</h3>
      <div className="fpc__foot">
        <Meta it={it} />
        <span className="fpc__actions">
          <button className="fpc-tag">+ TAG</button>
          <span className="fpc-read">●</span>
          <span className="fpc-save">◇</span>
        </span>
      </div>
      <div className="fpc__reason">
        <span className="fpc__glyph">{glyphOf(it.type)}</span>
        <span className="fpc__rtxt">{it.reason}</span>
        <span className="fpc-bar"><span className="fpc-fill" style={{ width: it.aff + '%' }} /></span>
        <span className="fpc__pct">{it.aff}</span>
      </div>
    </article>
  );
}

// ── A · QUIET — actions only on hover, no symbol by the title ──
function CardA({ it, hover }) {
  return (
    <article className={`fpc fpc--a ${hover ? 'is-hover' : ''}`}>
      <div className="fpc__top"><Cat name={it.cat} /></div>
      <h3 className="fpc__title">{it.title}</h3>
      <div className="fpc__foot">
        <Meta it={it} />
        <span className="fpc__actions fpc__actions--hover">
          <button className="fpc-tag">+ TAG</button>
          <span className="fpc-save" title="Save"><Bookmark /></span>
        </span>
      </div>
    </article>
  );
}

// ── B · ONE LINE — merged single meta row, mini strength meter, no read dot ──
function CardB({ it }) {
  const ticks = Math.round((it.aff / 100) * 3);
  return (
    <article className="fpc fpc--b">
      <div className="fpc__top"><Cat name={it.cat} /></div>
      <h3 className="fpc__title">{it.title}</h3>
      <div className="fpc__foot">
        <span className="fpc-meter" title={`${it.aff}% match`}>
          {[0, 1, 2].map(i => <span key={i} className={`fpc-meter__t ${i < ticks ? 'on' : ''}`} />)}
        </span>
        <span className="fpc__src">{it.src}</span>
        <span className="fpc__actions">
          <span className="fpc-save" title="Save"><Bookmark /></span>
          <button className="fpc-tag">+ TAG</button>
        </span>
      </div>
    </article>
  );
}

// ── C · SAVE-FIRST — only save at rest; tag appears after saving ──
function CardC({ it, saved }) {
  return (
    <article className={`fpc fpc--c ${saved ? 'is-saved' : ''}`}>
      <div className="fpc__top">
        <Cat name={it.cat} />
        <span className="fpc__why">{whyWord(it.type)}</span>
      </div>
      <h3 className="fpc__title">{it.title}</h3>
      <div className="fpc__foot">
        <Meta it={it} />
        <span className="fpc__actions">
          {saved && <button className="fpc-addtag">＋ tag</button>}
          <span className={`fpc-save ${saved ? 'on' : ''}`} title={saved ? 'Saved' : 'Save'}><Bookmark filled={saved} /></span>
        </span>
      </div>
    </article>
  );
}

function Strip({ render }) {
  return <div className="fpc-strip">{FY.map((it, i) => render(it, i))}</div>;
}

Object.assign(window, { FY, Strip, Bookmark, CardBaseline, CardA, CardB, CardC });
