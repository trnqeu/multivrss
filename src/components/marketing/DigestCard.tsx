"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { DigestItem } from "@/lib/blog";
import type { Dictionary } from "@/lib/i18n";
import { getDigestStatus } from "@/app/actions/digest";
import { saveDigestLink } from "@/app/actions/saved-links";
import { addDigestFeedSource } from "@/app/actions/feeds";
import { buildLoginResumeHref } from "@/lib/auth-resume-links";

type DigestStrings = Dictionary["digest"];

interface DigestContextValue {
  isSaved: (url: string) => boolean;
  isSubscribed: (feedUrl: string) => boolean;
  isPending: (id: string) => boolean;
  errorFor: (id: string) => string | undefined;
  save: (item: DigestItem) => Promise<void>;
  addFeed: (item: DigestItem) => Promise<void>;
  strings: DigestStrings;
}

const DigestContext = createContext<DigestContextValue | null>(null);

function useDigestContext(): DigestContextValue {
  const ctx = useContext(DigestContext);
  if (!ctx) throw new Error("DigestCard must be rendered inside a DigestProvider.");
  return ctx;
}

interface ProviderProps {
  items: DigestItem[];
  strings: DigestStrings;
  children: ReactNode;
}

// Resolves per-item SAVE/ADD FEED state and wires the two actions for every
// DigestCard in the subtree. Blog post pages are static and shared across
// every visitor, so "is this already saved/subscribed" can only be known
// client-side, after hydration — see getDigestStatus()'s header comment.
// Until that resolves, every card shows its default (not saved, not
// subscribed) state; nothing is disabled and there's no loading skeleton.
export function DigestProvider({ items, strings, children }: ProviderProps) {
  const pathname = usePathname();

  const [savedUrls, setSavedUrls] = useState<Set<string>>(new Set());
  const [subscribedFeedUrls, setSubscribedFeedUrls] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setPending = useCallback((id: string, pending: boolean) => {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (pending) next.add(id); else next.delete(id);
      return next;
    });
  }, []);

  const setItemError = useCallback((id: string, message: string | undefined) => {
    setErrors((prev) => {
      const next = { ...prev };
      if (message) next[id] = message; else delete next[id];
      return next;
    });
  }, []);

  // Logged-out click: don't hide the button, send the visitor through
  // /login and back to this exact post with the intent to finish —
  // DigestIntentResumer below picks it up on return.
  const redirectToLogin = useCallback((intent: "save" | "feed", item: DigestItem) => {
    const params = new URLSearchParams({ intent, url: item.url, title: item.title });
    if (intent === "feed" && item.feedUrl) {
      params.set("feedUrl", item.feedUrl);
      params.set("feedName", item.sourceName);
      params.set("feedCategory", item.feedCategory ?? "NEWS");
    }
    window.location.href = buildLoginResumeHref(`${pathname}?${params.toString()}`);
  }, [pathname]);

  const save = useCallback(async (item: DigestItem) => {
    setPending(item.id, true);
    setItemError(item.id, undefined);
    setSavedUrls((prev) => new Set(prev).add(item.url));

    const result = await saveDigestLink(item.url, item.title);
    setPending(item.id, false);

    if (!result.success) {
      setSavedUrls((prev) => {
        const next = new Set(prev);
        next.delete(item.url);
        return next;
      });
      if (result.message === "Unauthorized") {
        redirectToLogin("save", item);
        return;
      }
      setItemError(item.id, strings.saveErrorMessage);
    }
  }, [redirectToLogin, setPending, setItemError, strings.saveErrorMessage]);

  const addFeed = useCallback(async (item: DigestItem) => {
    if (!item.feedUrl) return;
    const feedUrl = item.feedUrl;

    setPending(item.id, true);
    setItemError(item.id, undefined);
    setSubscribedFeedUrls((prev) => new Set(prev).add(feedUrl));

    const result = await addDigestFeedSource(feedUrl, item.sourceName, item.feedCategory ?? "NEWS");
    setPending(item.id, false);

    if (!result.success) {
      setSubscribedFeedUrls((prev) => {
        const next = new Set(prev);
        next.delete(feedUrl);
        return next;
      });
      if (result.message === "Unauthorized") {
        redirectToLogin("feed", item);
        return;
      }
      setItemError(item.id, strings.addFeedErrorMessage);
    }
  }, [redirectToLogin, setPending, setItemError, strings.addFeedErrorMessage]);

  // Resolve existing saved/subscribed state once on mount. No searchParams
  // dependency here, so this can run outside of any Suspense boundary.
  useEffect(() => {
    async function run() {
      const articleUrls = items.map((i) => i.url);
      const feedUrls = items.filter((i) => i.feedUrl).map((i) => i.feedUrl!);
      if (articleUrls.length === 0 && feedUrls.length === 0) return;

      const status = await getDigestStatus(articleUrls, feedUrls);
      setSavedUrls(new Set(status.savedUrls));
      setSubscribedFeedUrls(new Set(status.subscribedFeedUrls));
    }
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: DigestContextValue = {
    isSaved: (url) => savedUrls.has(url),
    isSubscribed: (feedUrl) => subscribedFeedUrls.has(feedUrl),
    isPending: (id) => pendingIds.has(id),
    errorFor: (id) => errors[id],
    save,
    addFeed,
    strings,
  };

  return (
    <DigestContext.Provider value={value}>
      {/* useSearchParams() requires a Suspense boundary during static
          generation. Isolated into its own invisible leaf so the visible
          cards above stay part of the static shell instead of being routed
          through a Suspense fallback. */}
      <Suspense fallback={null}>
        <DigestIntentResumer items={items} />
      </Suspense>
      {children}
    </DigestContext.Provider>
  );
}

// Picks up where redirectToLogin() left off: after /login sends the visitor
// back to ?intent=save&url=... (or intent=feed&feedUrl=...), finishes the
// action and strips the intent params from the URL. Renders nothing.
function DigestIntentResumer({ items }: { items: DigestItem[] }) {
  const { save, addFeed } = useDigestContext();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const ranOnce = useRef(false);

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;

    const intent = searchParams.get("intent");
    if (intent !== "save" && intent !== "feed") return;

    async function run() {
      if (intent === "save") {
        const url = searchParams.get("url");
        const item = items.find((i) => i.url === url);
        if (item) await save(item);
      } else {
        const feedUrl = searchParams.get("feedUrl");
        const item = items.find((i) => i.feedUrl === feedUrl);
        if (item) await addFeed(item);
      }
      router.replace(pathname, { scroll: false });
    }

    run();
  }, [searchParams, pathname, router, items, save, addFeed]);

  return null;
}

