import type { Lang } from "@/lib/i18n";

/**
 * Single source of truth for marketing header + footer navigation.
 *
 * Add a nav item here once — `MarketingNav` and `MarketingFooter` both
 * iterate this table instead of keeping their own copy of the link list.
 * Route paths are the app's real existing routes (not the illustrative
 * `/it/...`-prefixed slugs used in design mockups): `login`/`register` are
 * unprefixed top-level routes, everything else lives under `/{lang}/...`.
 */

export type FooterGroup = "product" | "explore" | "account";

export interface BilingualLabel {
  en: string;
  it: string;
}

export interface NavRoute {
  id: string;
  /** Path segment under `/{lang}/`. Mutually exclusive with `path`. */
  slug?: string;
  /** Full path for routes outside the `/{lang}/` tree. `{lang}` is replaced with the current language. */
  path?: string;
  label: BilingualLabel;
  /** Footer-specific label, when it reads differently than the header entry for the same route. */
  footerLabel?: BilingualLabel;
  inHeader: boolean;
  /** Rendered as an auth button on the right of the header instead of a plain nav link. */
  headerButton?: boolean;
  inFooter: boolean;
  footerGroup?: FooterGroup;
  /** Renders as the filled/primary header button instead of the outlined one. Only meaningful with `headerButton`. */
  primary?: boolean;
}

export const NAV_ROUTES: NavRoute[] = [
  { id: "blog", slug: "blog", label: { en: "Blog", it: "Blog" }, inHeader: true, inFooter: true, footerGroup: "explore" },
  { id: "guide", slug: "guide", label: { en: "Guide", it: "Guida" }, inHeader: true, inFooter: true, footerGroup: "product" },
  { id: "sources", slug: "sources", label: { en: "Sources", it: "Fonti" }, inHeader: true, inFooter: true, footerGroup: "product" },
  { id: "tips", slug: "tips", label: { en: "Tips", it: "Suggerimenti" }, inHeader: true, inFooter: true, footerGroup: "product" },
  { id: "faq", slug: "faq", label: { en: "FAQ", it: "FAQ" }, inHeader: true, inFooter: true, footerGroup: "product" },
  { id: "rss", path: "/blog/{lang}.xml", label: { en: "RSS feed", it: "Feed RSS" }, inHeader: false, inFooter: true, footerGroup: "explore" },
  { id: "changelog", slug: "changelog", label: { en: "Changelog", it: "Changelog" }, inHeader: false, inFooter: true, footerGroup: "explore" },
  { id: "signIn", path: "/login", label: { en: "Sign in", it: "Accedi" }, inHeader: true, headerButton: true, inFooter: true, footerGroup: "account" },
  {
    id: "getStarted",
    path: "/register",
    label: { en: "Get started →", it: "Inizia →" },
    footerLabel: { en: "Create account", it: "Crea account" },
    inHeader: true,
    headerButton: true,
    primary: true,
    inFooter: true,
    footerGroup: "account",
  },
];

export const LEGAL_ROUTES: NavRoute[] = [
  { id: "privacy", slug: "privacy", label: { en: "Privacy Policy", it: "Privacy Policy" }, inHeader: false, inFooter: true },
  { id: "cookies", slug: "cookies", label: { en: "Cookie Policy", it: "Cookie Policy" }, inHeader: false, inFooter: true },
];

export const FOOTER_GROUP_LABELS: Record<FooterGroup, BilingualLabel> = {
  product: { en: "Product", it: "Prodotto" },
  explore: { en: "Explore", it: "Esplora" },
  account: { en: "Account", it: "Account" },
};

/** Resolves a `NavRoute` to its href for the given language. */
export function routeHref(route: NavRoute, lang: Lang): string {
  if (route.path) return route.path.replace("{lang}", lang);
  return `/${lang}/${route.slug}`;
}

/** Whether `pathname` matches this route's resolved href for `lang`. */
export function isRouteActive(route: NavRoute, lang: Lang, pathname: string): boolean {
  return pathname === routeHref(route, lang);
}
