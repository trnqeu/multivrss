import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { Lang } from "@/lib/i18n";

const LEGAL_DIR = path.join(process.cwd(), "content/legal");

export interface LegalDoc {
  title: string;
  updated: string;
  content: string;
}

export function getLegalDoc(slug: string, lang: Lang): LegalDoc | null {
  const filePath = path.join(LEGAL_DIR, lang, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  const updated =
    data.updated instanceof Date
      ? data.updated.toISOString().slice(0, 10)
      : String(data.updated);

  return {
    title: data.title as string,
    updated,
    content,
  };
}
