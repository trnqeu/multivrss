export interface NavItem {
  label: string;
  slug: string;
  isAnchor?: boolean;
}

export interface FooterLink {
  label: string;
  href?: string;
  slug?: string;
  isAnchor?: boolean;
}

export interface Dictionary {
  nav: {
    items: NavItem[];
    signIn: string;
    getStarted: string;
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
  closing: {
    kicker: string;
    headlinePre: string;
    headlineAccent: string;
    headlineSuffix: string;
    body: string;
    cta: string;
    secondaryCta: string;
  };
  twoThings: {
    kicker: string;
    updatesLabel: string;
    updatesBody: string;
    bookmarksLabel: string;
    bookmarksBody: string;
  };
  footer: {
    tagline: string;
    productLabel: string;
    resourcesLabel: string;
    productLinks: FooterLink[];
    resourceLinks: FooterLink[];
  };
  meta: {
    home: {
      title: string;
      description: string;
    };
  };
}
