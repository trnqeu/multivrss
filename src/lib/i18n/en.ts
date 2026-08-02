import type { Dictionary } from "./types";

export const en: Dictionary = {
  nav: {
    items: [
      { label: "BLOG", slug: "#blog", isAnchor: true },
      { label: "GUIDE", slug: "guide" },
      { label: "SOURCES", slug: "sources" },
      { label: "TIPS", slug: "tips" },
    ],
    signIn: "SIGN IN",
    getStarted: "GET STARTED →",
  },
  hero: {
    kicker: "Read the web. Skip the noise.",
    headline1: "Feeds",
    headline2: "Bookmarks",
    bodyIntro:
      "MultivRSS is your Internet Reading Room. A minimalist workspace designed to manage the ",
    bodyBold1: "feeds you follow ",
    bodyMid: " and the ",
    bodyBold2: "links you save. ",
    bodySuffix: "",
    bodyReclaim: "",
    cta: "→ START HERE",
    subCta: "IT'S FREE!",
  },
  blog: {
    kicker: "JOURNAL",
    title: "Thoughts from the MultivRSS.",
    subtitle:
      "Guides, product notes and short field manuals, written in Markdown, shipped in open format.",
    feedLabel: "Subscribe to feed",
    feedHint: "FEED: /blog/en.xml · /blog/it.xml",
    seeAll: "SEE ALL POSTS →",
  },
  sources: {
    kicker: "CURATED SOURCES",
    title: "The feeds we actually read.",
    subtitle:
      "A hand-picked shelf to start from: no sponsorships, no rankings. Add any one to your reader; you'll be asked to sign up first.",
    seeAll: "SEE ALL SOURCES →",
    add: "ADD",
    footer: "PUBLIC SHELF · /sources · UPDATED WEEKLY · NO ACCOUNT NEEDED TO BROWSE",
  },
  sourcesPage: {
    kicker: "CURATED SOURCES · PUBLIC",
    h1: "The shelf.",
    introBody:
      "These are the feeds we actually read at MultivRSS: hand-picked, no sponsorships, no rankings. Search by name or topic, jump to a category, select multiple sources, and add them all at once.",
    statsSourcesLabel: "SOURCES",
    statsCategoriesLabel: "CATEGORIES · UPDATED WEEKLY",
    searchLabel: "Search sources",
    searchPlaceholder: "search source, domain, or topic…",
    allChipLabel: "ALL",
    resultsLabel: "results",
    selectAllLabel: "SELECT ALL",
    emptyState: "No sources found. Try a different search term.",
    bulkCountLabel: "sources selected",
    bulkDeselect: "DESELECT",
    bulkAddButton: "→ ADD SELECTED",
    closingKicker: "READY_TO_READ",
    closingHeadlinePre: "Add the whole ",
    closingHeadlineAccent: "shelf",
    closingHeadlineSuffix: ".",
    closingBody:
      "Create your reading room and import every source above in one move, then make it yours: add, remove, organize by category.",
    closingCta: "→ START FREE",
  },
  closing: {
    kicker: "END_OF_FEED",
    headlinePre: "Reclaim your ",
    headlineAccent: "attention",
    headlineSuffix: ".",
    body: "MultivRSS is where you come to read the internet in peace: just your updates and your bookmarks, in an open format that's yours and built to last. The web was meant to be read, not scrolled.",
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
    legalLinks: [
      { label: "Privacy Policy", slug: "privacy" },
      { label: "Cookie Policy", slug: "cookies" },
    ],
  },
  meta: {
    home: {
      title: "MultivRSS · Read the open web. Save what matters.",
      description:
        "Your Internet Reading Room. All your RSS feeds and bookmarks in one calm, minimal dashboard.",
    },
  },
};
