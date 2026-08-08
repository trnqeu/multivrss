import type { MetadataRoute } from "next";
import { SUPPORTED_LANGS } from "@/lib/i18n";
import { getAllPosts } from "@/lib/blog";

const BASE_URL = "https://multivrss.com";

// `langs` defaults to every supported language. Override it for a path that
// has no real translation (e.g. `/tips`, see its page.tsx) so the sitemap
// doesn't declare an hreflang alternate for a language version that isn't
// actually distinct — that page's own canonical points at a single URL.
const STATIC_PATHS: Array<{ path: string; priority: number; langs?: readonly string[] }> = [
  { path: "", priority: 1 },
  { path: "/guide", priority: 0.8 },
  { path: "/sources", priority: 0.8 },
  { path: "/tips", priority: 0.7, langs: ["en"] },
  { path: "/faq", priority: 0.7 },
  { path: "/changelog", priority: 0.5 },
  { path: "/blog", priority: 0.7 },
  { path: "/privacy", priority: 0.3 },
  { path: "/cookies", priority: 0.3 },
];

function localizedUrl(lang: string, path: string): string {
  return `${BASE_URL}/${lang}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map(({ path, priority, langs = SUPPORTED_LANGS }) => ({
    url: localizedUrl(SUPPORTED_LANGS[0], path),
    priority,
    alternates: {
      languages: Object.fromEntries(langs.map((lang) => [lang, localizedUrl(lang, path)])),
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
