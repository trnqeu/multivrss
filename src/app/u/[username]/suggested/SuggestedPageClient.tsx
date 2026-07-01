"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
  const [creatingNew, setCreatingNew] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const newCatInputRef = useRef<HTMLInputElement>(null);

  const selectedLabel = creatingNew
    ? newCategoryName || "NEW CATEGORY…"
    : categories.find((c) => c.id === pickedCategoryId)?.name ?? "CATEGORY…";

  const categoryReady = creatingNew
    ? newCategoryName.trim().length > 0
    : pickedCategoryId !== "";

  useEffect(() => {
    if (creatingNew) newCatInputRef.current?.focus();
  }, [creatingNew]);

  useEffect(() => {
    if (!dropdownOpen) return;
    function onOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [dropdownOpen]);

  const handleAdd = useCallback(async () => {
    if (!categoryReady) return;
    setAdding(true);
    setStatus("idle");
    setErrorMsg("");
    const formData = new FormData();
    formData.set("url", feed.url);
    formData.set("categoryId", creatingNew ? "" : pickedCategoryId);
    formData.set("newCategoryName", creatingNew ? newCategoryName : "");
    try {
      const result = await createFeedSource(null, formData);
      if (result.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMsg(result.message ?? "Failed to add feed.");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again.");
    }
    setAdding(false);
  }, [feed.url, pickedCategoryId, creatingNew, newCategoryName, categoryReady]);

  const showPicker = (pickedCategoryId || creatingNew) && status !== "success";

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
            onClick={() => {
              if (categories.length > 0) {
                setPickedCategoryId(categories[0].id);
              } else {
                setCreatingNew(true);
              }
            }}
            className="bg-transparent text-foreground border-2 border-foreground px-3 py-1 text-[10px] font-bold uppercase tracking-widest shrink-0 mt-0.5 hover:bg-foreground hover:text-background transition-colors active:translate-x-[2px] active:translate-y-[2px]"
          >
            + ADD
          </button>
        )}
      </div>

      <p className="font-mono text-[11px] text-foreground/55 leading-relaxed m-0">
        {feed.description}
      </p>

      <div className="flex items-center gap-2 flex-wrap">
        <a
          href={new URL(feed.url).origin}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[11px] text-terracotta break-all hover:underline"
        >
          {getHost(feed.url)}
        </a>
        {status === "error" && errorMsg && (
          <p role="alert" className="font-mono text-[10px] text-terracotta w-full mt-1">{errorMsg}</p>
        )}
        {showPicker && (
          <div className="flex items-center gap-2 ml-auto">
            {creatingNew ? (
              <div className="flex border border-terracotta">
                <label htmlFor={`newcat-${feed.url}`} className="sr-only">New category name</label>
                <input
                  id={`newcat-${feed.url}`}
                  ref={newCatInputRef}
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value.toUpperCase())}
                  placeholder="NEW CATEGORY…"
                  className="w-28 px-2 py-1 bg-transparent font-mono text-[10px] text-foreground placeholder:text-foreground/30 border-none focus-visible:outline-none"
                />
                <button
                  type="button"
                  onClick={() => { setCreatingNew(false); setNewCategoryName(""); }}
                  className="px-2 border-l border-terracotta bg-transparent text-terracotta font-mono text-[10px] hover:bg-white/5 transition-colors"
                >
                  ←
                </button>
              </div>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="font-mono text-[10px] bg-transparent border border-foreground px-2 py-1 text-foreground flex items-center gap-2"
                >
                  {selectedLabel}
                  <span className="text-terracotta">▾</span>
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 top-full z-10 mt-px bg-background border-2 border-foreground min-w-[160px]">
                    {categories.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => { setPickedCategoryId(c.id); setDropdownOpen(false); }}
                        className={`block w-full text-left px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors ${
                          pickedCategoryId === c.id ? "bg-terracotta text-background" : "text-foreground bg-background"
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => { setCreatingNew(true); setDropdownOpen(false); }}
                      className="block w-full text-left px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest border-t border-foreground/20 bg-terracotta text-background hover:opacity-90 transition-opacity"
                    >
                      + NEW CATEGORY…
                    </button>
                  </div>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={handleAdd}
              disabled={adding || !categoryReady}
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
            className="flex-1 bg-transparent text-foreground text-[11px] font-bold uppercase tracking-widest placeholder:text-foreground/30 border-none p-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-terracotta"
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

    </main>
  );
}
