"use client";

import { useState } from "react";
import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";
import { buildAddFeedHref, buildLoginResumeHref } from "@/lib/auth-resume-links";

type FinderSource = { name: string; domain: string; url: string; description: string };
type FinderGroup = { name: string; sources: FinderSource[] };

interface Props {
  groups: FinderGroup[];
  dict: Dictionary["sourcesPage"];
  addLabel: string;
}

// Caps how many curated sources the floating bar can bulk-add in one login
// redirect — keeps the /login?callbackUrl=/u/add?key=... chain comfortably
// short (see the matching MAX_BULK in src/app/u/add/route.ts).
const MAX_BULK = 30;

// Sends only lookup keys ("category|name"), never raw URLs — /u/add resolves
// each key against its own SUGGESTED_FEEDS list server-side, so a tampered
// link can't be used to add attacker-chosen feeds to a victim's account.
function buildBulkAddHref(selected: Set<string>): string {
  const params = new URLSearchParams();
  Array.from(selected)
    .slice(0, MAX_BULK)
    .forEach((key) => params.append("key", key));
  return buildLoginResumeHref(`/u/add?${params.toString()}`);
}

function AddButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1 border-[1.5px] border-black px-3 py-[7px] font-mono text-[10px] font-extrabold tracking-[0.14em] uppercase shrink-0 hover:bg-terracotta hover:border-terracotta transition-colors"
    >
      <span className="text-terracotta text-[13px] leading-none group-hover:text-black transition-colors">
        +
      </span>
      {label}
    </Link>
  );
}