interface CardProps {
  item: DigestItem;
}

// Renders a single digest-item block — see
// public/design-handoffs/design_handoff_digest for the visual spec.
export function DigestCard({ item }: CardProps) {
  const { isSaved, isSubscribed, isPending, errorFor, save, addFeed, strings } = useDigestContext();

  const saved = isSaved(item.url);
  const subscribed = item.feedUrl ? isSubscribed(item.feedUrl) : false;
  const pending = isPending(item.id);
  const error = errorFor(item.id);

  return (
    <div className="digest-item">
      <div className="digest-item__source">
        {item.sourceName}
        {item.feedCategory && (
          <>
            {" "}
            · <b>{item.feedCategory.toLowerCase()}</b>
          </>
        )}
      </div>
      <h3 className="digest-item__title">
        <a href={item.url} target="_blank" rel="noopener noreferrer">
          {item.title}
        </a>
      </h3>
      {item.blurb && <p className="digest-item__blurb">{item.blurb}</p>}
      <div className="digest-item__actions">
        <button
          type="button"
          className="btn btn--save"
          aria-pressed={saved}
          disabled={saved || pending}
          onClick={() => save(item)}
        >
          {saved ? strings.savedLabel : strings.saveLabel}
        </button>
        {item.feedUrl && (
          <button
            type="button"
            className="btn"
            disabled={subscribed || pending}
            onClick={() => addFeed(item)}
          >
            {subscribed ? strings.alreadySubscribedLabel : strings.addFeedLabel}
          </button>
        )}
      </div>
      {error && (
        <p role="status" aria-live="polite" className="digest-item__note digest-item__note--error">
          {error}
        </p>
      )}
    </div>
  );
}
