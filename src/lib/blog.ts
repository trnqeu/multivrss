import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";
import type { Lang } from "@/lib/i18n";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

// A single link featured in a "MultivRSS Digest"-style post — see
// digestItems on BlogPost. Rendered by DigestCard
// (src/components/marketing/DigestCard.tsx) as a card with SAVE and
// (optionally) ADD FEED buttons, positioned inline in the post body via a
// `::digest[id]` marker — see renderPostSegments() below.
export interface DigestItem {
  // Referenced from the post body as ::digest[id]. Must be unique within a
  // post; enforced only where it matters (renderPostSegments throws on an
  // unresolved reference, not on a duplicate id — the second entry with a
  // repeated id would just never be reachable by a directive).
  id: string;
  title: string;
  url: string;
  sourceName: string;
  // Feed URL for the article's source. Omit when the source has no RSS
  // feed (e.g. a one-off page) — DigestCard then renders SAVE only.
  feedUrl?: string;
  // Category the feed is filed under if the reader adds it. Defaults to
  // "NEWS" in DigestCard when omitted.
  feedCategory?: string;
  // Plain text only — rendered as-is, never through renderMarkdown().
  blurb?: string;
}

// One chunk of a rendered post body: either a slice of prose (already run
// through renderMarkdown) or a digest card slotted in at that position.
export type PostSegment =
  | { type: "prose"; html: string }
  | { type: "digest"; item: DigestItem };

// Matches a `::digest[id]` marker that occupies its own line (whitespace
// around the id is not allowed — keep the source unambiguous).
const DIGEST_MARKER_RE = /^::digest\[([a-zA-Z0-9_-]+)\]$/m;

// Splits a digest post's body on `::digest[id]` markers, rendering the
// prose in between through the normal markdown pipeline and slotting in the
// matching DigestItem at each marker's position. Any digestItems entry
// never referenced by a marker is appended at the end, in frontmatter
// order — so a post with no markers at all still renders (backward
// compatible with the old "append everything" behavior).
//
// Throws if a marker references an id with no matching digestItems entry —
// deliberately loud (fails `next build`, since blog post pages are
// statically generated) rather than silently dropping the marker.
export function renderPostSegments(post: BlogPost): PostSegment[] {
  const items = post.digestItems ?? [];
  const byId = new Map(items.map((item) => [item.id, item]));
  const referenced = new Set<string>();

  const parts = post.content.split(DIGEST_MARKER_RE);
  const segments: PostSegment[] = [];

  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      const chunk = parts[i].trim();
      if (chunk) segments.push({ type: "prose", html: renderMarkdown(chunk) });
    } else {
      const id = parts[i];
      const item = byId.get(id);
      if (!item) {
        throw new Error(
          `Blog post "${post.slug}": ::digest[${id}] does not match any digestItems entry.`
        );
      }
      referenced.add(id);
      segments.push({ type: "digest", item });
    }
  }

  for (const item of items) {
    if (!referenced.has(item.id)) {
      segments.push({ type: "digest", item });
    }
  }

  return segments;
}

export interface BlogPost {
  slug: string;
  title: string;
  category: string;
  date: string;
  lang?: string;
  featured?: boolean;
  excerpt?: string;
  author?: string;
  content: string;
  translationSlug?: string;
  digestItems?: DigestItem[];
}

function parsePost(file: string, lang: Lang): BlogPost {
  const slug = file.replace(/\.md$/, "");
  const raw = fs.readFileSync(path.join(BLOG_DIR, lang, file), "utf-8");
  const { data, content } = matter(raw);

  const date =
    data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date);

  return {
    slug,
    title: data.title as string,
    category: data.category as string,
    date,
    lang: data.lang as string | undefined,
    featured: data.featured as boolean | undefined,
    excerpt: data.excerpt as string | undefined,
    author: data.author as string | undefined,
    content,
    translationSlug: data.translationSlug as string | undefined,
    digestItems: data.digestItems as DigestItem[] | undefined,
  };
}

export function getAllPosts(lang: Lang): BlogPost[] {
  const dir = path.join(BLOG_DIR, lang);
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));

  return files
    .map((file) => parsePost(file, lang))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string, lang: Lang): BlogPost | null {
  const filePath = path.join(BLOG_DIR, lang, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  return parsePost(`${slug}.md`, lang);
}

export function renderMarkdown(content: string): string {
  return marked.parse(content) as string;
}

export interface AuthorInfo {
  name: string;
  url: string;
  sameAs: string[];
}

// Known authors, keyed by the exact `author` string used in post frontmatter.
// Used to attach a real Person entity (site + social profiles) to blog posts
// for structured data and byline links, instead of a bare name string.
const AUTHORS: Record<string, AuthorInfo> = {
  "Stefano Trinchero": {
    name: "Stefano Trinchero",
    url: "https://trnq.eu",
    sameAs: [
      "https://github.com/trnqeu",
      "https://linkedin.com/in/stefano-trinchero-8569316/",
      "https://bsky.app/profile/trnqeu.bsky.social",
    ],
  },
};

export function getAuthorInfo(name?: string): AuthorInfo | undefined {
  return name ? AUTHORS[name] : undefined;
}

// Posts are filed as `YYYYMMDD_slug.md`; derive a canonical ISO date from the
// slug rather than parsing the human-readable `date` frontmatter field.
export function isoDateFromSlug(slug: string): string | undefined {
  const match = slug.match(/^(\d{4})(\d{2})(\d{2})_/);
  if (!match) return undefined;
  const [, y, m, d] = match;
  return `${y}-${m}-${d}`;
}
