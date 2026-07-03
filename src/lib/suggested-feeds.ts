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
    name: "NPR Technology",
    url: "https://feeds.npr.org/1019/rss.xml",
    description: "Technology news and analysis from NPR.",
    category: "TECH",
  },
  {
    name: "Kagi News — Tech",
    url: "https://news.kagi.com/tech.xml",
    description: "Tech news curated by Kagi Search.",
    category: "TECH",
  },
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
    name: "Wikipedia — Current Events",
    url: "https://www.to-rss.xyz/wikipedia/current_events/",
    description: "Wikipedia's daily current events portal as an RSS feed.",
    category: "NEWS",
  },
  {
    name: "NPR News",
    url: "https://feeds.npr.org/1001/rss.xml",
    description: "Top news stories from NPR.",
    category: "NEWS",
  },
  {
    name: "NPR — World Story of the Day",
    url: "https://feeds.npr.org/1056/rss.xml",
    description: "NPR's daily featured world news story.",
    category: "NEWS",
  },
  {
    name: "Kagi News — World",
    url: "https://news.kagi.com/world.xml",
    description: "World news curated by Kagi Search.",
    category: "NEWS",
  },
  {
    name: "The Conversation",
    url: "https://theconversation.com/articles.atom?language=en",
    description: "Academic experts explain the news in plain language.",
    category: "NEWS",
  },
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
    name: "Kagi News — Sports",
    url: "https://news.kagi.com/sports.xml",
    description: "Sports news curated by Kagi Search.",
    category: "SPORT",
  },
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
  {
    name: "Yahoo Sports — MLB",
    url: "https://sports.yahoo.com/mlb/news/rss/",
    description: "Major League Baseball news from Yahoo Sports.",
    category: "SPORT",
  },
  {
    name: "Yahoo Sports — NFL",
    url: "https://sports.yahoo.com/nfl/news/rss/",
    description: "NFL news from Yahoo Sports.",
    category: "SPORT",
  },
  {
    name: "Yahoo Sports — Fantasy",
    url: "https://sports.yahoo.com/fantasy/news/rss/",
    description: "Fantasy sports news and advice from Yahoo Sports.",
    category: "SPORT",
  },
  {
    name: "Yahoo Sports — Soccer",
    url: "https://sports.yahoo.com/soccer/news/rss/",
    description: "Soccer news from Yahoo Sports.",
    category: "SPORT",
  },
  {
    name: "Yahoo Sports — Tennis",
    url: "https://sports.yahoo.com/tennis/news/rss/",
    description: "Tennis news from Yahoo Sports.",
    category: "SPORT",
  },
  {
    name: "Yahoo Sports — College Sports",
    url: "https://sports.yahoo.com/college-sports/news/rss/",
    description: "College sports news from Yahoo Sports.",
    category: "SPORT",
  },
  {
    name: "Yahoo Sports — NBA",
    url: "https://sports.yahoo.com/nba/news/rss/",
    description: "NBA news from Yahoo Sports.",
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
    name: "NPR Culture",
    url: "https://feeds.npr.org/1008/rss.xml",
    description: "Arts, culture, and entertainment news from NPR.",
    category: "CULTURE",
  },
  {
    name: "NPR Book Reviews",
    url: "https://feeds.npr.org/1034/rss.xml",
    description: "Book reviews from NPR.",
    category: "CULTURE",
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
  {
    name: "Longreads",
    url: "https://longreads.com/feed/",
    description: "Curated long-form journalism, essays, and storytelling from around the web.",
    category: "CULTURE",
  },
  // SCIENCE
  {
    name: "NPR Science",
    url: "https://feeds.npr.org/1007/rss.xml",
    description: "Science news and discoveries from NPR.",
    category: "SCIENCE",
  },
  {
    name: "Kagi News — Science",
    url: "https://news.kagi.com/science.xml",
    description: "Science news curated by Kagi Search.",
    category: "SCIENCE",
  },
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
  // MUSIC
  {
    name: "The Quietus",
    url: "https://thequietus.com/feed/",
    description: "Independent music and culture criticism — reviews, features, and interviews.",
    category: "MUSIC",
  },
  {
    name: "Pitchfork — Album Reviews",
    url: "https://pitchfork.com/feed/feed-album-reviews/rss",
    description: "Album reviews from Pitchfork, the leading indie music publication.",
    category: "MUSIC",
  },
  {
    name: "The Guardian — Music",
    url: "https://www.theguardian.com/music/rss",
    description: "Music news, reviews, and features from The Guardian.",
    category: "MUSIC",
  },
  {
    name: "The Fader",
    url: "https://www.thefader.com/feed.rss",
    description: "Music, culture, and style — tastemaker coverage of emerging artists.",
    category: "MUSIC",
  },
  {
    name: "Best Fit Music",
    url: "https://bestfitmusic.substack.com/feed",
    description: "Indie music discovery — new releases, reviews, and artist spotlights.",
    category: "MUSIC",
  },
  // ARTS & CULTURE
  {
    name: "NPR Movies",
    url: "https://feeds.npr.org/1045/rss.xml",
    description: "Film reviews and movie news from NPR.",
    category: "ARTS & CULTURE",
  },
  {
    name: "Wikipedia — Photo of the Day",
    url: "https://en.wikipedia.org/w/api.php?action=featuredfeed&feed=potd&feedformat=atom",
    description: "Wikipedia's daily featured photograph, curated by editors.",
    category: "ARTS & CULTURE",
  },
  {
    name: "Wikipedia — On This Day",
    url: "https://en.wikipedia.org/w/api.php?action=featuredfeed&feed=onthisday&feedformat=atom",
    description: "Historical events and anniversaries featured by Wikipedia each day.",
    category: "ARTS & CULTURE",
  },
  // HUMOR
  {
    name: "NPR Humor & Fun",
    url: "https://feeds.npr.org/1052/rss.xml",
    description: "Humor, wit, and lighthearted stories from NPR.",
    category: "HUMOR",
  },
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