/* global React, ReactDOM, window */
(function(){
const { useState, useMemo, useRef, useEffect } = React;
const { CATS, FORYOU, SECTIONS, RIVER, catCount } = window.RD;

const LS = 'mv_reader_v1';
function loadState(){
  try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch(e){ return {}; }
}
function saveState(s){ try { localStorage.setItem(LS, JSON.stringify(s)); } catch(e){} }

/* ---------- tiny glyphs ---------- */
function Bookmark({ filled }){
  return (
    <svg width="10" height="12.5" viewBox="0 0 12 15" style={{display:'block'}}>
      <path d="M1 1h10v12.4l-5-3.1-5 3.1z" fill={filled?'currentColor':'none'} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}

/* ---------- row action cluster ---------- */
function Acts({ saved, onSave, onTag, onRead, read }){
  return (
    <span className="acts">
      <button className={`a a--bk ${saved?'is-on':''}`} title="Save" onClick={onSave}><Bookmark filled={saved}/></button>
      <button className="a" title="Tag" onClick={onTag}>TAG</button>
      <button className={`a a--rd ${read?'is-on':''}`} title="Mark read" onClick={onRead}>✓</button>
    </span>
  );
}

/* ---------- shared dropdown (used by FILTER + CATEGORY) ---------- */
function Dropdown({ label, value, options, onChange, fmt }){
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(()=>{
    if(!open) return;
    const onDoc = (e)=>{ if(ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onEsc = (e)=>{ if(e.key==='Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return ()=>{ document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onEsc); };
  }, [open]);
  const show = fmt || (v=>v);
  return (
    <span className="dd" ref={ref}>
      <span className="dd__lbl">{label}</span>
      <button className="dd__btn" aria-haspopup="listbox" aria-expanded={open} onClick={()=>setOpen(o=>!o)}>
        <b>{show(value)}</b><span className="dd__car">▾</span>
      </button>
      {open && (
        <div className="dd__menu" role="listbox">
          {options.map(o=>(
            <button key={o} role="option" aria-selected={o===value}
              className={`dd__opt ${o===value?'on':''}`}
              onClick={()=>{ onChange(o); setOpen(false); }}>{show(o)}</button>
          ))}
        </div>
      )}
    </span>
  );
}

/* ======================= SIDEBAR ======================= */
function Sidebar({ view, cat, go }){
  return (
    <aside className="sb">
      <div className="sb__brand">
        <img className="sb__logo" src="assets/multivrss-ico.png" alt=""/>
        <span className="sb__name">multivrss</span>
      </div>
      <nav className="sb__nav">
        <span className="lbl muted">NAV_ROOT</span>
        <button className={`nvi ${view==='river'&&cat==='ALL'?'on':''}`} onClick={()=>go('river','ALL')}>◈ ALL FEEDS</button>
        <button className="nvi">▢ SAVED <span className="nvi__c">04</span></button>
        <button className="nvi">◷ SUGGESTED</button>
        <span className="lbl muted sb__gap">CATEGORIES</span>
        {CATS.map(c=>(
          <button key={c.key} className={`sbc ${view==='river'&&cat===c.key?'on':''}`} onClick={()=>go('river',c.key)}>
            <span className="sbc__n">{c.key}</span>
            <span className="sbc__c">{String(c.count).padStart(2,'0')}</span>
            <span className="sbc__go">→</span>
          </button>
        ))}
      </nav>
      <div className="sb__foot lbl muted">NODE · MULTIVRSS_ALPHA<br/>SYNC 4M AGO</div>
    </aside>
  );
}

/* ======================= TOP BAR ======================= */
function TopBar({ view, setView, theme, toggleTheme }){
  return (
    <header className="top">
      <div className="tabs">
        <button className={`tab ${view==='front'?'on':''}`} onClick={()=>setView('front')}>▤ FRONT PAGE</button>
        <button className={`tab ${view==='river'?'on':''}`} onClick={()=>setView('river')}>≡ RIVER</button>
      </div>
      <div className="search"><span className="search__q">Q</span> FILTER THE STREAM…</div>
      <div className="spring"/>
      <button className="tbtn tbtn--solid">+ ADD ▾</button>
      <button className="tbtn">↻ SYNC</button>
      <button className="tico" title="Toggle theme" onClick={toggleTheme}>{theme==='dark'?'☀':'◑'}</button>
      <span className="tico">⚙</span>
    </header>
  );
}

/* ======================= FRONT PAGE (Section Fronts, deep) ======================= */
function SectionCard({ c, data, go, saved, read, toggleSave, toggleRead }){
  const lead = data.lead;
  const lid = 'L_'+c.key;
  return (
    <section className="sec">
      <div className="sec__h">
        <span className="sec__n">{c.key}</span>
        <span className="sec__c">{String(c.count).padStart(2,'0')}</span>
      </div>

      <div className="sec__lead">
        <a className="sec__lt" onClick={()=>toggleRead(lid)}>{lead.title}</a>
        <p className="dek small">{lead.dek}</p>
        <div className="metaline">
          <span className="ml__src">{lead.src}</span><i>·</i>{lead.date}<i>·</i>{lead.min}
          <Acts saved={saved.has(lid)} read={read.has(lid)} onSave={()=>toggleSave(lid)} onRead={()=>toggleRead(lid)} onTag={()=>{}}/>
        </div>
      </div>

      <ul className="sec__list">
        {data.rows.map((r,i)=>{
          const id = c.key+'_'+i;
          return (
            <li key={i} className={`sec__row ${read.has(id)?'is-read':''}`}>
              <a className="sec__rt" onClick={()=>toggleRead(id)}>{r.title}</a>
              <div className="sec__rm">
                <span className="ml__src">{r.src}</span><i>·</i>{r.date}
                <Acts saved={saved.has(id)} read={read.has(id)} onSave={()=>toggleSave(id)} onRead={()=>toggleRead(id)} onTag={()=>{}}/>
              </div>
            </li>
          );
        })}
      </ul>

      <button className="sec__all" onClick={()=>go('river',c.key)}>
        <span>VIEW ALL {c.count} IN {c.key}</span><span className="sec__all-arr">→</span>
      </button>
    </section>
  );
}

function FrontPage({ go, saved, read, toggleSave, toggleRead }){
  return (
    <div className="fp">
      {/* FOR YOU ribbon */}
      <div className="ribbon">
        <span className="rib__lbl">FOR YOU</span>
        {FORYOU.map((f,i)=>(
          <React.Fragment key={i}>
            {i>0 && <span className="rib__sep"/>}
            <a className="rib">
              <span className="rib__cat">{f.cat}</span>
              <span className="rib__t">{f.title}</span>
              <span className="rib__why">{f.chip}</span>
            </a>
          </React.Fragment>
        ))}
      </div>

      {/* Section fronts */}
      <div className="secgrid">
        {CATS.map(c=>(
          <SectionCard key={c.key} c={c} data={SECTIONS[c.key]} go={go}
            saved={saved} read={read} toggleSave={toggleSave} toggleRead={toggleRead}/>
        ))}
      </div>
    </div>
  );
}

/* ======================= RIVER (Ledger) ======================= */
function River({ items, saved, read, toggleSave, toggleRead }){
  let lastDay = null;
  return (
    <div className="river">
      <div className="ledger">
        {items.map(it=>{
          const isRead = read.has(it.id);
          const newDay = it.day!==lastDay; lastDay = it.day;
          return (
            <React.Fragment key={it.id}>
              {newDay && <div className="lgday"><span>— {it.day}</span><i/></div>}
              <div className={`lg ${isRead?'is-read':''}`}>
                <button className="lg__dot" onClick={()=>toggleRead(it.id)} title={isRead?'Mark unread':'Mark read'}>{isRead?'●':'○'}</button>
                <span className="lg__src">{it.src}</span>
                <span className="lg__date">{it.date}</span>
                <span className="lg__main">
                  <b className="lg__title" onClick={()=>toggleRead(it.id)}>{it.title}</b>
                  <span className="lg__prev"> — {it.body}</span>
                </span>
                <span className="lg__c">{it.c?it.c:''}</span>
                <Acts saved={saved.has(it.id)} read={isRead} onSave={()=>toggleSave(it.id)} onRead={()=>toggleRead(it.id)} onTag={()=>{}}/>
              </div>
            </React.Fragment>
          );
        })}
        {items.length===0 && <div className="lg-empty">No items match this filter.</div>}
      </div>
    </div>
  );
}

/* ======================= TELEMETRY ======================= */
const CAT_OPTS = ['ALL', ...CATS.map(c=>c.key)];
const READ_OPTS = ['ALL', 'UNREAD', 'READ'];

function Telemetry({ view, count, cat, setCat, readFilter, setReadFilter }){
  if(view==='front'){
    return <div className="tele">CURATED FROM <b>142 READ</b><i>·</i><b>28 SAVED</b><i>·</i>ACROSS <b>6 CATEGORIES</b><i>·</i>UPDATED <b>4M AGO</b></div>;
  }
  return (
    <div className="tele">
      INDEX <b>{count} / 1000</b><i>·</i>TIME <b>3 MS</b><i>·</i>
      <Dropdown label="FILTER" value={readFilter} options={READ_OPTS} onChange={setReadFilter}/>
      <i>·</i>
      <Dropdown label="CATEGORY" value={cat} options={CAT_OPTS} onChange={setCat}/>
    </div>
  );
}

/* ======================= APP ======================= */
function App(){
  const init = loadState();
  const [view, setView] = useState(init.view || 'front');
  const [cat, setCat] = useState(init.cat || 'ALL');
  const [readFilter, setReadFilter] = useState(init.readFilter || 'ALL');
  const [theme, setTheme] = useState(init.theme || 'light');
  const [read, setRead] = useState(()=> new Set(init.read || RIVER.map((x,i)=> x.read?('R'+i):null).filter(Boolean)));
  const [saved, setSaved] = useState(()=> new Set(init.saved || []));
  const scrollRef = useRef(null);

  useEffect(()=>{ document.body.setAttribute('data-theme', theme); }, [theme]);
  useEffect(()=>{ saveState({ view, cat, readFilter, theme, read:[...read], saved:[...saved] }); }, [view, cat, readFilter, theme, read, saved]);

  function toTop(){ if(scrollRef.current) scrollRef.current.scrollTop = 0; }
  function go(nextView, nextCat){ setView(nextView); if(nextCat!==undefined) setCat(nextCat); toTop(); }
  function setCatAndTop(c){ setCat(c); toTop(); }
  function setReadAndTop(f){ setReadFilter(f); toTop(); }
  function toggleRead(id){ setRead(s=>{ const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n; }); }
  function toggleSave(id){ setSaved(s=>{ const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n; }); }
  function toggleTheme(){ setTheme(t=> t==='dark'?'light':'dark'); }

  const riverItems = useMemo(()=>{
    return RIVER.map((it,i)=>({ ...it, id:'R'+i }))
      .filter(it => cat==='ALL' ? true : it.cat===cat)
      .filter(it => readFilter==='ALL' ? true : (readFilter==='READ' ? read.has(it.id) : !read.has(it.id)));
  }, [cat, readFilter, read]);

  return (
    <div className="app">
      <Sidebar view={view} cat={cat} go={go}/>
      <div className="mainc">
        <TopBar view={view} setView={setView} theme={theme} toggleTheme={toggleTheme}/>
        <Telemetry view={view} count={riverItems.length}
          cat={cat} setCat={setCatAndTop}
          readFilter={readFilter} setReadFilter={setReadAndTop}/>
        <div className="scroll" ref={scrollRef}>
          {view==='front'
            ? <FrontPage go={go} saved={saved} read={read} toggleSave={toggleSave} toggleRead={toggleRead}/>
            : <River items={riverItems} saved={saved} read={read} toggleSave={toggleSave} toggleRead={toggleRead}/>}
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
})();
