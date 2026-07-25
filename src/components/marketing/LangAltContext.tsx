"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface LangAltValue {
  altHref: string | null;
  setAltHref: (href: string | null) => void;
}

const LangAltContext = createContext<LangAltValue | null>(null);

export function LangAltProvider({ children }: { children: ReactNode }) {
  const [altHref, setAltHref] = useState<string | null>(null);
  return (
    <LangAltContext.Provider value={{ altHref, setAltHref }}>{children}</LangAltContext.Provider>
  );
}

function useLangAltContext(): LangAltValue {
  const ctx = useContext(LangAltContext);
  if (!ctx) throw new Error("useLangAltContext must be used within LangAltProvider");
  return ctx;
}

export function useLangAlt(): string | null {
  return useLangAltContext().altHref;
}

// Lets a page override the "other language" link in SystemStrip when the
// current route's slug isn't the same across languages (e.g. blog posts).
// Clears the override on unmount so it doesn't leak into other pages.
export function useSetLangAlt(href: string | null) {
  const { setAltHref } = useLangAltContext();
  useEffect(() => {
    setAltHref(href);
    return () => setAltHref(null);
  }, [href, setAltHref]);
}
