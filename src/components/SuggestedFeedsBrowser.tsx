"use client";

import { useState } from "react";
import { addSuggestedFeeds } from "@/app/actions/starter-packs";
import type { SuggestedCategory, SuggestedFeed } from "@/lib/suggested-feeds";

interface Props {
  suggested: SuggestedCategory[];
  // Full-page usage (the standalone /suggested directory) pins the finder
  // bar to the top of its scroll container; embedded usage (the onboarding
  // empty state) renders it inline instead, since it isn't the page's own
  // scroll root.
  sticky?: boolean;
  // Notified with newly created FeedSource ids after any successful add
  // (single card or bulk bar), so a host screen can react — e.g. show an
  // undoable toast or refresh a source count.
  onAdded?: (sourceIds: string[]) => void;
}

type CardState = { status: "adding" | "added" | "error"; message?: string };

function getHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function keyOf(groupName: string, feedName: string): string {
  return `${groupName}|${feedName}`;
}

export default function SuggestedFeedsBrowser({ suggested, sticky = true, onAdded }: Props) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [cardStates, setCardStates] = useState<Record<string, CardState>>({});
  const [bulkPending, setBulkPending] = useState(false);

  const q = query.trim().toLowerCase();
  const totalAll = suggested.reduce((n, g) => n + g.feeds.length, 0);

  const visibleGroups = suggested.map((group) => {
    const visibleFeeds = group.feeds.filter((feed) => {
      const matchesQuery =
        !q ||
        feed.name.toLowerCase().includes(q) ||
        feed.domain.toLowerCase().includes(q) ||
        group.name.toLowerCase().includes(q);
      const matchesCategory = activeCategory === "ALL" || activeCategory === group.name;
      return matchesQuery && matchesCategory;
    });
    return { ...group, visibleFeeds };
  });

  const totalVisible = visibleGroups.reduce((n, g) => n + g.visibleFeeds.length, 0);
  const hasSelection = selected.size > 0;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllForGroup(group: SuggestedCategory) {
    const ids = group.feeds
      .filter((f) => cardStates[keyOf(group.name, f.name)]?.status !== "added")
      .map((f) => keyOf(group.name, f.name));
    if (ids.length === 0) return;
    const allOn = ids.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (allOn ? next.delete(id) : next.add(id)));
      return next;
    });
  }

  async function addKeys(keys: string[]) {
    setCardStates((prev) => {
      const next = { ...prev };
      keys.forEach((k) => (next[k] = { status: "adding" }));
      return next;
    });

    const result = await addSuggestedFeeds(keys);

    setCardStates((prev) => {
      const next = { ...prev };
      keys.forEach((k) => {
        next[k] = result.success
          ? { status: "added" }
          : { status: "error", message: result.message };
      });
      return next;
    });

    if (result.success) {
      setSelected((prev) => {
        const next = new Set(prev);
        keys.forEach((k) => next.delete(k));
        return next;
      });
      onAdded?.(result.sourceIds);
    }
  }

  async function handleBulkAdd() {
    const keys = Array.from(selected);
    if (keys.length === 0) return;
    setBulkPending(true);
    await addKeys(keys);
    setBulkPending(false);
  }

  return (
    <div className="relative">
      {/* Finder bar */}
      <div
        className={`${sticky ? "sticky top-0 z-20" : ""} bg-background border-2 border-foreground px-4 py-4 md:px-6`}
      >
        <div className="flex items-center gap-4 flex-wrap md:flex-nowrap">
          <div className="flex-none w-full md:w-[260px] flex items-center gap-2 border-2 border-foreground/30 px-3 py-2">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              className="shrink-0 opacity-50"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.6" y2="16.6" />
            </svg>
            <label htmlFor="suggested-browser-search" className="sr-only">
              Search sources
            </label>
            <input
              id="suggested-browser-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="search source, domain, or topic…"
              className="border-0 p-0 bg-transparent font-mono text-[12px] text-foreground w-full placeholder:text-foreground/30 focus-visible:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto flex-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              aria-pressed={activeCategory === "ALL"}
              onClick={() => setActiveCategory("ALL")}
              className={`shrink-0 border-2 px-3 py-1.5 font-mono text-[10px] font-bold tracking-widest uppercase whitespace-nowrap transition-colors ${
                activeCategory === "ALL"
                  ? "bg-foreground border-foreground text-background"
                  : "bg-transparent border-foreground/20 text-foreground/55 hover:border-foreground hover:text-foreground"
              }`}
            >
              ALL <span className="opacity-60 ml-1">{totalAll}</span>
            </button>
            {suggested.map((group) => (
              <button
                key={group.name}
                type="button"
                aria-pressed={activeCategory === group.name}
                onClick={() => setActiveCategory(group.name)}
                className={`shrink-0 border-2 px-3 py-1.5 font-mono text-[10px] font-bold tracking-widest uppercase whitespace-nowrap transition-colors ${
                  activeCategory === group.name
                    ? "bg-foreground border-foreground text-background"
                    : "bg-transparent border-foreground/20 text-foreground/55 hover:border-foreground hover:text-foreground"
                }`}
              >
                {group.name} <span className="opacity-60 ml-1">{group.feeds.length}</span>
              </button>
            ))}
          </div>

          <div className="shrink-0 font-mono text-[10.5px] text-foreground/40 tracking-[0.08em] whitespace-nowrap max-[720px]:hidden">
            <b className="text-foreground">{totalVisible}</b> results
          </div>
        </div>
      </div>

      {/* Category groups */}
      <div className="p-4 md:p-6 flex flex-col gap-8 pb-24">
        {totalVisible === 0 && (
          <p role="status" className="py-12 text-center font-mono text-[12px] text-foreground/40 tracking-[0.08em] uppercase">
            No sources match your search.
          </p>
        )}

        {visibleGroups.map((group) => {
          if (group.visibleFeeds.length === 0) return null;
          const selectableIds = group.feeds
            .filter((f) => cardStates[keyOf(group.name, f.name)]?.status !== "added")
            .map((f) => keyOf(group.name, f.name));
          const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));
          return (
            <section key={group.name}>
              <div className="flex items-center gap-4 mb-3 border-b border-foreground/20 pb-2">
                <h3 className="label-system text-foreground/60 whitespace-nowrap m-0">
                  {"// "}
                  {group.name}
                </h3>
                <span className="flex-1" aria-hidden="true" />
                <button
                  type="button"
                  aria-pressed={allSelected}
                  onClick={() => selectAllForGroup(group)}
                  disabled={selectableIds.length === 0}
                  className="shrink-0 border-0 p-0 bg-transparent font-mono text-[10px] font-bold tracking-widest uppercase text-terracotta hover:underline disabled:opacity-30 disabled:hover:no-underline"
                >
                  Select all
                </button>
                <span className="font-mono text-[10px] font-bold text-foreground/30">
                  {String(group.feeds.length).padStart(2, "0")}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.visibleFeeds.map((feed) => (
                  <FeedCard
                    key={feed.url}
                    feed={feed}
                    groupName={group.name}
                    checked={selected.has(keyOf(group.name, feed.name))}
                    state={cardStates[keyOf(group.name, feed.name)]}
                    onToggle={() => toggle(keyOf(group.name, feed.name))}
                    onAdd={() => addKeys([keyOf(group.name, feed.name)])}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Floating bulk-add bar */}
      <div
        aria-hidden={!hasSelection}
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-5 bg-foreground text-background border-2 border-foreground px-5 py-4 z-30 shadow-[0_12px_30px_rgba(0,0,0,0.25)] transition-transform duration-[180ms] ease-out max-[720px]:left-4 max-[720px]:right-4 max-[720px]:w-[calc(100%-32px)] max-[720px]:translate-x-0 max-[720px]:bottom-4 ${
          hasSelection ? "translate-y-0" : "translate-y-[150%]"
        }`}
      >
        <div role="status" aria-live="polite" className="font-mono text-[12px] font-bold tracking-widest whitespace-nowrap">
          <b className="text-terracotta">{selected.size}</b> selected
        </div>
        <button
          type="button"
          tabIndex={hasSelection ? 0 : -1}
          onClick={() => setSelected(new Set())}
          className="border-0 p-0 bg-transparent font-mono text-[10.5px] font-bold tracking-widest uppercase text-background/60 hover:text-background"
        >
          Deselect
        </button>
        <button
          type="button"
          tabIndex={hasSelection ? 0 : -1}
          onClick={handleBulkAdd}
          disabled={bulkPending}
          className="bg-terracotta text-foreground border-2 border-terracotta px-4 py-[10px] font-mono text-[10.5px] font-extrabold tracking-widest uppercase hover:bg-background hover:text-terracotta transition-colors disabled:opacity-50"
        >
          {bulkPending ? "Adding…" : `→ Add ${selected.size} selected`}
        </button>
      </div>
    </div>
  );
}

function FeedCard({
  feed,
  groupName,
  checked,
  state,
  onToggle,
  onAdd,
}: {
  feed: SuggestedFeed;
  groupName: string;
  checked: boolean;
  state?: CardState;
  onToggle: () => void;
  onAdd: () => void;
}) {
  const id = `src-${keyOf(groupName, feed.name)}`;
  const added = state?.status === "added";
  const adding = state?.status === "adding";

  return (
    <div className="border-2 border-foreground bg-background p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <label htmlFor={id} className="flex items-start gap-3 min-w-0 cursor-pointer">
          <input
            id={id}
            type="checkbox"
            checked={checked}
            disabled={added}
            onChange={onToggle}
            className="appearance-none w-[18px] h-[18px] p-0 mt-0.5 shrink-0 border-[1.5px] border-foreground/30 bg-transparent cursor-pointer relative checked:bg-terracotta checked:border-terracotta hover:border-foreground after:absolute after:inset-0 after:flex after:items-center after:justify-center after:text-[11px] after:font-extrabold after:leading-none after:text-background checked:after:content-['✓'] disabled:cursor-default disabled:opacity-50"
          />
          <span className="text-sm font-bold uppercase tracking-widest">{feed.name}</span>
        </label>
        {added ? (
          <span className="label-system text-terracotta text-[10px] shrink-0 mt-0.5">Added</span>
        ) : (
          <button
            type="button"
            onClick={onAdd}
            disabled={adding}
            className="bg-transparent text-foreground border-2 border-foreground px-3 py-1 text-[10px] font-bold uppercase tracking-widest shrink-0 mt-0.5 hover:bg-foreground hover:text-background transition-colors active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-40"
          >
            {adding ? "…" : "+ Add"}
          </button>
        )}
      </div>

      <p className="font-mono text-[11px] text-foreground/55 leading-relaxed m-0">{feed.description}</p>

      <a
        href={new URL(feed.url).origin}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-[11px] text-terracotta break-all hover:underline"
      >
        {getHost(feed.url)}
      </a>

      {state?.status === "error" && state.message && (
        <p role="alert" className="font-mono text-[10px] text-terracotta m-0">
          {state.message}
        </p>
      )}
    </div>
  );
}
