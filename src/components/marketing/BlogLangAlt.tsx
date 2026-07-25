"use client";

import { useSetLangAlt } from "@/components/marketing/LangAltContext";

export default function BlogLangAlt({ href }: { href: string | null }) {
  useSetLangAlt(href);
  return null;
}
