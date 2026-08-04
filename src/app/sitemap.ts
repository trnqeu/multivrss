import type { MetadataRoute } from "next";
import { SUPPORTED_LANGS } from "@/lib/i18n";
import { getAllPosts } from "@/lib/blog";

const BASE_URL = "https://multivrss.com";

const STATIC_PATHS: Array<{ path: string; priority: number }> = [
  { path: "", priority: 1 },
  { path: "/guide", priority: 0.8 },
  { path: "/sources", priority: 0.8 },
  { path: "/tips", priority: 0.7 },
  { path: "/faq", priority: 0.7 },
  { path: "/blog", priority: 0.7 },
  { path: "/privacy", priority: 0.3 },
  { path: "/cookies", priority: 0.3 },
];

function localizedUrl(lang: string, path: string): string {
  return `${BASE_URL}/${lang}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map(({ path, priority }) => ({
    url: localizedUrl(SUPPORTED_LANGS[0], path),
    priority,
    alternates: {
      languages: Object.fromEntries(
        SUPPORTED_LANGS.map((lang) => [lang, localizedUrl(lang, path)])
      ),
    },
  }));

  const blogEntries: MetadataRoute.Sitemap = SUPPORTED_LANGS.flatMap((lang) =>
    getAllPosts(lang).map((post) => ({
      url: localizedUrl(lang, `/blog/${post.slug}`),
      lastModified: new Date(post.date),
      priority: 0.6,
    }))
  );

  return [...staticEntries, ...blogEntries];
}
