import type { MetadataRoute } from "next";
import { SUPPORTED_LANGS, type Lang } from "@/lib/i18n";
import { getAllPosts, getPostBySlug } from "@/lib/blog";

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

// Google's sitemap hreflang spec wants a separate <url> entry per language
// version, each listing the full alternate set (itself included). Listing a
// translation only as an <xhtml:link> on another entry leaves it discovered
// but never actually submitted.
export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.flatMap(({ path, priority, langs = SUPPORTED_LANGS }) => {
    const languages = Object.fromEntries(langs.map((lang) => [lang, localizedUrl(lang, path)]));
    return langs.map((lang) => ({
      url: localizedUrl(lang, path),
      priority,
      alternates: { languages },
    }));
  });

  // Mirrors the hreflang pair blog/[slug]/page.tsx emits: a post links to its
  // translation only when `translationSlug` resolves to a real post.
  const blogEntries: MetadataRoute.Sitemap = SUPPORTED_LANGS.flatMap((lang) => {
    const otherLang: Lang = lang === "it" ? "en" : "it";
    return getAllPosts(lang).map((post) => {
      const translatedPost = post.translationSlug
        ? getPostBySlug(post.translationSlug, otherLang)
        : null;
      return {
        url: localizedUrl(lang, `/blog/${post.slug}`),
        lastModified: new Date(post.date),
        priority: 0.6,
        alternates: {
          languages: {
            [lang]: localizedUrl(lang, `/blog/${post.slug}`),
            ...(translatedPost && {
              [otherLang]: localizedUrl(otherLang, `/blog/${translatedPost.slug}`),
            }),
          },
        },
      };
    });
  });

  return [...staticEntries, ...blogEntries];
}
