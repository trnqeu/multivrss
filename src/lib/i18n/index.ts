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
