import { NextResponse } from "next/server";
import { getAllPosts } from "@/lib/blog";
import type { Lang } from "@/lib/i18n";

const LANG_BY_FILE: Record<string, Lang> = {
  "en.xml": "en",
  "it.xml": "it",
};

const FEED_META: Record<Lang, { title: string; description: string }> = {
  en: {
    title: "MultivRSS — Blog",
    description: "Guides, product notes, and short manuals from MultivRSS.",
  },
  it: {
    title: "MultivRSS — Diario",
    description: "Guide, note di prodotto e manuali brevi da MultivRSS.",
  },
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  const lang = LANG_BY_FILE[file];

  if (!lang) {
    return new NextResponse("Not found", { status: 404 });
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3002";
  const posts = getAllPosts(lang);
  const meta = FEED_META[lang];

  const items = posts
    .map((post) => {
      const url = `${baseUrl}/${lang}/blog/${post.slug}`;
      const description = post.excerpt
        ? `\n      <description>${escapeXml(post.excerpt)}</description>`
        : "";

      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>${description}
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(meta.title)}</title>
    <link>${baseUrl}/${lang}/blog</link>
    <description>${escapeXml(meta.description)}</description>
    <language>${lang}</language>${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
