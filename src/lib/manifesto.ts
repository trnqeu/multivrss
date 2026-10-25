import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { Lang } from "@/lib/i18n";

const MANIFESTO_DIR = path.join(process.cwd(), "content/manifesto");

export interface ManifestoDoc {
  title: string;
  updated: string;
  content: string;
}

export function getManifesto(lang: Lang): ManifestoDoc | null {
  const filePath = path.join(MANIFESTO_DIR, `${lang}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  const updated =
    data.updated instanceof Date
      ? data.updated.toISOString().slice(0, 10)
      : String(data.updated);

  return { title: data.title as string, updated, content };
}
