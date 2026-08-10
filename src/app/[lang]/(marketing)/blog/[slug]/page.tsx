import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts, getAuthorInfo, getPostBySlug, isoDateFromSlug, renderPostSegments, type PostSegment } from "@/lib/blog";
import { getDictionary, isValidLang, type Lang } from "@/lib/i18n";
import BlogLangAlt from "@/components/marketing/BlogLangAlt";
import MarkBlogSeen from "@/components/marketing/MarkBlogSeen";
import { DigestProvider, DigestCard } from "@/components/marketing/DigestCard";

const BASE_URL = "https://multivrss.com";

function renderSegments(segments: PostSegment[]) {
  return segments.map((segment, i) =>
    segment.type === "prose" ? (
      <div key={`prose-${i}`} dangerouslySetInnerHTML={{ __html: segment.html }} />
    ) : (
      <DigestCard key={segment.item.id} item={segment.item} />
    )
  );
}

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
  const authorInfo = getAuthorInfo(post.author);

  return {
    title: `${post.title} · MultivRSS`,
    description: post.excerpt,
    authors: authorInfo ? [{ name: authorInfo.name, url: authorInfo.url }] : undefined,
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

  // Throws on an unresolved ::digest[id] marker — deliberately loud, fails
  // `next build` for this statically-generated page rather than silently
  // dropping a broken reference. See renderPostSegments()'s header comment.
  const segments = renderPostSegments(post);
  const digest = getDictionary(lang).digest;

  const otherLang: Lang = lang === "it" ? "en" : "it";
  const translatedPost = post.translationSlug
    ? getPostBySlug(post.translationSlug, otherLang)
    : null;
  const langAltHref = translatedPost
    ? `/${otherLang}/blog/${translatedPost.slug}`
    : `/${otherLang}/blog`;

  const authorInfo = getAuthorInfo(post.author);
  const pageUrl = `${BASE_URL}/${lang}/blog/${slug}`;
  const datePublished = isoDateFromSlug(slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    url: pageUrl,
    mainEntityOfPage: pageUrl,
    inLanguage: lang,
    ...(datePublished && { datePublished }),
    ...(authorInfo && {
      author: {
        "@type": "Person",
        name: authorInfo.name,
        url: authorInfo.url,
        sameAs: authorInfo.sameAs,
      },
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
                  {authorInfo ? (
                    <a
                      href={authorInfo.url}
                      rel="author"
                      className="hover:text-terracotta transition-colors"
                    >
                      {post.author}
                    </a>
                  ) : (
                    <span>{post.author}</span>
                  )}
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

          {/* Body — for a regular post, renderPostSegments() returns a
              single prose segment (identical to the old renderMarkdown()
              blob); for a DIGEST post it's already split into prose chunks
              and DigestItem cards laid out in ::digest[id] marker order
              (see src/lib/blog.ts). Only DIGEST posts need the interactive
              SAVE/ADD FEED wiring, so DigestProvider wraps conditionally. */}
          {post.digestItems ? (
            <DigestProvider items={post.digestItems} strings={digest}>
              <div className="prose">{renderSegments(segments)}</div>
            </DigestProvider>
          ) : (
            <div className="prose">{renderSegments(segments)}</div>
          )}
        </div>
      </div>
    </>
  );
}
