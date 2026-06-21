/* global React */
// Top-bar treatment explorations for MultivRSS.
// Reuses Bookmark / glyphs from dashboard.jsx (loaded globally).

// ── Sharp monoline UI icons (no rounded corners, matches design system) ──
function IcoSource({ s = 13 }) {
    return <svg width={s} height={s} viewBox="0 0 14 14"><path d="M7 1.5v11M1.5 7h11" stroke="currentColor" strokeWidth="1.6" /></svg>;
}
function IcoUrl({ s = 13 }) {
    // sharp clipboard
    return <svg width={s} height={s} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4">
        <rect x="2.2" y="2.5" width="9.6" height="10" /><path d="M5 2.5V1.2h4v1.3" /><path d="M4.4 6h5.2M4.4 8.6h3.6" /></svg>;
}
function IcoSync({ s = 13 }) {
    return <svg width={s} height={s} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 7a5 5 0 1 1-1.5-3.6" /><path d="M12.4 1.5v2.6h-2.6" /></svg>;
}

function SearchBox() {
    return (
        <div className="search">
            <span className="search__q">Q</span>
            <span className="search__ph">filter the stream...</span>
        </div>
    );
}

// V1 — Three textual actions, paste-url placed between source and sync
function HeaderTextual() {
    return (
        <header className="topbar topbar--v">
            <div className="flex-1" />
            <SearchBox />
            <button className="tb-text"><IcoSource s={11} /> SOURCE</button>
            <button className="tb-text"><IcoUrl s={11} /> PASTE URL</button>
            <button className="tb-text tb-text--tc"><IcoSync s={11} /> SYNC</button>
            <span className="tb-div" />
            <span className="topbar__theme">◑</span>
            <span className="topbar__settings">⚙</span>
        </header>
    );
}

// V2 — Icon-only, label reveals on hover AND focus (one shown forced-open)
function HeaderIconHover() {
    return (
        <header className="topbar topbar--v">
            <div className="flex-1" />
            <SearchBox />
            <button className="tb-icon"><span className="tb-icon__g"><IcoSource /></span><span className="tb-icon__l">SOURCE</span></button>
            <button className="tb-icon is-open"><span className="tb-icon__g"><IcoUrl /></span><span className="tb-icon__l">PASTE URL</span></button>
            <button className="tb-icon tb-icon--tc"><span className="tb-icon__g"><IcoSync /></span><span className="tb-icon__l">SYNC</span></button>
            <span className="tb-div" />
            <span className="topbar__theme">◑</span>
            <span className="topbar__settings">⚙</span>
        </header>
    );
}

// V3 — Recommended: grouped "ingest" actions (SOURCE | URL) + SYNC separate
function HeaderSegmented() {
    return (
        <header className="topbar topbar--v">
            <div className="flex-1" />
            <SearchBox />
            <div className="tb-seg">
                <button className="tb-seg__b"><IcoSource s={12} /> SOURCE</button>
                <button className="tb-seg__b"><IcoUrl s={12} /> URL</button>
            </div>
            <button className="tb-text tb-text--tc tb-text--solo"><IcoSync s={12} /> SYNC</button>
            <span className="tb-div" />
            <span className="topbar__theme">◑</span>
            <span className="topbar__settings">⚙</span>
        </header>
    );
}

// V4 — PASTE URL clicked → expands the SaveLinkBar inline as a popover
function HeaderExpanded() {
    return (
        <header className="topbar topbar--v topbar--tall">
            <div className="tb-row">
                <div className="flex-1" />
                <SearchBox />
                <button className="tb-text"><IcoSource s={11} /> SOURCE</button>
                <button className="tb-text is-active"><IcoUrl s={11} /> PASTE URL</button>
                <button className="tb-text tb-text--tc"><IcoSync s={11} /> SYNC</button>
                <span className="tb-div" />
                <span className="topbar__theme">◑</span>
                <span className="topbar__settings">⚙</span>
            </div>
            <div className="tb-pop">
                <SaveBar state="focus" />
            </div>
        </header>
    );
}

function HeaderFrame({ children }) {
    return (
        <div className="hf">
            {children}
            <div className="hf__below">
                <div className="telemetry">INDEX: <b>24 / 512 ITEMS</b><span className="tg">·</span>TIME: <b>3 MS</b></div>
                <div className="hf__river">
                    <span className="river__dot">○</span><span className="river__src">HACKER NEWS</span>
                    <span className="river__mid">·</span><span className="river__date">Jun 13</span>
                    <span className="river__mid">·</span> Show HN: a local-first RSS reader
                    <span className="river__slash"> // </span>
                    <span className="river__src">THE VERGE</span><span className="river__mid">·</span>
                    <span className="river__date">Jun 12</span><span className="river__mid">·</span> Why everyone is self-hosting again
                </div>
                <div className="hf__fade" />
            </div>
        </div>
    );
}

Object.assign(window, { HeaderTextual, HeaderIconHover, HeaderSegmented, HeaderExpanded, HeaderFrame });
