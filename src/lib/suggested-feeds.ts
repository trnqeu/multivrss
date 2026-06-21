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
  {
    name: "MIT News",
    url: "https://news.mit.edu/rss/feed",
    description: "Research news and breakthroughs from MIT.",
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
  {
    name: "Reuters",
    url: "https://news.google.com/rss/search?q=site:reuters.com&hl=en-US&gl=US&ceid=US:en",
    description: "Reuters world news via Google News.",
    category: "NEWS",
  },
  {
    name: "BBC News",
    url: "https://feeds.bbci.co.uk/news/rss.xml",
    description: "Top stories from BBC News.",
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
  {
    name: "The Guardian — Books",
    url: "https://www.theguardian.com/books/rss",
    description: "Book reviews, author interviews, and literary news from The Guardian.",
    category: "CULTURE",
  },
  // SCIENCE
  {
    name: "Noema Magazine",
    url: "https://www.noemamag.com/?feed=noemarss",
    description: "Long-form essays on technology, philosophy, and society.",
    category: "SCIENCE",
  },
  // PODCAST
  {
    name: "Lex Fridman Podcast",
    url: "https://lexfridman.com/feed/podcast/",
    description: "Long-form conversations on AI, science, and the human experience.",
    category: "PODCAST",
  },
  {
    name: "The Tim Ferriss Show",
    url: "https://rss.art19.com/tim-ferriss-show",
    description: "Interviews with world-class performers across business, sports, and the arts.",
    category: "PODCAST",
  },
  {
    name: "Making Sense with Sam Harris",
    url: "https://rss.samharris.org/feed/",
    description: "Philosophy, neuroscience, politics, and the nature of consciousness.",
    category: "PODCAST",
  },
  {
    name: "The Ezra Klein Show",
    url: "https://feeds.simplecast.com/82FI35Px",
    description: "NYT journalist Ezra Klein on politics, ideas, and how to think about big questions.",
    category: "PODCAST",
  },
  {
    name: "Dwarkesh Podcast",
    url: "https://www.dwarkesh.com/feed",
    description: "Long-form interviews with leading figures in tech, science, and history.",
    category: "PODCAST",
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

export type StarterPack = {
  id: string;
  name: string;
  cats: string;
  feeds: Array<{ name: string; url: string; category: string }>;
};

export const STARTER_PACKS: StarterPack[] = [
  {
    id: 'essentials',
    name: 'The Essentials',
    cats: 'Tech · News · Culture',
    feeds: [
      { name: 'Hacker News',    url: 'https://news.ycombinator.com/rss',       category: 'TECH'    },
      { name: 'The Guardian',   url: 'https://www.theguardian.com/world/rss',   category: 'NEWS'    },
      { name: 'The Verge',      url: 'https://www.theverge.com/rss/index.xml',  category: 'CULTURE' },
      { name: 'BBC News',       url: 'https://feeds.bbci.co.uk/news/rss.xml',   category: 'NEWS'    },
      { name: 'Noema Magazine', url: 'https://www.noemamag.com/?feed=noemarss', category: 'SCIENCE' },
      { name: 'xkcd',          url: 'https://xkcd.com/atom.xml',               category: 'HUMOR'   },
    ],
  },
  {
    id: 'tech',
    name: 'Tech Daily',
    cats: 'Tech',
    feeds: [
      { name: "Simon Willison's Weblog", url: 'https://simonwillison.net/atom/entries/',    category: 'TECH' },
      { name: 'Hacker News',            url: 'https://news.ycombinator.com/rss',            category: 'TECH' },
      { name: 'MIT News',               url: 'https://news.mit.edu/rss/feed',               category: 'TECH' },
      { name: 'The Verge',              url: 'https://www.theverge.com/rss/index.xml',      category: 'TECH' },
    ],
  },
  {
    id: 'news',
    name: 'News Desk',
    cats: 'News',
    feeds: [
      { name: 'Reuters',       url: 'https://news.google.com/rss/search?q=site:reuters.com&hl=en-US&gl=US&ceid=US:en', category: 'NEWS' },
      { name: 'BBC News',      url: 'https://feeds.bbci.co.uk/news/rss.xml',                                           category: 'NEWS' },
      { name: 'The Guardian',  url: 'https://www.theguardian.com/world/rss',                                           category: 'NEWS' },
      { name: 'Repubblica.it', url: 'https://www.repubblica.it/rss/homepage/rss2.0.xml',                               category: 'NEWS' },
      { name: 'Adnkronos',     url: 'https://www.adnkronos.com/rss/ultimora',                                          category: 'NEWS' },
    ],
  },
  {
    id: 'culture',
    name: 'Culture & Ideas',
    cats: 'Culture · Podcast',
    feeds: [
      { name: 'Noema Magazine',      url: 'https://www.noemamag.com/?feed=noemarss',   category: 'SCIENCE' },
      { name: 'The Ezra Klein Show', url: 'https://feeds.simplecast.com/82FI35Px',     category: 'PODCAST' },
      { name: 'Guardian — Books',    url: 'https://www.theguardian.com/books/rss',     category: 'CULTURE' },
      { name: 'Lex Fridman Podcast', url: 'https://lexfridman.com/feed/podcast/',      category: 'PODCAST' },
    ],
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