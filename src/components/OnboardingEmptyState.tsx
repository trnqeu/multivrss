'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Wordmark from "@/components/Wordmark";
import { STARTER_PACKS, type StarterPack } from '@/lib/suggested-feeds';
import { addStarterPack, undoStarterPack } from '@/app/actions';

type View = 'idle' | 'working' | 'done';

interface Props {
  username: string;
}

const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

export default function OnboardingEmptyState({ username }: Props) {
  const router = useRouter();
  const [view, setView] = useState<View>('idle');
  const [currentPack, setCurrentPack] = useState<StarterPack | null>(null);
  const [addedPackIds, setAddedPackIds] = useState<string[]>([]);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [lastSourceIds, setLastSourceIds] = useState<string[]>([]);
  const [toastCount, setToastCount] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); };
  }, []);

  async function handleAddPack(packId: string) {
    if (addedPackIds.includes(packId)) return;
    const pack = STARTER_PACKS.find(p => p.id === packId);
    if (!pack) return;

    setCurrentPack(pack);
    setLogLines([]);
    setView('working');

    // Server action runs in parallel with the log animation
    const actionPromise = addStarterPack(packId);

    await delay(350);
    const lines: string[] = [];
    for (let i = 0; i < pack.feeds.length; i++) {
      lines.push(pack.feeds[i].name);
      setLogLines([...lines]);
      if (i < pack.feeds.length - 1) await delay(240);
    }

    const [result] = await Promise.all([actionPromise, delay(420)]);

    setAddedPackIds(prev => [...prev, packId]);
    setLastSourceIds(result.sourceIds);
    setToastCount(result.sourceIds.length);
    setView('done');

    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setShowToast(true);
    toastTimerRef.current = setTimeout(() => setShowToast(false), 6000);
  }

  async function handleUndo() {
    setShowToast(false);
    await undoStarterPack(lastSourceIds);
    setAddedPackIds([]);
    setLastSourceIds([]);
    setView('idle');
  }

  // ── Sub-views ────────────────────────────────────────────────

  if (view === 'working' && currentPack) {
    return (
      <WorkingView pack={currentPack} logLines={logLines} />
    );
  }

  if (view === 'done' && currentPack) {
    return (
      <>
        <DoneView
          pack={currentPack}
          sourceCount={toastCount}
          onFrontPage={() => router.refresh()}
          onAddAnother={() => setView('idle')}
        />
        <Toast show={showToast} count={toastCount} onUndo={handleUndo} />
      </>
    );
  }

  // idle
  return (
    <>
      <IdleView
        username={username}
        addedPackIds={addedPackIds}
        onAddPack={handleAddPack}
      />
      <Toast show={showToast} count={toastCount} onUndo={handleUndo} />
    </>
  );
}

// ── Idle ────────────────────────────────────────────────────────

function IdleView({
  username,
  addedPackIds,
  onAddPack,
}: {
  username: string;
  addedPackIds: string[];
  onAddPack: (id: string) => void;
}) {
  return (
    <div className="max-w-[760px] mx-auto px-8 pt-[90px] pb-[100px] flex flex-col items-center text-center">
      <Image
        src="/logo/multivrss-mark.png"
        alt=""
        width={120}
        height={92}
        className="w-[120px] h-auto object-contain opacity-[0.95]"
      />
      <Wordmark className="mt-[22px] text-[26px] tracking-[0.1em]" />
      <div className="mt-[36px] inline-flex items-center gap-2 border border-terracotta/40 px-3 py-[5px] text-[10px] font-extrabold tracking-[.26em] uppercase text-terracotta">
        <span className="w-[6px] h-[6px] rounded-full bg-terracotta shrink-0" aria-hidden="true" />
        00 SOURCES
      </div>
      <div className="flex flex-col items-center gap-5" style={{ marginTop: '72px' }}>
      <h1 className="m-0 font-serif font-semibold text-[40px] leading-[1.08] tracking-[-0.02em]">
        No signal yet.
      </h1>
      <p className="m-0 text-[13px] font-medium text-foreground/55 leading-relaxed max-w-[42ch]">
        Feed the reader. Drop in a <strong className="text-foreground font-bold">starter pack</strong> and the stream comes alive — or wire up sources by hand.
      </p>
      </div>

      <Rule label="FASTEST WAY IN" />

      <InstantBanner onLoad={() => onAddPack('essentials')} alreadyAdded={addedPackIds.includes('essentials')} />

      <Rule label="OR PICK A PACK" />

      <div className="w-full grid grid-cols-2 max-[680px]:grid-cols-1 gap-px bg-foreground/15 border border-foreground/15">
        {STARTER_PACKS.map(pack => (
          <PackCard
            key={pack.id}
            pack={pack}
            added={addedPackIds.includes(pack.id)}
            onAdd={() => onAddPack(pack.id)}
          />
        ))}
      </div>

      <div className="w-full flex flex-col gap-px bg-foreground/15 border border-foreground/15 mt-[26px]">
        <FallbackPath
          icon={<DiscoverIcon />}
          title="Open the directory"
          description="40+ curated sources, organised by topic — add them one by one."
          href={`/u/${username}/suggested`}
        />
        <FallbackPath
          icon={<span className="text-terracotta text-[18px] leading-none font-bold">+</span>}
          title="Pipe in a URL"
          description="Already know a site you love? Drop its RSS / Atom link."
          href={`/u/${username}?addSource=1`}
        />
      </div>
    </div>
  );
}

