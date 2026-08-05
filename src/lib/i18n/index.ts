import type { Dictionary } from "./types";
import { en } from "./en";
import { it } from "./it";

export type { Dictionary } from "./types";
export type Lang = "en" | "it";

export const SUPPORTED_LANGS = ["en", "it"] as const satisfies Lang[];
export const DEFAULT_LANG: Lang = "en";

const dictionaries: Record<Lang, Dictionary> = { en, it };

export function getDictionary(lang: Lang): Dictionary {
  return dictionaries[lang];
}

export function isValidLang(lang: string): lang is Lang {
  return SUPPORTED_LANGS.includes(lang as Lang);
}

// Best-effort language detection from a raw Accept-Language header value.
// Used where no stored per-user language preference exists (there is no
// User.locale column or locale cookie in this app).
export function detectLangFromHeader(acceptLanguage: string): Lang {
  return acceptLanguage.toLowerCase().includes("it") ? "it" : DEFAULT_LANG;
}
