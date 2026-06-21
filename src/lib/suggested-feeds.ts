export type SuggestedFeed = {
    name: string;
    url: string;
    description: string;
    category: string;
};

export type SuggestedCategory = {
    name: string;
    feeds: SuggestedFeed[];
};

export const SUGGESTED_FEEDS: SuggestedFeed[] = [
  // TECH
  {
    name: "Hacker News",
    url: "https://news.ycombinator.com/rss",
    description: "Tech news and discussion from the Y Combinator community.",
    category: "TECH",
  },
  {
    name: "Simon Willison's Weblog",
    url: "https://simonwillison.net/atom/entries/",
    description: "Thoughts on Python, Datasette, LLMs, and web development.",
    category: "TECH",
  },
  {
    name: "NYT > Technology",
    url: "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml",
    description: "Technology coverage from The New York Times.",
    category: "TECH",
  },
  // NEWS
  {
    name: "The Guardian",
    url: "https://www.theguardian.com/world/rss",
    description: "World news from The Guardian.",
    category: "NEWS",
  },
  {
    name: "Repubblica.it",
    url: "https://www.repubblica.it/rss/homepage/rss2.0.xml",
    description: "Prima pagina de La Repubblica.",
    category: "NEWS",
  },
  {
    name: "Adnkronos - Ultimora",
    url: "https://www.adnkronos.com/rss/ultimora",
    description: "Ultime notizie dall'Adnkronos.",
    category: "NEWS",
  },
  // SPORT
  {
    name: "CBS Sports Headlines",
    url: "https://www.cbssports.com/rss/headlines/",
    description: "Top sports headlines from CBS Sports.",
    category: "SPORT",
  },
  {
    name: "MLB News",
    url: "https://www.mlb.com/feeds/news/rss.xml",
    description: "Major League Baseball news and updates.",
    category: "SPORT",
  },
  // DESIGN & CULTURE
  {
    name: "A List Apart",
    url: "https://alistapart.com/main/feed/",
    description: "For people who make websites — design, code, content.",
    category: "DESIGN",
  },
  {
    name: "The Verge",
    url: "https://www.theverge.com/rss/index.xml",
    description: "Technology, science, art, and culture news.",
    category: "CULTURE",
  },
  // SCIENCE
  {
    name: "Noema Magazine",
    url: "https://www.noemamag.com/?feed=noemarss",
    description: "Long-form essays on technology, philosophy, and society.",
    category: "SCIENCE",
  },
  // HUMOR
  {
    name: "SMBC Comics",
    url: "https://www.smbc-comics.com/comic/rss",
    description: "Saturday Morning Breakfast Cereal — nerdy, philosophical webcomics.",
    category: "HUMOR",
  },
  {
    name: "xkcd",
    url: "https://xkcd.com/atom.xml",
    description: "A webcomic of romance, sarcasm, math, and language.",
    category: "HUMOR",
  },
];

export function getSuggestedByCategory(): SuggestedCategory[] {
  const map = new Map<string, SuggestedFeed[]>();
  for (const feed of SUGGESTED_FEEDS) {
    if (!map.has(feed.category)) {
      map.set(feed.category, []);
    }
    map.get(feed.category)!.push(feed);
  }
  return Array.from(map.entries()).map(([name, feeds]) => ({
    name,
    feeds,
  }));
}