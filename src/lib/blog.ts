import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";
import type { Lang } from "@/lib/i18n";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

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
