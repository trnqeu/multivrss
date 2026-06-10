"use client";

import { useState, useCallback } from "react";
import { createFeedSource } from "@/app/actions";
import type { SuggestedCategory, SuggestedFeed } from "@/lib/suggested-feeds";
import type { Category } from "@prisma/client";

interface Props {
  categories: Category[];
  suggested: SuggestedCategory[];
}

function getHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function FeedCard({
  feed,
  categories,
}: {
  feed: SuggestedFeed;
  categories: Category[];
}) {
  const [adding, setAdding] = useState(false);
  const [pickedCategoryId, setPickedCategoryId] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const selectedLabel = categories.find((c) => c.id === pickedCategoryId)?.name ?? "CATEGORY…";

  const handleAdd = useCallback(async () => {
    if (!pickedCategoryId) return;
    setAdding(true);
    setStatus("idle");
    const formData = new FormData();
    formData.set("url", feed.url);
    formData.set("categoryId", pickedCategoryId);
    const result = await createFeedSource(null, formData);
    setStatus(result.success ? "success" : "error");
    setAdding(false);
  }, [feed.url, pickedCategoryId]);

  return (
    <div className="border-2 border-foreground bg-background p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-sm font-bold uppercase tracking-widest m-0">
          {feed.name}
        </h3>
        {status === "success" ? (
          <span className="label-system text-terracotta text-[10px] shrink-0 mt-0.5">
            ADDED
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setPickedCategoryId(categories[0]?.id ?? "")}
            className="bg-transparent text-foreground border-2 border-foreground px-3 py-1 text-[10px] font-bold uppercase tracking-widest shrink-0 mt-0.5 hover:bg-foreground hover:text-background transition-colors active:translate-x-[2px] active:translate-y-[2px]"
          >
            + ADD
          </button>
        )}
      </div>

      <p className="font-mono text-[11px] text-foreground/55 leading-relaxed m-0">
        {feed.description}
      </p>

      <div className="flex items-center gap-2">
        <span className="font-mono text-[11px] text-terracotta break-all">
          {getHost(feed.url)}
        </span>
        {pickedCategoryId && status !== "success" && (
          <div className="flex items-center gap-2 ml-auto">
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="font-mono text-[10px] bg-transparent border border-foreground px-2 py-1 text-foreground flex items-center gap-2"
              >
                {selectedLabel}
                <span className="text-terracotta">▾</span>
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 top-full z-10 mt-px bg-background border-2 border-foreground min-w-[140px]">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { setPickedCategoryId(c.id); setDropdownOpen(false); }}
                      className={`block w-full text-left px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors ${
                        pickedCategoryId === c.id ? 'bg-terracotta text-background' : 'text-foreground bg-background'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleAdd}
              disabled={adding || !pickedCategoryId}
              className="bg-terracotta text-background border-2 border-terracotta px-3 py-1 text-[10px] font-bold uppercase tracking-widest hover:bg-background hover:text-terracotta transition-colors disabled:opacity-40 active:translate-x-[2px] active:translate-y-[2px]"
            >
              {adding ? "…" : "ADD →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SuggestedPageClient({
  categories,
  suggested,
}: Props) {
  const [search, setSearch] = useState("");

  const filtered = suggested
    .map((cat) => ({
      ...cat,
      feeds: cat.feeds.filter(
        (f) =>
          f.name.toLowerCase().includes(search.toLowerCase()) ||
          f.description.toLowerCase().includes(search.toLowerCase()) ||
          f.category.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((cat) => cat.feeds.length > 0);

  return (
    <main className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden relative scroll-smooth bg-background">
      {/* Directory header */}
      <header className="p-6 md:p-8 border-b-2 border-foreground">
        <div className="label-system font-mono text-[11px] text-terracotta mb-2">
          {'// DIRECTORY — CURATED_SOURCES'}
        </div>
        <div className="flex items-center gap-3 max-w-md">
          <span className="text-terracotta text-[10px] font-bold shrink-0">
            Q
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="filter the directory..."
            className="flex-1 bg-transparent text-foreground text-[11px] font-bold uppercase tracking-widest placeholder:text-foreground/30 outline-none border-none p-0"
          />
        </div>
      </header>

      {/* Feed grid per category */}
      <div className="p-6 md:p-8 flex flex-col gap-10">
        {filtered.length === 0 && (
          <p className="font-mono text-xs text-foreground/40 text-center pt-10">
            No suggested feeds match your filter.
          </p>
        )}

        {filtered.map((cat) => (
          <section key={cat.name}>
            <h2 className="label-system text-xs text-foreground/60 mb-4 border-b border-foreground/20 pb-2">
              {'// '}{cat.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cat.feeds.map((feed) => (
                <FeedCard
                  key={feed.url}
                  feed={feed}
                  categories={categories}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Staff Pick */}
      <div className="border-t-2 border-foreground p-6 md:p-8">
        <div className="max-w-3xl mx-auto border-2 border-foreground p-6 md:p-8 flex flex-col md:flex-row gap-6">
          <div className="flex-1 flex flex-col gap-4">
            <span className="label-system text-[10px] text-terracotta border border-terracotta px-2 py-0.5 w-fit">
              STAFF PICK — RECOMMENDED
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold uppercase tracking-tight m-0 leading-tight">
              The Low-Level Logs
            </h2>
            <p className="font-mono text-xs text-foreground/55 leading-relaxed m-0">
              Deep technical essays on systems programming, kernel internals, and
              low-level software engineering. Hand-picked by the MultivRSS team.
            </p>
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                className="bg-terracotta text-background border-2 border-terracotta px-5 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-background hover:text-terracotta transition-colors active:translate-x-[2px] active:translate-y-[2px]"
              >
                Subscribe to Logs
              </button>
              <button
                type="button"
                className="bg-transparent text-foreground border-2 border-foreground px-5 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors active:translate-x-[2px] active:translate-y-[2px]"
              >
                Preview
              </button>
            </div>
          </div>
          <div className="hidden md:flex w-48 h-48 border-2 border-foreground items-center justify-center bg-foreground/5">
            <span className="font-mono text-[10px] text-foreground/30 uppercase tracking-widest">
              [code]
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
