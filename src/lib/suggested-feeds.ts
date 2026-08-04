export type SuggestedFeed = {
    name: string;
    url: string;
    domain: string;
    description: string;
    category: string;
};

export type SuggestedCategory = {
    name: string;
    feeds: SuggestedFeed[];
};

export const SUGGESTED_FEEDS: SuggestedFeed[] = [
  // CULTURE
  {
    name: "The Guardian: Books",
    url: "https://www.theguardian.com/books/rss",
    domain: "theguardian.com",
    description: "Book reviews, author interviews, and literary news from The Guardian.",
    category: "CULTURE",
  },
  {
    name: "The Conversation (English)",
    url: "https://theconversation.com/articles.atom?language=en",
    domain: "theconversation.com",
    description: "Academic experts explain the news in plain language.",
    category: "CULTURE",
  },
  {
    name: "Luciano Floridi",
    url: "https://mastodon.world/@lucianofloridi.rss",
    domain: "mastodon.world",
    description: "Mastodon posts from philosopher Luciano Floridi on AI, ethics, and technology.",
    category: "CULTURE",
  },
  {
    name: "NPR Topics: Movies",
    url: "https://feeds.npr.org/1045/rss.xml",
    domain: "npr.org",
    description: "Film reviews and movie news from NPR.",
    category: "CULTURE",
  },
  {
    name: "The Verge",
    url: "https://www.theverge.com/rss/index.xml",
    domain: "theverge.com",
    description: "Technology, science, art, and culture news.",
    category: "CULTURE",
  },
  {
    name: "Wikipedia: On This Day",
    url: "https://en.wikipedia.org/w/api.php?action=featuredfeed&feed=onthisday&feedformat=atom",
    domain: "en.wikipedia.org",
    description: "Historical events and anniversaries featured by Wikipedia each day.",
    category: "CULTURE",
  },
  {
    name: "Wikipedia: Picture of the Day",
    url: "https://en.wikipedia.org/w/api.php?action=featuredfeed&feed=potd&feedformat=atom",
    domain: "en.wikipedia.org",
    description: "Wikipedia's daily featured photograph, curated by editors.",
    category: "CULTURE",
  },
  {
    name: "NPR Culture",
    url: "https://feeds.npr.org/1008/rss.xml",
    domain: "npr.org",
    description: "Arts, culture, and entertainment news from NPR.",
    category: "CULTURE",
  },
  {
    name: "NPR Book Reviews",
    url: "https://feeds.npr.org/1034/rss.xml",
    domain: "npr.org",
    description: "Book reviews from NPR.",
    category: "CULTURE",
  },
  {
    name: "Longreads",
    url: "https://longreads.com/feed/",
    domain: "longreads.com",
    description: "Curated long-form journalism, essays, and storytelling from around the web.",
    category: "CULTURE",
  },
  {
    name: "NYT: Arts",
    url: "https://rss.nytimes.com/services/xml/rss/nyt/Arts.xml",
    domain: "nytimes.com",
    description: "Arts and culture coverage from The New York Times.",
    category: "CULTURE",
  },
  {
    name: "NYT: Style",
    url: "https://rss.nytimes.com/services/xml/rss/nyt/FashionandStyle.xml",
    domain: "nytimes.com",
    description: "Fashion, style, and lifestyle coverage from The New York Times.",
    category: "CULTURE",
  },
  // DESIGN
  {
    name: "Michele De Lucchi's Substack",
    url: "https://micheledelucchi.substack.com/feed",
    domain: "micheledelucchi.substack.com",
    description: "Notes and reflections from designer Michele De Lucchi.",
    category: "DESIGN",
  },
  {
    name: "A List Apart",
    url: "https://alistapart.com/main/feed/",
    domain: "alistapart.com",
    description: "For people who make websites: design, code, content.",
    category: "DESIGN",
  },
  {
    name: "The Architects' Journal",
    url: "https://www.architectsjournal.co.uk/feed",
    domain: "architectsjournal.co.uk",
    description: "Architecture news, criticism, and awards coverage from The Architects' Journal.",
    category: "DESIGN",
  },
  {
    name: "Architectural Digest",
    url: "https://www.architecturaldigest.com/feed/rss",
    domain: "architecturaldigest.com",
    description: "Interior design, architecture, and celebrity homes from Architectural Digest.",
    category: "DESIGN",
  },
  {
    name: "Architectural Record",
    url: "https://www.architecturalrecord.com/rss/articles",
    domain: "architecturalrecord.com",
    description: "Architecture news, projects, and industry analysis from Architectural Record.",
    category: "DESIGN",
  },
  // HUMOR
  {
    name: "NPR Topics: Humor & Fun",
    url: "https://feeds.npr.org/1052/rss.xml",
    domain: "npr.org",
    description: "Humor, wit, and lighthearted stories from NPR.",
    category: "HUMOR",
  },
  {
    name: "xkcd",
    url: "https://xkcd.com/atom.xml",
    domain: "xkcd.com",
    description: "A webcomic of romance, sarcasm, math, and language.",
    category: "HUMOR",
  },
  {
    name: "SMBC Comics",
    url: "https://www.smbc-comics.com/comic/rss",
    domain: "smbc-comics.com",
    description: "Saturday Morning Breakfast Cereal: nerdy, philosophical webcomics.",
    category: "HUMOR",
  },
  // MUSIC
  {
    name: "The Guardian: Music",
    url: "https://www.theguardian.com/music/rss",
    domain: "theguardian.com",
    description: "Music news, reviews, and features from The Guardian.",
    category: "MUSIC",
  },
  {
    name: "Pitchfork: Album Reviews",
    url: "https://pitchfork.com/feed/feed-album-reviews/rss",
    domain: "pitchfork.com",
    description: "Album reviews from Pitchfork, the leading indie music publication.",
    category: "MUSIC",
  },
  {
    name: "The FADER",
    url: "https://www.thefader.com/feed.rss",
    domain: "thefader.com",
    description: "Music, culture, and style: tastemaker coverage of emerging artists.",
    category: "MUSIC",
  },
  {
    name: "The Line of Best Fit",
    url: "https://bestfitmusic.substack.com/feed",
    domain: "bestfitmusic.substack.com",
    description: "Indie music discovery: new releases, reviews, and artist spotlights.",
    category: "MUSIC",
  },
  {
    name: "The Quietus",
    url: "https://thequietus.com/feed/",
    domain: "thequietus.com",
    description: "Independent music and culture criticism: reviews, features, and interviews.",
    category: "MUSIC",
  },
  {
    name: "AllMusic",
    url: "http://feeds.feedburner.com/allmusicarticles",
    domain: "allmusic.com",
    description: "New releases, reviews, and music news from AllMusic.",
    category: "MUSIC",
  },
  {
    name: "AllMusic: Staff Picks",
    url: "http://feeds.feedburner.com/allmusicstaffpicks",
    domain: "allmusic.com",
    description: "Editorial staff picks and featured albums from AllMusic.",
    category: "MUSIC",
  },
  {
    name: "Alternative Press",
    url: "https://www.altpress.com/feed/",
    domain: "altpress.com",
    description: "News, interviews, and reviews from the alternative and rock music scene.",
    category: "MUSIC",
  },
  // NEWS
  {
    name: "404 Media",
    url: "https://www.404media.co/rss/",
    domain: "404media.co",
    description: "Independent tech journalism on hardware, online culture, and surveillance.",
    category: "NEWS",
  },
  {
    name: "BBC News",
    url: "https://www.bbci.co.uk/news/rss.xml",
    domain: "bbc.co.uk",
    description: "Top stories from BBC News.",
    category: "NEWS",
  },
  {
    name: "Kagi News: World",
    url: "https://news.kagi.com/world.rss",
    domain: "news.kagi.com",
    description: "World news curated by Kagi Search.",
    category: "NEWS",
  },
  {
    name: "NPR Topics: News",
    url: "https://feeds.npr.org/1001/rss.xml",
    domain: "npr.org",
    description: "Top news stories from NPR.",
    category: "NEWS",
  },
  {
    name: "NPR: World Story of the Day",
    url: "https://feeds.npr.org/1056/rss.xml",
    domain: "npr.org",
    description: "NPR's daily featured world news story.",
    category: "NEWS",
  },
  {
    name: "Repubblica.it",
    url: "https://www.repubblica.it/rss/homepage/rss2.0.xml",
    domain: "repubblica.it",
    description: "Prima pagina de La Repubblica.",
    category: "NEWS",
  },
  {
    name: "Wikipedia: Current Events",
    url: "https://www.to-rss.xyz/wikipedia/current_events/",
    domain: "en.wikipedia.org",
    description: "Wikipedia's daily current events portal as an RSS feed.",
    category: "NEWS",
  },
  {
    name: "The Guardian: World News",
    url: "https://www.theguardian.com/world/rss",
    domain: "theguardian.com",
    description: "World news from The Guardian.",
    category: "NEWS",
  },
  {
    name: "Adnkronos: Ultimora",
    url: "https://www.adnkronos.com/rss/ultimora",
    domain: "adnkronos.com",
    description: "Ultime notizie dall'Adnkronos.",
    category: "NEWS",
  },
  {
    name: "Reuters",
    url: "https://news.google.com/rss/search?q=site:reuters.com&hl=en-US&gl=US&ceid=US:en",
    domain: "reuters.com",
    description: "Reuters world news via Google News.",
    category: "NEWS",
  },
  {
    name: "NYT: World",
    url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
    domain: "nytimes.com",
    description: "International news coverage from The New York Times.",
    category: "NEWS",
  },
  {
    name: "NYT: U.S.",
    url: "https://rss.nytimes.com/services/xml/rss/nyt/US.xml",
    domain: "nytimes.com",
    description: "U.S. national news from The New York Times.",
    category: "NEWS",
  },
  {
    name: "NYT: Europe",
    url: "https://rss.nytimes.com/services/xml/rss/nyt/Europe.xml",
    domain: "nytimes.com",
    description: "European news coverage from The New York Times.",
    category: "NEWS",
  },
  {
    name: "NYT: Thomas L. Friedman",
    url: "https://www.nytimes.com/svc/collections/v1/publish/www.nytimes.com/column/thomas-l-friedman/rss.xml",
    domain: "nytimes.com",
    description: "Opinion columns from NYT's Thomas L. Friedman on foreign affairs and globalization.",
    category: "NEWS",
  },
  {
    name: "NYT: Business",
    url: "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml",
    domain: "nytimes.com",
    description: "Business and economic news from The New York Times.",
    category: "NEWS",
  },
  // PODCAST
  {
    name: "Dwarkesh Podcast",
    url: "https://www.dwarkesh.com/feed/podcast/",
    domain: "dwarkesh.com",
    description: "Long-form interviews with leading figures in tech, science, and history.",
    category: "PODCAST",
  },
  {
    name: "Lex Fridman Podcast",
    url: "https://lexfridman.com/feed/podcast/",
    domain: "lexfridman.com",
    description: "Long-form conversations on AI, science, and the human experience.",
    category: "PODCAST",
  },
  {
    name: "The Ezra Klein Show",
    url: "https://feeds.simplecast.com/82Fl35Px",
    domain: "nytimes.com",
    description: "NYT journalist Ezra Klein on politics, ideas, and how to think about big questions.",
    category: "PODCAST",
  },
  {
    name: "The Tim Ferriss Show",
    url: "https://rss.art19.com/tim-ferriss-show",
    domain: "tim.blog",
    description: "Interviews with world-class performers across business, sports, and the arts.",
    category: "PODCAST",
  },
  {
    name: "Making Sense with Sam Harris",
    url: "https://rss.samharris.org/feed/",
    domain: "samharris.org",
    description: "Philosophy, neuroscience, politics, and the nature of consciousness.",
    category: "PODCAST",
  },
  // SCIENCE
  {
    name: "Noema Magazine",
    url: "https://www.noemamag.com/?feed=noemarss",
    domain: "noemamag.com",
    description: "Long-form essays on technology, philosophy, and society.",
    category: "SCIENCE",
  },
  {
    name: "NPR Science",
    url: "https://feeds.npr.org/1007/rss.xml",
    domain: "npr.org",
    description: "Science news and discoveries from NPR.",
    category: "SCIENCE",
  },
  {
    name: "Kagi News: Science",
    url: "https://news.kagi.com/science.rss",
    domain: "news.kagi.com",
    description: "Science news curated by Kagi Search.",
    category: "SCIENCE",
  },
  {
    name: "NYT: Science",
    url: "https://rss.nytimes.com/services/xml/rss/nyt/Science.xml",
    domain: "nytimes.com",
    description: "Science news and discoveries from The New York Times.",
    category: "SCIENCE",
  },
  {
    name: "NYT: Health",
    url: "https://rss.nytimes.com/services/xml/rss/nyt/Health.xml",
    domain: "nytimes.com",
    description: "Health and medical news from The New York Times.",
    category: "SCIENCE",
  },
  // SPORT
  {
    name: "Dynasty League Football",
    url: "https://dynastyleaguefootball.com/feed",
    domain: "dynastyleaguefootball.com",
    description: "Fantasy football strategy, rankings, and dynasty league analysis.",
    category: "SPORT",
  },
  {
    name: "MLB.com Blogs",
    url: "https://mlbcomblogs.mlblogs.com/feed",
    domain: "mlblogs.com",
    description: "MLB news and commentary via MLB Blogs Network.",
    category: "SPORT",
  },
  {
    name: "The Athletic",
    url: "https://www.nytimes.com/athletic/rss/news/",
    domain: "nytimes.com",
    description: "Sports journalism and analysis from The Athletic (NYT).",
    category: "SPORT",
  },
  {
    name: "Kagi News: Sports",
    url: "https://news.kagi.com/sports.rss",
    domain: "news.kagi.com",
    description: "Sports news curated by Kagi Search.",
    category: "SPORT",
  },
  {
    name: "CBS Sports Headlines",
    url: "https://www.cbssports.com/rss/headlines/",
    domain: "cbssports.com",
    description: "Top sports headlines from CBS Sports.",
    category: "SPORT",
  },
  {
    name: "MLB News",
    url: "https://www.mlb.com/feeds/news/rss.xml",
    domain: "mlb.com",
    description: "Major League Baseball news and updates.",
    category: "SPORT",
  },
  {
    name: "Yahoo Sports: MLB",
    url: "https://sports.yahoo.com/mlb/news/rss/",
    domain: "sports.yahoo.com",
    description: "Major League Baseball news from Yahoo Sports.",
    category: "SPORT",
  },
  {
    name: "Yahoo Sports: NFL",
    url: "https://sports.yahoo.com/nfl/news/rss/",
    domain: "sports.yahoo.com",
    description: "NFL news from Yahoo Sports.",
    category: "SPORT",
  },
  {
    name: "Yahoo Sports: Fantasy",
    url: "https://sports.yahoo.com/fantasy/news/rss/",
    domain: "sports.yahoo.com",
    description: "Fantasy sports news and advice from Yahoo Sports.",
    category: "SPORT",
  },
  {
    name: "Yahoo Sports: Soccer",
    url: "https://sports.yahoo.com/soccer/news/rss/",
    domain: "sports.yahoo.com",
    description: "Soccer news from Yahoo Sports.",
    category: "SPORT",
  },
  {
    name: "Yahoo Sports: Tennis",
    url: "https://sports.yahoo.com/tennis/news/rss/",
    domain: "sports.yahoo.com",
    description: "Tennis news from Yahoo Sports.",
    category: "SPORT",
  },
  {
    name: "Yahoo Sports: College Sports",
    url: "https://sports.yahoo.com/college-sports/news/rss/",
    domain: "sports.yahoo.com",
    description: "College sports news from Yahoo Sports.",
    category: "SPORT",
  },
  {
    name: "Yahoo Sports: NBA",
    url: "https://sports.yahoo.com/nba/news/rss/",
    domain: "sports.yahoo.com",
    description: "NBA news from Yahoo Sports.",
    category: "SPORT",
  },
  // TECH
  {
    name: "Hacker News",
    url: "https://news.ycombinator.com/rss",
    domain: "news.ycombinator.com",
    description: "Tech news and discussion from the Y Combinator community.",
    category: "TECH",
  },
  {
    name: "IEEE Spectrum",
    url: "https://spectrum.ieee.org/customfeeds/feed/all-topics",
    domain: "spectrum.ieee.org",
    description: "Engineering and technology news from IEEE Spectrum.",
    category: "TECH",
  },
  {
    name: "Kagi News: Technology",
    url: "https://news.kagi.com/tech.rss",
    domain: "news.kagi.com",
    description: "Tech news curated by Kagi Search.",
    category: "TECH",
  },
  {
    name: "MIT News",
    url: "https://news.mit.edu/rss/feed",
    domain: "news.mit.edu",
    description: "Research news and breakthroughs from MIT.",
    category: "TECH",
  },
  {
    name: "NPR Topics: Technology",
    url: "https://feeds.npr.org/1019/rss.xml",
    domain: "npr.org",
    description: "Technology news and analysis from NPR.",
    category: "TECH",
  },
  {
    name: "NYT: Technology",
    url: "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml",
    domain: "nytimes.com",
    description: "Technology coverage from The New York Times.",
    category: "TECH",
  },
  {
    name: "Simon Willison's Weblog",
    url: "https://simonwillison.net/atom/entries/",
    domain: "simonwillison.net",
    description: "Thoughts on Python, Datasette, LLMs, and web development.",
    category: "TECH",
  },
  {
    name: "The Next Web",
    url: "https://thenextweb.com/feed",
    domain: "thenextweb.com",
    description: "Technology news and analysis for the always-on generation.",
    category: "TECH",
  },
  {
    name: "MultivRSS Blog (EN)",
    url: "https://multivrss.com/blog/en.xml",
    domain: "multivrss.com",
    description: "Guides, product notes, and short manuals from MultivRSS.",
    category: "TECH",
  },
  {
    name: "MultivRSS Blog (IT)",
    url: "https://multivrss.com/blog/it.xml",
    domain: "multivrss.com",
    description: "Guide, note di prodotto e manuali brevi da MultivRSS.",
    category: "TECH",
  },
];

export type StarterPack = {
  id: string;
  name: string;
  feeds: Array<{ name: string; url: string; category: string }>;
};

export const STARTER_PACKS: StarterPack[] = [
  {
    id: 'essentials',
    name: 'The Essentials',
    feeds: [
      { name: 'Hacker News',    url: 'https://news.ycombinator.com/rss',       category: 'TECH'    },
      { name: 'The Guardian',   url: 'https://www.theguardian.com/world/rss',   category: 'NEWS'    },
      { name: 'The Verge',      url: 'https://www.theverge.com/rss/index.xml',  category: 'CULTURE' },
      { name: 'BBC News',       url: 'https://feeds.bbci.co.uk/news/rss.xml',   category: 'NEWS'    },
      { name: 'Noema Magazine', url: 'https://www.noemamag.com/?feed=noemarss', category: 'SCIENCE' },
      { name: 'xkcd',          url: 'https://xkcd.com/atom.xml',               category: 'HUMOR'   },
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