// ── Working ─────────────────────────────────────────────────────

function WorkingView({ pack, logLines }: { pack: StarterPack; logLines: string[] }) {
  return (
    <div className="max-w-[760px] mx-auto px-8 pt-[60px] pb-[100px] flex flex-col items-center text-center">
      <Image
        src="/logo/multivrss-mark.png"
        alt=""
        width={120}
        height={92}
        className="w-[120px] h-auto object-contain opacity-50"
      />
      <Wordmark className="mt-[18px] text-[26px] tracking-[0.1em]" />
      <div className="mt-[34px] flex flex-col items-center gap-[14px]">
        <Spinner />
        <span className="font-serif text-[26px] font-semibold">Adding {pack.name}…</span>
      </div>
      <div
        role="status"
        aria-live="polite"
        aria-label="Feed loading progress"
        className="mt-[6px] text-[10px] font-semibold tracking-[.06em] text-foreground/40 leading-[1.9] text-center"
      >
        {logLines.map(line => (
          <div key={line}>
            <span className="text-terracotta mr-[7px]">✓</span>{line}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Done ────────────────────────────────────────────────────────

function DoneView({
  pack,
  sourceCount,
  onFrontPage,
  onAddAnother,
}: {
  pack: StarterPack;
  sourceCount: number;
  onFrontPage: () => void;
  onAddAnother: () => void;
}) {
  return (
    <div className="max-w-[760px] mx-auto px-8 pt-[60px] pb-[100px] flex flex-col items-center text-center">
      <Image
        src="/logo/multivrss-mark.png"
        alt=""
        width={120}
        height={92}
        className="w-[120px] h-auto object-contain opacity-[0.95]"
      />
      <Wordmark className="mt-[18px] text-[26px] tracking-[0.1em]" />
      <div className="mt-[26px] inline-flex items-center gap-2 border border-terracotta px-3 py-[5px] text-[10px] font-extrabold tracking-[.26em] uppercase text-terracotta">
        <span className="w-[6px] h-[6px] rounded-full bg-terracotta shrink-0 animate-pulse" aria-hidden="true" />
        SIGNAL ACQUIRED
      </div>
      <h1 className="mt-5 font-serif font-semibold text-[40px] leading-[1.08] tracking-[-0.02em]">
        <span className="text-terracotta text-[34px]">✓</span>
        <br />
        You&apos;re all set.
      </h1>
      <p className="mt-[14px] text-[13px] font-medium text-foreground/55 leading-relaxed max-w-[42ch]">
        <strong className="text-foreground font-bold">{sourceCount} sources</strong> from{' '}
        <strong className="text-foreground font-bold">{pack.name}</strong> are now syncing.
        Your front page is being assembled from the first articles.
      </p>
      <div className="flex gap-3 mt-[30px]">
        <button onClick={onFrontPage} className="btn btn--fill">
          Go to my front page →
        </button>
        <button onClick={onAddAnother} className="btn btn--ghost">
          Add another pack
        </button>
      </div>
    </div>
  );
}

// ── Toast ────────────────────────────────────────────────────────

function Toast({
  show,
  count,
  onUndo,
}: {
  show: boolean;
  count: number;
  onUndo: () => void;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed left-1/2 bottom-7 z-50 flex items-center gap-[18px] bg-background border-2 border-terracotta px-[18px] py-[13px] transition-[opacity,transform] duration-[280ms] ease-[cubic-bezier(.3,.8,.3,1)] ${
        show
          ? 'opacity-100 -translate-x-1/2 translate-y-0 pointer-events-auto'
          : 'opacity-0 -translate-x-1/2 translate-y-5 pointer-events-none'
      }`}
    >
      <span className="text-[10.5px] font-bold tracking-[.06em]">
        <span className="text-terracotta font-extrabold">{count}</span> SOURCES ADDED · syncing…
      </span>
      <button
        onClick={onUndo}
        className="font-mono text-[9.5px] font-extrabold tracking-[.14em] uppercase bg-transparent border border-foreground/30 text-foreground px-[11px] py-[6px] hover:bg-foreground hover:text-background transition-colors"
      >
        Undo
      </button>
    </div>
  );
}

// ── Shared sub-components ────────────────────────────────────────

function Rule({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-[14px] w-full my-10" aria-hidden="true">
      <span className="text-[10px] font-extrabold tracking-[.22em] text-foreground/40 whitespace-nowrap">{label}</span>
      <span className="flex-1 h-px bg-foreground/15" />
    </div>
  );
}

function InstantBanner({ onLoad, alreadyAdded }: { onLoad: () => void; alreadyAdded: boolean }) {
  return (
    <div className="w-full border-2 border-terracotta bg-gradient-to-b from-terracotta/12 to-transparent p-[24px_26px] flex max-[680px]:flex-col items-center max-[680px]:items-start gap-6 text-left">
      <span className="text-[30px] leading-none text-terracotta shrink-0" aria-hidden="true">⚡</span>
      <div className="flex-1 min-w-0">
        <div className="text-[9px] font-extrabold tracking-[.22em] uppercase text-terracotta">One-command setup</div>
        <div className="font-serif font-semibold text-[22px] leading-[1.15] tracking-[-0.01em] mt-[6px] mb-[7px]">Load the Essentials</div>
        <p className="text-[11.5px] font-medium text-foreground/55 leading-[1.55] max-w-[52ch]">
          <strong className="text-foreground font-bold">6 curated sources</strong>, auto-sorted into categories. Executes in one click. Reversible.
        </p>
      </div>
      <button
        onClick={onLoad}
        disabled={alreadyAdded}
        className="btn btn--fill shrink-0 disabled:opacity-50 disabled:cursor-default"
      >
        {alreadyAdded ? '✓ Added' : '+ Load Essentials'}
      </button>
    </div>
  );
}

function PackCard({ pack, added, onAdd }: { pack: StarterPack; added: boolean; onAdd: () => void }) {
  const shown = pack.feeds.slice(0, 3);
  const rest = pack.feeds.length - shown.length;

  return (
    <div className={`bg-background p-5 flex flex-col gap-3 text-left relative ${added ? 'outline outline-2 outline-terracotta -outline-offset-[2px]' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="font-serif font-semibold text-[19px] leading-[1.1] tracking-[-0.01em]">{pack.name}</div>
        <div className="text-[8.5px] font-extrabold tracking-[.14em] text-foreground/40 whitespace-nowrap pt-[5px]">
          {String(pack.feeds.length).padStart(2, '0')} FEEDS
        </div>
      </div>
      <div className="flex flex-wrap gap-[6px]">
        {shown.map(f => (
          <span key={f.name} className="text-[9px] font-bold tracking-[.08em] text-foreground/55 border border-foreground/20 px-[7px] py-[3px]">
            {f.name}
          </span>
        ))}
        {rest > 0 && (
          <span className="text-[9px] font-bold tracking-[.08em] text-foreground/40 border border-foreground/15 px-[7px] py-[3px]">
            +{rest} more
          </span>
        )}
      </div>
      <div className="flex items-center justify-between mt-auto pt-1">
        <span className="text-[8.5px] font-extrabold tracking-[.12em] text-terracotta uppercase">{pack.cats}</span>
        <button
          onClick={onAdd}
          disabled={added}
          aria-label={`Add ${pack.name} pack`}
          className={`font-mono text-[9.5px] font-extrabold tracking-[.13em] uppercase border px-3 py-[7px] transition-colors ${
            added
              ? 'bg-terracotta border-terracotta text-background cursor-default'
              : 'bg-transparent border-foreground text-foreground hover:bg-foreground hover:text-background'
          }`}
        >
          {added ? '✓ Added' : '+ Add pack'}
        </button>
      </div>
    </div>
  );
}

function FallbackPath({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="group bg-background flex items-center gap-4 px-5 py-4 text-left hover:bg-foreground/[0.04] transition-colors"
    >
      <span className="w-[18px] shrink-0 flex justify-center text-terracotta text-[14px]" aria-hidden="true">
        {icon}
      </span>
      <div className="flex-1">
        <div className="text-[11.5px] font-extrabold tracking-[.08em] text-foreground uppercase">{title}</div>
        <div className="text-[10px] font-medium text-foreground/40 tracking-[.03em] mt-[3px]">{description}</div>
      </div>
      <span className="text-foreground/30 text-[13px] group-hover:text-terracotta transition-colors" aria-hidden="true">→</span>
    </a>
  );
}

function Spinner() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="w-[34px] h-[34px] rounded-full border-[3px] border-foreground/15 border-t-terracotta animate-spin"
    />
  );
}

function DiscoverIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8.2 3.8 6.6 6.6 3.8 8.2 5.4 5.4z" fill="currentColor" />
    </svg>
  );
}
