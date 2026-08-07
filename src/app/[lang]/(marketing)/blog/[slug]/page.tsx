import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts, getPostBySlug, renderMarkdown } from "@/lib/blog";
import { isValidLang, type Lang } from "@/lib/i18n";
import BlogLangAlt from "@/components/marketing/BlogLangAlt";
import MarkBlogSeen from "@/components/marketing/MarkBlogSeen";

interface Props {
  params: Promise<{ lang: string; slug: string }>;
}

export async function generateStaticParams() {
  const langs = ["en", "it"] as const;
  const params = langs.flatMap((lang) =>
    getAllPosts(lang).map((post) => ({ lang, slug: post.slug }))
  );
  // Cache Components requires at least one static param for a dynamic route.
  // When there are no published posts, fall back to a placeholder that
  // resolves to notFound() below.
  return params.length > 0 ? params : [{ lang: "en", slug: "__placeholder__" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isValidLang(lang)) return {};
  const post = getPostBySlug(slug, lang);
  if (!post) return {};

  const otherLang: Lang = lang === "it" ? "en" : "it";
  const translatedPost = post.translationSlug
    ? getPostBySlug(post.translationSlug, otherLang)
    : null;

  return {
    title: `${post.title} · MultivRSS`,
    description: post.excerpt,
    alternates: {
      canonical: `/${lang}/blog/${slug}`,
      languages: {
        [lang]: `/${lang}/blog/${slug}`,
        ...(translatedPost && {
          [otherLang]: `/${otherLang}/blog/${translatedPost.slug}`,
        }),
      },
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { lang, slug } = await params;
  if (!isValidLang(lang)) notFound();

  const post = getPostBySlug(slug, lang);
  if (!post) notFound();

  const html = renderMarkdown(post.content);

  const otherLang: Lang = lang === "it" ? "en" : "it";
  const translatedPost = post.translationSlug
    ? getPostBySlug(post.translationSlug, otherLang)
    : null;
  const langAltHref = translatedPost
    ? `/${otherLang}/blog/${translatedPost.slug}`
    : `/${otherLang}/blog`;

  return (
    <>
      <MarkBlogSeen latestPostDate={getAllPosts(lang)[0]?.date} />
      <BlogLangAlt href={langAltHref} />
      <div className="px-[34px] py-[88px] max-[920px]:px-[26px] max-[920px]:py-16">
        <div className="max-w-[680px] mx-auto">
          {/* Back link */}
          <Link
            href={`/${lang}/blog`}
            className="font-mono text-[10px] font-extrabold tracking-[0.16em] uppercase text-black/30 hover:text-terracotta transition-colors mb-10 inline-block"
          >
            ← JOURNAL
          </Link>

          {/* Header */}
          <header className="border-t-2 border-black pt-[22px] mb-12">
            <span className="font-mono text-[10px] font-extrabold tracking-[0.16em] uppercase text-terracotta">
              {post.category}
            </span>
            <h1 className="normal-case font-black text-[clamp(28px,4vw,52px)] tracking-[-0.025em] leading-[1.05] mt-4 mb-6">
              {post.title}
            </h1>
            <div className="flex items-center gap-3 font-mono text-[10px] font-semibold tracking-[0.1em] text-black/30 uppercase">
              {post.author && (
                <>
                  <span>{post.author}</span>
                  <span className="text-black/12">·</span>
                </>
              )}
              <span>{post.date}</span>
              {post.lang && (
                <>
                  <span className="text-black/12">·</span>
                  <span>{post.lang}</span>
                </>
              )}
            </div>
          </header>

          {/* Body */}
          <div
            className="prose"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </>
  );
}
