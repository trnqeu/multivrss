import type { Dictionary } from "./types";

export const en: Dictionary = {
  nav: {
    items: [
      { label: "BLOG", slug: "#blog", isAnchor: true },
      { label: "GUIDE", slug: "guide" },
      { label: "SOURCES", slug: "sources" },
      { label: "TIPS", slug: "tips" },
      { label: "FAQ", slug: "faq" },
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
  faqPage: {
    kicker: "QUESTIONS · ANSWERED",
    h1: "FAQ.",
    introBody:
      "Everything people ask us before signing up, in one place: what MultivRSS does, how your data is handled, what's free, and how the technical bits work.",
    aiDisclaimer:
      "This FAQ was drafted with AI assistance and reviewed by our team. If anything here looks off or out of date, let us know.",
    categories: [
      {
        id: "product",
        title: "Product & features",
        items: [
          {
            question: "What is MultivRSS?",
            answer:
              "An RSS reader and a reading list in one calm dashboard: subscribe to the feeds you follow, save any link you want to read later, and search across both.",
          },
          {
            question: "What's the difference between the Front Page and the River?",
            answer:
              "The Front Page is a personalized digest of what's worth reading right now. The River is the full chronological stream of everything from your feeds, oldest or newest first.",
          },
          {
            question: "How does the Front Page decide what to show me?",
            answer:
              "It rebuilds once a day. It leads with your For You strip, then groups the rest by category: for each category we first pull in articles from the sources you've been reading or saving from lately, then top up with the freshest unread articles from that category's other sources so it's never empty. Nothing you've already been shown there gets repeated.",
          },
          {
            question: "How is the For You strip picked?",
            answer:
              "For You looks at what you've actually read and saved over the last 30 days to figure out which sources you care about most, saved articles count more than ones you've just read. It then pulls the freshest unread articles from those sources, ranks them by how strong that signal is, and shuffles the top picks into the strip so it's not in the same order every day.",
          },
          {
            question: "What is Reader Mode?",
            answer:
              "A clean, in-app view of the full article — no ads, no distracting layout — extracted directly from the source page so you never have to leave MultivRSS to read.",
          },
          {
            question: "Does search cover my saved links too, or just my feeds?",
            answer:
              "Both. Search is unified across everything you subscribe to and everything you've saved, and you can filter results by category, time range, source, or read status.",
          },
          {
            question: "How often are my feeds updated?",
            answer:
              "Feeds sync automatically in the background. If you don't want to wait, there's also a manual sync button that refreshes everything right away.",
          },
        ],
      },
      {
        id: "account",
        title: "Account & privacy",
        items: [
          {
            question: "How do I create an account?",
            answer:
              "With an email and password (you'll verify your email first), or by continuing with your Google or GitHub account.",
          },
          {
            question: "Do you sell or share my data?",
            answer:
              "No. MultivRSS doesn't run ads or analytics trackers, and doesn't sell or rent your data. A short list of service providers (like our error-monitoring tool) help us run the product — see the Privacy Policy for the full list.",
          },
          {
            question: "Is MultivRSS open source? Can I self-host it?",
            answer:
              "Not today. Self-hosting is something we're evaluating, not something available or decided yet.",
          },
          {
            question: "Can I delete my account and my data?",
            answer:
              "Yes — it's not self-service in the dashboard yet, so email privacy@multivrss.com and we'll delete your account and its data within 30 days.",
          },
        ],
      },
      {
        id: "pricing",
        title: "Pricing & limits",
        items: [
          {
            question: "How much does MultivRSS cost?",
            answer: "MultivRSS is free to use. There's no paid plan today.",
          },
          {
            question: "Are there any limits on the free plan?",
            answer:
              "Two, and we'd rather tell you upfront: a maximum of 200 feeds per account, and unsaved articles are automatically removed after 90 days. Anything you save to your reading list is kept indefinitely.",
          },
          {
            question: "What happens to an article after 90 days?",
            answer:
              "If you haven't saved it to your reading list, it's automatically cleared to keep things tidy. Saving it any time before then keeps it for good.",
          },
          {
            question: "Will there be a paid plan in the future?",
            answer:
              "Possibly, but nothing is decided or live yet — the free tier isn't a time-limited trial. If that changes, we'll announce it clearly, here and elsewhere.",
          },
        ],
      },
      {
        id: "technical",
        title: "Technical",
        items: [
          {
            question: "What kinds of feeds can I subscribe to?",
            answer:
              "Any standard RSS or Atom feed URL. Plenty of sites without an obvious feed still expose one — see our Tips & Tricks page for URL tricks covering Google News, Substack, Reddit, YouTube, Medium, WordPress, GitHub, and more.",
          },
          {
            question: "Can I subscribe to a YouTube channel?",
            answer:
              "Yes — paste a channel URL (or a @handle) and MultivRSS resolves it to that channel's video feed automatically.",
          },
          {
            question: "Can I import or export my feed list?",
            answer:
              "Yes, from Settings: export all your feed sources to CSV any time, or import a CSV file to bulk-add feeds (a URL column is required; category and title columns are optional).",
          },
          {
            question: "Is there a browser extension?",
            answer:
              "Not yet — it's on our roadmap. The API it will use to add feeds and save articles already exists today.",
          },
          {
            question: "Can I install MultivRSS on my phone or desktop?",
            answer:
              "Yes — MultivRSS is an installable app. On Android and desktop Chrome or Edge, look for \"Install\" in the browser menu. On iOS, use Safari's Share menu and choose \"Add to Home Screen\".",
          },
        ],
      },
    ],
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
      { label: "FAQ", slug: "faq" },
      { label: "RSS feeds", href: "#" },
      { label: "Changelog", slug: "changelog" },
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
