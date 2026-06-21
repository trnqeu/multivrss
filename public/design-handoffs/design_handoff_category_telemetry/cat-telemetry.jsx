/* global React */
// Minimal category filter integrated into the telemetry strip (next to FILTER: ALL/UNREAD/READ).

const TCATS = [
    { name: 'CULTURE', n: 11 }, { name: 'DESIGN', n: 18 }, { name: 'HUMOR', n: 9 },
    { name: 'MUSIC', n: 3 }, { name: 'NEWS', n: 117 }, { name: 'SCIENCE', n: 22 },
];

function Dot() { return <span className="tl-dot">·</span>; }

// Dimmed header for context (the V3 bar already shipped)
function CtxHeader() {
    return (
        <header className="topbar topbar--v tl-ctx">
            <div className="flex-1" />
            <div className="search"><span className="search__q">Q</span><span className="search__ph">filter the stream...</span></div>
            <div className="tb-seg">
                <button className="tb-seg__b"><IcoSource s={12} /> SOURCE</button>
                <button className="tb-seg__b"><IcoUrl s={12} /> URL</button>
            </div>
            <button className="tb-text tb-text--tc"><IcoSync s={12} /> SYNC</button>
            <span className="tb-div" /><span className="topbar__theme">◑</span><span className="topbar__settings">⚙</span>
        </header>
    );
}

function TelemetryStrip({ active = null, open = false }) {
    return (
        <div className="tl-strip tl-rel">
            <span>INDEX: <b>30 / 1000 ITEMS</b></span><Dot />
            <span>TIME: <b>12 MS</b></span><Dot />
            <span className="tl-grp">
                FILTER:&nbsp;
                <button className="tl-tog on">ALL</button><span className="tl-mini">·</span>
                <button className="tl-tog">UNREAD</button><span className="tl-mini">·</span>
                <button className="tl-tog">READ</button>
            </span>
            <Dot />
            <span className="tl-grp">
                CAT:&nbsp;
                <button className={`tl-cat ${open ? 'open' : ''}`}>
                    <span className={`tl-cat__v ${active ? 'act' : ''}`}>{active || 'ALL'}</span>
                    <span className="tl-car">▾</span>
                </button>
                {active && <button className="tl-x" title="Clear category">✕</button>}
            </span>

            {open && (
                <div className="tl-menu">
                    <button className={`tl-menu__row ${!active ? 'on' : ''}`}><span className="tl-menu__lbl">ALL</span><span className="tl-menu__n">1000</span></button>
                    {TCATS.map(c => (
                        <button key={c.name} className={`tl-menu__row ${active === c.name ? 'on' : ''}`}>
                            <span className="tl-menu__lbl">{c.name}</span><span className="tl-menu__n">{String(c.n).padStart(2, '0')}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function TelemetryFrame({ active, open }) {
    return (
        <div className="hf">
            <CtxHeader />
            <TelemetryStrip active={active} open={open} />
            <div className="hf__below">
                <div className="hf__river">
                    <span className="river__dot">○</span><span className="river__src">WWW.ESPN.COM - TOP</span>
                    <span className="river__mid">·</span><span className="river__date">Jun 13</span>
                    <span className="river__mid">·</span> Balogun living WC 'dream' as U.S. choice pays off
                    <span className="river__slash"> // </span>
                    <span className="river__src">WWW.ESPN.COM - TOP</span><span className="river__mid">·</span>
                    <span className="river__date">Jun 13</span><span className="river__mid">·</span> Pulisic subbed off at halftime
                </div>
                <div className="hf__fade" />
            </div>
        </div>
    );
}

Object.assign(window, { TelemetryFrame });
