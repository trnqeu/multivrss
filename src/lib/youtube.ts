const YOUTUBE_HANDLE_RE = /^https?:\/\/(?:www\.)?youtube\.com\/@([\w-]+)/;
const YOUTUBE_CHANNEL_RE = /^https?:\/\/(?:www\.)?youtube\.com\/channel\/(UC[\w-]+)/;
const API_BASE = 'https://www.googleapis.com/youtube/v3';

export type YouTubeChannelInfo = {
  channelId: string;
  feedUrl: string;
  title?: string;
};

export async function resolveYouTubeChannel(rawUrl: string): Promise<YouTubeChannelInfo | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;

  let channelId: string | null = null;

  const channelMatch = rawUrl.match(YOUTUBE_CHANNEL_RE);
  if (channelMatch) {
    channelId = channelMatch[1];
  }

  if (!channelId) {
    const handleMatch = rawUrl.match(YOUTUBE_HANDLE_RE);
    if (!handleMatch) return null;

    const url = `${API_BASE}/channels?part=id,snippet&forHandle=${handleMatch[1]}&key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json() as { items?: { id: string; snippet?: { title: string } }[] };
    if (!data.items?.length) return null;

    channelId = data.items[0].id;
  }

  return {
    channelId,
    feedUrl: `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
  };
}

export async function resolveYouTubeFeedUrl(rawUrl: string): Promise<string | null> {
  const info = await resolveYouTubeChannel(rawUrl);
  return info?.feedUrl ?? null;
}

type YouTubeVideoItem = {
  title: string;
  link: string;
  guid: string;
  isoDate?: string;
  contentSnippet?: string;
};

export async function fetchYouTubeVideosAsFeed(channelId: string): Promise<{ title?: string; items: YouTubeVideoItem[] } | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;

  const url = `${API_BASE}/search?part=snippet&channelId=${channelId}&order=date&maxResults=50&type=video&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json() as {
    items?: {
      id: { videoId: string };
      snippet: {
        publishedAt: string;
        title: string;
        description: string;
        channelTitle: string;
      };
    }[];
  };

  if (!data.items?.length) return null;

  return {
    title: data.items[0].snippet.channelTitle,
    items: data.items.map((item) => ({
      title: item.snippet.title,
      link: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      guid: item.id.videoId,
      isoDate: item.snippet.publishedAt,
      contentSnippet: item.snippet.description,
    })),
  };
}