export default function MarketingSourcesFinder({ groups, dict, addLabel }: Props) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const q = query.trim().toLowerCase();
  const totalAll = groups.reduce((n, g) => n + g.sources.length, 0);

  const visibleGroups = groups.map((group) => {
    const visibleSources = group.sources.filter((source) => {
      const matchesQuery =
        !q ||
        source.name.toLowerCase().includes(q) ||
        source.domain.toLowerCase().includes(q) ||
        group.name.toLowerCase().includes(q);
      const matchesCategory = activeCategory === "ALL" || activeCategory === group.name;
      return matchesQuery && matchesCategory;
    });
    return { ...group, visibleSources };
  });

  const totalVisible = visibleGroups.reduce((n, g) => n + g.visibleSources.length, 0);
  const hasSelection = selected.size > 0;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllForCategory(group: FinderGroup) {
    const ids = group.sources.map((s) => `${group.name}|${s.name}`);
    const allOn = ids.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (allOn ? next.delete(id) : next.add(id)));
      return next;
    });
  }

  return (
    <>
      {/* Sticky finder bar */}
      <div className="sticky top-0 z-20 bg-paper border-t-2 border-b-2 border-black px-[34px] py-4 max-[920px]:px-[22px] max-[920px]:py-3">
        <div className="max-w-[1200px] mx-auto flex items-center gap-[18px] max-[920px]:flex-wrap max-[920px]:gap-[10px]">
          <div className="flex-none w-[300px] max-[920px]:w-full flex items-center gap-[10px] border-[1.5px] border-black px-[14px] py-[10px]">
            <svg
              width="14"
              height="14"
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
            <label htmlFor="sources-search" className="sr-only">
              {dict.searchLabel}
            </label>
            <input
              id="sources-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={dict.searchPlaceholder}
              className="border-0 p-0 outline-0 bg-transparent font-mono text-[12.5px] tracking-[0.02em] text-black w-full placeholder:text-black/30"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto flex-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              aria-pressed={activeCategory === "ALL"}
              onClick={() => setActiveCategory("ALL")}
              className={`shrink-0 border-[1.5px] px-[13px] py-[7px] font-mono text-[10.5px] font-bold tracking-[0.1em] uppercase whitespace-nowrap transition-colors ${
                activeCategory === "ALL"
                  ? "bg-black border-black text-paper"
                  : "bg-transparent border-black/12 text-black/55 hover:border-black hover:text-black"
              }`}
            >
              {dict.allChipLabel}
              <span className="opacity-60 ml-[5px]">{totalAll}</span>
            </button>
            {groups.map((group) => (
              <button
                key={group.name}
                type="button"
                aria-pressed={activeCategory === group.name}
                onClick={() => setActiveCategory(group.name)}
                className={`shrink-0 border-[1.5px] px-[13px] py-[7px] font-mono text-[10.5px] font-bold tracking-[0.1em] uppercase whitespace-nowrap transition-colors ${
                  activeCategory === group.name
                    ? "bg-black border-black text-paper"
                    : "bg-transparent border-black/12 text-black/55 hover:border-black hover:text-black"
                }`}
              >
                {group.name}
                <span className="opacity-60 ml-[5px]">{group.sources.length}</span>
              </button>
            ))}
          </div>

          <div className="shrink-0 font-mono text-[10.5px] text-black/30 tracking-[0.08em] whitespace-nowrap max-[920px]:hidden">
            <b className="text-black">{totalVisible}</b> {dict.resultsLabel}
          </div>
        </div>
      </div>

      {/* Category groups */}
      <section className="px-[34px] pt-1.5 pb-8 max-[920px]:px-[22px]">
        <div className="max-w-[1200px] mx-auto">
          {visibleGroups.map((group) => {
            if (group.visibleSources.length === 0) return null;
            const ids = group.sources.map((s) => `${group.name}|${s.name}`);
            const allSelected = ids.every((id) => selected.has(id));
            return (
              <div key={group.name} className="border-t-2 border-black pt-[26px] pb-[30px]">
                <div className="flex items-center gap-4 mb-2.5">
                  <span className="font-mono text-[13px] font-extrabold tracking-[0.22em] uppercase whitespace-nowrap">
                    {group.name}
                  </span>
                  <span className="flex-1 h-px bg-black/12" aria-hidden="true" />
                  <button
                    type="button"
                    aria-pressed={allSelected}
                    onClick={() => selectAllForCategory(group)}
                    className="shrink-0 border-0 p-0 bg-transparent font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-terracotta hover:underline"
                  >
                    {dict.selectAllLabel}
                  </button>
                  <span className="font-mono text-[10px] font-bold text-black/30">
                    {String(group.sources.length).padStart(2, "0")}
                  </span>
                </div>
                <ul className="list-none m-0 p-0 grid grid-cols-1 min-[920px]:grid-cols-2 gap-4">
                  {group.visibleSources.map((source) => {
                    const id = `${group.name}|${source.name}`;
                    const checked = selected.has(id);
                    const inputId = `src-${id}`;
                    return (
                      <li key={source.url} className="border-2 border-black p-5 flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-4">
                          <label
                            htmlFor={inputId}
                            className="flex items-start gap-3 min-w-0 cursor-pointer"
                          >
                            <input
                              id={inputId}
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggle(id)}
                              className="appearance-none w-[18px] h-[18px] p-0 mt-0.5 shrink-0 border-[1.5px] border-black/12 bg-transparent cursor-pointer relative checked:bg-terracotta checked:border-terracotta hover:border-black after:absolute after:inset-0 after:flex after:items-center after:justify-center after:text-[11px] after:font-extrabold after:leading-none after:text-black checked:after:content-['✓']"
                            />
                            <span className="text-[16px] font-bold tracking-[-0.005em] leading-snug">
                              {source.name}
                            </span>
                          </label>
                          <AddButton
                            href={buildAddFeedHref(source.url, source.name, group.name)}
                            label={addLabel}
                          />
                        </div>
                        {source.description && (
                          <p className="font-mono text-[11px] text-black/55 leading-relaxed m-0">
                            {source.description}
                          </p>
                        )}
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[11px] text-terracotta break-all hover:underline"
                        >
                          {source.domain}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}

          {totalVisible === 0 && (
            <p
              role="status"
              className="py-16 text-center font-mono text-[12px] text-black/30 tracking-[0.08em] uppercase"
            >
              {dict.emptyState}
            </p>
          )}
        </div>
      </section>

      {/* Floating bulk-add bar — stays mounted (for the slide transition) even
          when empty, so its interactive children are pulled out of the tab
          order via tabIndex rather than relying on the transform alone. */}
      <div
        aria-hidden={!hasSelection}
        className={`fixed bottom-[26px] left-1/2 -translate-x-1/2 flex items-center gap-[22px] bg-black text-paper border-2 border-black px-[22px] py-4 z-30 shadow-[0_12px_30px_rgba(0,0,0,0.25)] transition-transform duration-[180ms] ease-out max-[920px]:left-4 max-[920px]:right-4 max-[920px]:w-[calc(100%-32px)] max-[920px]:translate-x-0 max-[920px]:bottom-4 ${
          hasSelection ? "translate-y-0" : "translate-y-[150%]"
        }`}
      >
        <div role="status" aria-live="polite" className="font-mono text-[12px] font-bold tracking-[0.08em] whitespace-nowrap">
          <b className="text-terracotta">{selected.size}</b> {dict.bulkCountLabel}
        </div>
        <button
          type="button"
          tabIndex={hasSelection ? 0 : -1}
          onClick={() => setSelected(new Set())}
          className="border-0 p-0 bg-transparent font-mono text-[10.5px] font-bold tracking-[0.1em] uppercase text-white/55 hover:text-paper"
        >
          {dict.bulkDeselect}
        </button>
        <Link
          href={buildBulkAddHref(selected)}
          tabIndex={hasSelection ? 0 : -1}
          className="bg-terracotta text-black border-2 border-terracotta px-4 py-[10px] font-mono text-[10.5px] font-extrabold tracking-[0.2em] uppercase hover:bg-black hover:text-terracotta hover:border-black transition-colors"
        >
          {dict.bulkAddButton}
        </Link>
      </div>
    </>
  );
}
