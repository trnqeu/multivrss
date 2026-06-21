/* global React */
// Category-filter-in-topbar explorations for MultivRSS.
// Reuses HeaderFrame, SearchBox-like markup, IcoSync from topbar-variants.jsx.

const CATS = [
    { name: 'CULTURE', n: 11 }, { name: 'DESIGN', n: 18 }, { name: 'HUMOR', n: 9 },
    { name: 'MUSIC', n: 3 }, { name: 'NEWS', n: 117 }, { name: 'SCIENCE', n: 22 },
];

function MiniSearch() {
    return (
        <div className="search">
            <span className="search__q">Q</span>
            <span className="search__ph">filter the stream...</span>
        </div>
    );
}
function MiniActions() {
    return (
        <>
            <button className="tb-text"><IcoSource s={11} /> SOURCE</button>
            <button className="tb-text"><IcoUrl s={11} /> PASTE URL</button>
            <button className="tb-text tb-text--tc"><IcoSync s={11} /> SYNC</button>
            <span className="tb-div" />
            <span className="topbar__theme">◑</span>
            <span className="topbar__settings">⚙</span>
        </>
    );
}

// A — Scope dropdown (shown open), active = NEWS
function HeaderScope({ active = 'NEWS' }) {
    return (
        <header className="topbar topbar--v cf-rel">
            <button className="cf-scope is-open">
                <span className="cf-scope__k">SCOPE</span>
                <span className="cf-scope__v">{active || 'ALL FEEDS'}</span>
                <span className="cf-scope__car">▾</span>
            </button>
            <div className="flex-1" />
            <MiniSearch />
            <MiniActions />
            {/* dropdown */}
            <div className="cf-menu">
                <button className={`cf-menu__row ${!active ? 'on' : ''}`}>
                    <span className="cf-menu__ico">≡</span><span className="cf-menu__lbl">ALL FEEDS</span><span className="cf-menu__n">1000</span>
                </button>
                <div className="cf-menu__sep">CATEGORIES</div>
                {CATS.map(c => (
                    <button key={c.name} className={`cf-menu__row ${active === c.name ? 'on' : ''}`}>
                        <span className="cf-menu__ico">#</span><span className="cf-menu__lbl">{c.name}</span><span className="cf-menu__n">{String(c.n).padStart(2, '0')}</span>
                    </button>
                ))}
            </div>
        </header>
    );
}

// B — Active-filter chip (minimal: make active filter visible + clearable)
function HeaderChip({ active = 'NEWS' }) {
    return (
        <header className="topbar topbar--v">
            <div className="flex-1" />
            <MiniSearch />
            {active && (
                <span className="cf-chip">
                    <span className="cf-chip__k">CAT</span>
                    <span className="cf-chip__v">{active}</span>
                    <span className="cf-chip__x">×</span>
                </span>
            )}
            <MiniActions />
        </header>
    );
}

// C — Desktop category strip (bring the mobile tab strip up to desktop)
function HeaderStrip({ active = 'NEWS' }) {
    return (
        <>
            <header className="topbar topbar--v">
                <div className="flex-1" />
                <MiniSearch />
                <MiniActions />
            </header>
            <div className="cf-strip">
                <button className={`cf-tab ${!active ? 'on' : ''}`}>ALL</button>
                {CATS.map(c => (
                    <button key={c.name} className={`cf-tab ${active === c.name ? 'on' : ''}`}>
                        {c.name} <span className="cf-tab__n">{String(c.n).padStart(2, '0')}</span>
                    </button>
                ))}
            </div>
        </>
    );
}

Object.assign(window, { HeaderScope, HeaderChip, HeaderStrip });
