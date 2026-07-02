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
  readTime: string;
  lang?: string;
  featured?: boolean;
  excerpt?: string;
  content: string;
}

function parsePost(file: string, lang: Lang): BlogPost {
  const slug = file.replace(/\.md$/, "");
  const raw = fs.readFileSync(path.join(BLOG_DIR, lang, file), "utf-8");
  const { data, content } = matter(raw);

  return {
    slug,
    title: data.title as string,
    category: data.category as string,
    date: data.date as string,
    readTime: data.readTime as string,
    lang: data.lang as string | undefined,
    featured: data.featured as boolean | undefined,
    excerpt: data.excerpt as string | undefined,
    content,
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
