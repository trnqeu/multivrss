const YOUTUBE_HANDLE_RE = /^https?:\/\/(?:www\.)?youtube\.com\/@([\w-]+)/;
const YOUTUBE_CHANNEL_RE = /^https?:\/\/(?:www\.)?youtube\.com\/channel\/(UC[\w-]+)/;
const API_BASE = 'https://www.googleapis.com/youtube/v3';

export async function resolveYouTubeFeedUrl(rawUrl: string): Promise<string | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;

  const channelMatch = rawUrl.match(YOUTUBE_CHANNEL_RE);
  if (channelMatch) {
    return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelMatch[1]}`;
  }

  const handleMatch = rawUrl.match(YOUTUBE_HANDLE_RE);
  if (!handleMatch) return null;

  const url = `${API_BASE}/channels?part=id&forHandle=${handleMatch[1]}&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json() as { items?: { id: string }[] };
  if (!data.items?.length) return null;

  return `https://www.youtube.com/feeds/videos.xml?channel_id=${data.items[0].id}`;
}
