export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqCategory {
  /** Stable, untranslated key (e.g. "product") — used for DOM ids and the
   *  <details name="…"> grouping attribute, never rendered as text. */
  id: string;
  title: string;
  items: FaqItem[];
}

export interface Dictionary {
  nav: {
    openApp: string;
  };
  hero: {
    kicker: string;
    headline1: string;
    headline2: string;
    bodyIntro: string;
    bodyBold1: string;
    bodyMid: string;
    bodyBold2: string;
    bodySuffix: string;
    bodyReclaim: string;
    cta: string;
    subCta?: string;
  };
  blog: {
    kicker: string;
    title: string;
    subtitle: string;
    feedLabel: string;
    feedHint: string;
    seeAll: string;
  };
  sources: {
    kicker: string;
    title: string;
    subtitle: string;
    seeAll: string;
    add: string;
    footer: string;
  };
  sourcesPage: {
    kicker: string;
    h1: string;
    introBody: string;
    statsSourcesLabel: string;
    statsCategoriesLabel: string;
    searchLabel: string;
    searchPlaceholder: string;
    allChipLabel: string;
    resultsLabel: string;
    selectAllLabel: string;
    emptyState: string;
    bulkCountLabel: string;
    bulkDeselect: string;
    bulkAddButton: string;
    closingKicker: string;
    closingHeadlinePre: string;
    closingHeadlineAccent: string;
    closingHeadlineSuffix: string;
    closingBody: string;
    closingCta: string;
  };
  faqPage: {
    kicker: string;
    h1: string;
    introBody: string;
    aiDisclaimer: string;
    categories: FaqCategory[];
  };
  closing: {
    kicker: string;
    headlinePre: string;
    headlineAccent: string;
    headlineSuffix: string;
    body: string;
    cta: string;
    secondaryCta: string;
  };
  // Button/status strings for the digest-item cards rendered inside
  // "MultivRSS Digest" blog posts — see DigestItem in src/lib/blog.ts and
  // src/components/marketing/DigestCard.tsx.
  digest: {
    saveLabel: string;
    savedLabel: string;
    addFeedLabel: string;
    alreadySubscribedLabel: string;
    saveErrorMessage: string;
    addFeedErrorMessage: string;
  };
  footer: {
    tagline: string;
  };
  meta: {
    home: {
      title: string;
      description: string;
    };
  };
}
