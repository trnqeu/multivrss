/* global React */
// Faithful MultivRSS dashboard recreation for mockups.
// Design system: warm paper #f6f3ec, ink #000, terracotta #E2725B,
// sharp 2px borders, no radius, no shadows, Inter + JetBrains Mono.

function Bookmark({ filled, size = 11 }) {
    return (
        <svg width={size} height={size * 1.25} viewBox="0 0 12 15" style={{ display: 'inline-block', verticalAlign: 'baseline' }}>
            <path d="M1 1h10v12.4l-5-3.1-5 3.1z" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
    );
}

// ── The save-URL bar, recreated from SaveLinkBar.tsx ──
function SaveBar({ state = 'default' }) {
    const valueByState = {
        default: '',
        focus: 'https://stripe.com/blog/online-payments-2026',
        saving: 'https://stripe.com/blog/online-payments-2026',
        saved: '',
    };
    const value = valueByState[state];
    const enabled = state === 'focus' || state === 'saving';
    const btnLabel = state === 'saving' ? 'SAVING' : 'SAVE';
    const focused = state === 'focus' || state === 'saving';
    return (
        <form className={`save-bar ${focused ? 'is-focus' : ''}`}>
            <span className="save-bar__tag">
                <span className="label-system tc">PASTE_URL_</span>
            </span>
            <span className="save-bar__field">
                {value
                    ? <span className="save-bar__val">{value}{focused && <span className="caret" />}</span>
                    : <span className="save-bar__ph">https://…  — paste a link, press enter</span>}
            </span>
            <button type="button" className={`save-bar__btn ${enabled ? 'on' : 'off'}`}>
                <Bookmark filled size={11} /> {btnLabel}
            </button>
        </form>
    );
}

function Toast() {
    return (
        <div className="toast">
            <Bookmark filled size={11} />
            <span className="label-system">LINK SAVED</span>
            <span className="toast__sep">·</span>
            <span className="toast__title">Online payments in 2026 — Stripe</span>
        </div>
    );
}

function NavItem({ icon, label, count, active }) {
    return (
        <div className={`nav-item ${active ? 'active' : ''}`}>
            <span className="nav-item__icon">{icon}</span>
            <span className="nav-item__label">{label}</span>
            {count && <span className="nav-item__count">{count}</span>}
        </div>
    );
}

function Sidebar() {
    return (
        <aside className="sidebar">
            <div className="brand">
                <img src="assets/multivrss-ico.png" alt="" className="brand__logo" />
                <span className="brand__name">multivrss</span>
            </div>
            <div className="sync-badge">
                <span className="dot" /> LAST SYNC 4M AGO
            </div>
            <nav className="nav">
                <span className="label-system muted nav__group">NAV_ROOT</span>
                <NavItem icon={<RssGlyph />} label="All Feeds" active />
                <NavItem icon={<Bookmark size={11} />} label="Saved" count="07" />
                <NavItem icon={<DiscoverGlyph />} label="Suggested" />

                <span className="label-system muted nav__group nav__group--cats">CATEGORIES</span>
                <Category name="TECH" sources={['HACKER NEWS', 'ARS TECHNICA', 'THE VERGE']} />
                <Category name="DESIGN" sources={['SMASHING MAG', 'A LIST APART']} />
            </nav>
            <div className="sidebar__footer label-system">
                Connection: [PROTECTED]<br />Node: MULTIVRSS_ALPHA
            </div>
        </aside>
    );
}

function Category({ name, sources }) {
    return (
        <div className="cat">
            <div className="cat__head">
                <span className="label-system">{name}</span>
                <span className="cat__count label-system">{String(sources.length).padStart(2, '0')}</span>
            </div>
            <div className="cat__sources">
                {sources.map(s => <div key={s} className="cat__source">{s}</div>)}
            </div>
        </div>
    );
}

function RssGlyph() {
    return <svg width="12" height="12" viewBox="0 0 12 12"><circle cx="2" cy="10" r="1.4" fill="currentColor" /><path d="M1 5.5a5.5 5.5 0 0 1 5.5 5.5M1 1.5A9.5 9.5 0 0 1 10.5 11" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>;
}
function DiscoverGlyph() {
    return <svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M8.2 3.8 6.6 6.6 3.8 8.2 5.4 5.4z" fill="currentColor" /></svg>;
}

function Header({ trigger }) {
    return (
        <header className="topbar">
            <div className="flex-1" />
            <div className="search">
                <span className="search__q">Q</span>
                <span className="search__ph">filter the stream...</span>
            </div>
            {trigger && (
                <button type="button" className="topbar__btn topbar__btn--link"><Bookmark size={10} /> LINK</button>
            )}
            <button type="button" className="topbar__btn">+ SOURCE</button>
            <button type="button" className="topbar__sync">↻ SYNC</button>
            <span className="topbar__theme">◑</span>
            <span className="topbar__settings">⚙</span>
        </header>
    );
}

const RIVER = [
    { src: 'HACKER NEWS', date: 'Jun 13', title: 'Show HN: I built a local-first RSS reader in a weekend', body: 'After years of fighting cloud sync I finally committed to a SQLite-backed', read: false },
    { src: 'ARS TECHNICA', date: 'Jun 13', title: 'The quiet return of the personal feed', body: 'Algorithmic timelines are out, chronological rivers are back in fashion', read: false },
    { src: 'THE VERGE', date: 'Jun 12', title: 'Why everyone is self-hosting again', body: 'A new generation of tinkerers is reclaiming their data one container', read: true },
    { src: 'SMASHING MAG', date: 'Jun 12', title: 'Designing for density without losing clarity', body: 'High information environments demand a different typographic rhythm than', read: false },
    { src: 'A LIST APART', date: 'Jun 11', title: 'The case for sharp edges', body: 'Rounded corners signal softness, but some products earn trust through', read: true },
];

function FeedRiver() {
    return (
        <div className="river">
            {RIVER.map((it, i) => (
                <span key={i} className={`river__item ${it.read ? 'is-read' : ''}`}>
                    <span className="river__dot">{it.read ? '●' : '○'}</span>
                    <span className="river__src">{it.src}</span>
                    <span className="river__mid">·</span>
                    <span className="river__date">{it.date}</span>
                    <span className="river__mid">·</span>
                    <span className="river__title">{it.title}</span>
                    <span className="river__dash">—</span>
                    <span className="river__body">{it.body}…</span>
                    <span className="river__bk"><Bookmark size={11} /></span>
                    {i < RIVER.length - 1 && <span className="river__slash">// </span>}
                </span>
            ))}
        </div>
    );
}

function Telemetry() {
    return (
        <div className="telemetry">
            INDEX: <b>24 / 512 ITEMS</b><span className="tg">·</span>
            TIME: <b>3 MS</b><span className="tg">·</span>
            FILTER: <b className="tc-u">ALL</b><span className="tg-s">·</span><span className="tg-d">UNREAD</span><span className="tg-s">·</span><span className="tg-d">READ</span>
        </div>
    );
}

// ── Full dashboard, parametrized by save-bar placement ──
// variant: 'A' (inline persistent), 'B' (header strip), 'plain' (no bar)
function Dashboard({ variant = 'A', barState = 'default', toast = false }) {
    return (
        <div className="dash">
            <Sidebar />
            <div className="dash__main">
                <Header trigger={variant === 'B'} />
                {variant === 'B' && (
                    <div className="strip">
                        <SaveBar state={barState} />
                    </div>
                )}
                <main className="content">
                    {variant === 'A' && (
                        <div className="content__savezone">
                            <SaveBar state={barState} />
                        </div>
                    )}
                    <Telemetry />
                    <section className="content__river">
                        <div className="daymark">
                            <span className="daymark__label">— FRIDAY · JUN 13</span>
                            <span className="daymark__line" />
                            <span className="daymark__arrow">→</span>
                        </div>
                        <FeedRiver />
                    </section>
                </main>
                {toast && <Toast />}
            </div>
        </div>
    );
}

Object.assign(window, { Dashboard, SaveBar, Toast, Bookmark });
