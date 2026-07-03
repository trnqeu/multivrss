import type { Dictionary } from "./types";

export const en: Dictionary = {
  nav: {
    items: [
      { label: "MANIFESTO", slug: "#manifesto", isAnchor: true },
      { label: "GUIDE", slug: "guide" },
      { label: "SOURCES", slug: "sources" },
      { label: "TIPS", slug: "tips" },
    ],
    signIn: "SIGN IN",
    getStarted: "GET STARTED →",
  },
  hero: {
    kicker: "YOUR INTERNET READING ROOM",
    headline1: "Read the web.",
    headline2: "Save what matters.",
    bodyIntro:
      "MultivRSS is your Internet Reading Room — a calm place to read the internet. Here you will find two things: ",
    bodyBold1: "updates",
    bodyMid: " and ",
    bodyBold2: "bookmarks",
    bodySuffix: ": the feeds you picked, the links you kept. ",
    bodyReclaim: "Start reading and reclaim your attention.",
    cta: "→ START HERE",
    subCta: "IT'S FREE!",
  },
  blog: {
    kicker: "JOURNAL",
    title: "Notes from the open web.",
    subtitle:
      "Guides, product notes and short field manuals — written in Markdown, shipped in open format.",
    feedLabel: "Subscribe to feed",
    feedHint: "FEED: /blog/en.xml · /blog/it.xml",
  },
  sources: {
    kicker: "CURATED SOURCES",
    title: "The feeds we actually read.",
    subtitle:
      "A hand-picked shelf to start from — no sponsorships, no rankings. Add any one to your reader; you'll be asked to sign up first.",
    seeAll: "SEE ALL SOURCES →",
    add: "ADD",
    footer: "PUBLIC SHELF · /sources · UPDATED WEEKLY · NO ACCOUNT NEEDED TO BROWSE",
  },
  closing: {
    kicker: "END_OF_FEED",
    headlinePre: "Reclaim your ",
    headlineAccent: "attention",
    headlineSuffix: ".",
    body: "MultivRSS is where you come to read the internet in peace — just your updates and your bookmarks, in an open format that's yours and built to last. The web was meant to be read, not scrolled.",
    cta: "→ CREATE YOUR ACCOUNT",
    secondaryCta: "READ THE BLOG ↗",
  },
  footer: {
    tagline: "An RSS aggregator and reading list in one open-format dashboard. Ad-free, calm, yours.",
    productLabel: "Product",
    resourcesLabel: "Resources",
    productLinks: [
      { label: "Reader", href: "#" },
      { label: "Reading list", href: "#" },
      { label: "Search", href: "#" },
      { label: "Blog", href: "#blog", isAnchor: true },
    ],
    resourceLinks: [
      { label: "Curated sources", slug: "sources" },
      { label: "Tips & tricks", slug: "tips" },
      { label: "RSS feeds", href: "#" },
      { label: "Changelog", href: "#" },
      { label: "Status", href: "#" },
    ],
  },
  meta: {
    home: {
      title: "MultivRSS — Read the open web. Save what matters.",
      description:
        "Your Internet Reading Room. All your RSS feeds and bookmarks in one calm, ad-free, open-format dashboard.",
    },
  },
};
