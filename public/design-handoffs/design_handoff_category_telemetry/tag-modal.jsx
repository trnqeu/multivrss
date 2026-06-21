/* global React */
// AssignTagsModal redesign explorations for MultivRSS.

const DIRECTORY = ['IDEAS', 'PHOTOS', 'READ_LATER', 'DESIGN', 'AI'];

function Chip({ label, selected, removable, dim }) {
    return (
        <span className={`chip ${selected ? 'sel' : ''} ${dim ? 'dim' : ''}`}>
            # {label}{removable && <span className="chip__x">×</span>}
        </span>
    );
}

function ModalShell({ title, children, footer, uid = 5305 }) {
    return (
        <div className="tm-backdrop">
            <div className="tm">
                <div className="tm-hd">
                    <span className="tm-title">{title}</span>
                    <button className="tm-x">×</button>
                </div>
                {children}
                <div className="tm-ft">
                    <span className="tm-uid">UID: TAG_PROC_{uid}</span>
                    {footer}
                </div>
            </div>
        </div>
    );
}

function Footer({ count }) {
    return (
        <div className="tm-btns">
            <button className="btn-cancel">CANCEL</button>
            <button className="btn-apply">APPLY{count != null && <span className="btn-apply__n">{count}</span>}</button>
        </div>
    );
}

// ── BASELINE — current implementation, recreated ──
function TagModalCurrent() {
    return (
        <ModalShell title="ASSIGN_TAGS" footer={<Footer />}>
            <div className="tm-body">
                <div className="tm-field">
                    <span className="tm-label">FILTER OR CREATE NEW TAG</span>
                    <div className="tm-input-wrap term">
                        <span className="tm-prompt">&gt;</span>
                        <span className="tm-ph term-ph">TYPE_TAG_NAME...</span>
                    </div>
                </div>
                <div className="tm-field">
                    <span className="tm-label">EXISTING_DIRECTORY</span>
                    <div className="tm-chips">
                        <Chip label="IDEAS" selected />
                        <Chip label="PHOTOS" />
                    </div>
                </div>
            </div>
        </ModalShell>
    );
}

// ── V1 — explicit create row + Enter, lighter input, count ──
function TagModalV1({ typed = 'LONGREAD' }) {
    return (
        <ModalShell title="ASSIGN_TAGS" footer={<Footer count="02" />}>
            <div className="tm-body">
                <div className="tm-field">
                    <span className="tm-label">FIND OR CREATE A TAG</span>
                    <div className="tm-input-wrap light">
                        <span className="tm-prompt">&gt;</span>
                        <span className="tm-typed">{typed}<span className="caret" /></span>
                        <span className="tm-kbd">↵</span>
                    </div>
                    {/* explicit create affordance */}
                    <button className="tm-create">
                        <span className="tm-create__plus">+</span>
                        <span className="tm-create__lbl">CREATE NEW TAG</span>
                        <span className="chip sel"># {typed}</span>
                        <span className="tm-create__hint">PRESS ↵</span>
                    </button>
                </div>
                <div className="tm-field">
                    <span className="tm-label">EXISTING_DIRECTORY <span className="tm-count">02 SELECTED</span></span>
                    <div className="tm-chips">
                        <Chip label="IDEAS" selected />
                        <Chip label="PHOTOS" selected />
                        <Chip label="READ_LATER" />
                        <Chip label="DESIGN" />
                        <Chip label="AI" />
                    </div>
                </div>
            </div>
        </ModalShell>
    );
}

// ── V2 — assigned tray + combobox list w/ create as first row ──
function TagModalV2({ typed = 'LONG' }) {
    const matches = DIRECTORY.filter(t => t.toLowerCase().includes(typed.toLowerCase()));
    return (
        <ModalShell title="ASSIGN_TAGS" footer={<Footer count="02" />}>
            <div className="tm-body">
                {/* assigned tray */}
                <div className="tm-field">
                    <span className="tm-label">ASSIGNED <span className="tm-count">// 02</span></span>
                    <div className="tm-tray">
                        <Chip label="IDEAS" selected removable />
                        <Chip label="PHOTOS" selected removable />
                    </div>
                </div>
                <div className="tm-field">
                    <span className="tm-label">ADD A TAG</span>
                    <div className="tm-input-wrap light">
                        <span className="tm-prompt">&gt;</span>
                        <span className="tm-typed">{typed}<span className="caret" /></span>
                    </div>
                    {/* combobox results: create first, then matches */}
                    <div className="tm-list">
                        <button className="tm-row tm-row--create">
                            <span className="tm-row__ico">+</span>
                            <span className="tm-row__txt">Create <b># {typed}</b></span>
                            <span className="tm-kbd">↵</span>
                        </button>
                        {matches.map(t => (
                            <button key={t} className="tm-row">
                                <span className="tm-row__ico">#</span>
                                <span className="tm-row__txt">{t}</span>
                            </button>
                        ))}
                        {matches.length === 0 && <div className="tm-empty">NO MATCHES — ↵ TO CREATE</div>}
                    </div>
                </div>
            </div>
        </ModalShell>
    );
}

Object.assign(window, { TagModalCurrent, TagModalV1, TagModalV2 });
