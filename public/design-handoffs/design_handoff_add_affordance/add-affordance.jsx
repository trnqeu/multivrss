/* global React, HeaderFrame */
// "+ aggiungi" explorations for MultivRSS.
// Goal: make it unmistakable that the + adds BOTH sources (RSS feeds) and single URLs.
// Reuses HeaderFrame (river below) from topbar-variants.jsx.

// ── Sharp monoline icons (no rounded corners, matches design system) ──
function IcoPlus({ s = 13 }) {
    return <svg width={s} height={s} viewBox="0 0 14 14"><path d="M7 1.6v10.8M1.6 7h10.8" stroke="currentColor" strokeWidth="1.7" /></svg>;
}
function IcoSource({ s = 13 }) {
    // RSS mark — a feed source
    return <svg width={s} height={s} viewBox="0 0 14 14" fill="none">
        <circle cx="3" cy="11" r="1.5" fill="currentColor" />
        <path d="M2.4 6.4A5.2 5.2 0 0 1 7.6 11.6M2.4 2.6A9 9 0 0 1 11.4 11.6" stroke="currentColor" strokeWidth="1.6" /></svg>;
}
function IcoUrl({ s = 13 }) {
    // link / single article
    return <svg width={s} height={s} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M5.6 8.4 8.4 5.6" /><path d="M7.4 3.6 8.6 2.4a2.3 2.3 0 0 1 3.2 3.2L10.6 6.8" /><path d="M6.6 10.4 5.4 11.6a2.3 2.3 0 0 1-3.2-3.2L3.4 7.2" /></svg>;
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
function SyncBtn() {
    return <button className="tb-text tb-text--tc tb-text--solo"><IcoSync s={12} /> SYNC</button>;
}
function Chrome() {
    return <><span className="tb-div" /><span className="topbar__theme">◑</span><span className="topbar__settings">⚙</span></>;
}

// ── V1 · Shared "+" cell governs the whole group: [ + | SOURCE | URL ] ──
function AddSharedPlus() {
    return (
        <header className="topbar topbar--v">
            <div className="flex-1" />
            <SearchBox />
            <div className="tb-grp" role="group" aria-label="Add a source or URL">
                <span className="tb-grp__plus" aria-hidden="true"><IcoPlus s={14} /></span>
                <button className="tb-grp__b"><IcoSource s={12} /> SOURCE</button>
                <button className="tb-grp__b"><IcoUrl s={12} /> URL</button>
            </div>
            <SyncBtn />
            <Chrome />
        </header>
    );
}

// ── V2 · Single "+ ADD" button → menu listing both (recommended) ──
function AddMenu({ open = false }) {
    return (
        <header className="topbar topbar--v">
            <div className="flex-1" />
            <SearchBox />
            <div className="tb-addwrap">
                <button className={`tb-addbtn ${open ? 'is-open' : ''}`} aria-haspopup="menu" aria-expanded={open}>
                    <span className="tb-plus"><IcoPlus s={13} /></span> ADD
                    <span className="tb-addbtn__car">▾</span>
                </button>
                {open && (
                    <div className="tb-menu" role="menu">
                        <div className="tb-menu__hd">Aggiungi al tuo flusso</div>
                        <button className="tb-menu__row" role="menuitem">
                            <span className="tb-menu__ico"><IcoSource s={15} /></span>
                            <span className="tb-menu__txt"><b>Fonte</b><span>Abbonati a un feed RSS — aggiornamenti continui</span></span>
                        </button>
                        <button className="tb-menu__row" role="menuitem">
                            <span className="tb-menu__ico"><IcoUrl s={15} /></span>
                            <span className="tb-menu__txt"><b>URL</b><span>Salva un singolo link nel flusso</span></span>
                        </button>
                    </div>
                )}
            </div>
            <SyncBtn />
            <Chrome />
        </header>
    );
}

// ── V3 · One button, both spelled out: [ + ADD SOURCE / URL ] ──
function AddExplicit() {
    return (
        <header className="topbar topbar--v">
            <div className="flex-1" />
            <SearchBox />
            <button className="tb-addbtn tb-addbtn--wide">
                <span className="tb-plus"><IcoPlus s={13} /></span> ADD&nbsp;<span className="tb-addbtn__pair">SOURCE / URL</span>
            </button>
            <SyncBtn />
            <Chrome />
        </header>
    );
}

// ── V4 · "+ ADD" used as a scope label in front of two buttons ──
function AddPrefix() {
    return (
        <header className="topbar topbar--v">
            <div className="flex-1" />
            <SearchBox />
            <div className="tb-pref">
                <span className="tb-pref__lbl"><IcoPlus s={11} /> ADD</span>
                <div className="tb-pref__btns">
                    <button className="tb-pref__b"><IcoSource s={12} /> SOURCE</button>
                    <button className="tb-pref__b"><IcoUrl s={12} /> URL</button>
                </div>
            </div>
            <SyncBtn />
            <Chrome />
        </header>
    );
}

Object.assign(window, { AddSharedPlus, AddMenu, AddExplicit, AddPrefix });
