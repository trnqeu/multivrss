import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import { getDictionary, isValidLang } from "@/lib/i18n";
import MarkBlogSeen from "@/components/marketing/MarkBlogSeen";

interface Props {
  params: Promise<{ lang: string }>;
}

export async function generateStaticParams() {
  return [{ lang: "en" }, { lang: "it" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isValidLang(lang)) return {};
  const dict = getDictionary(lang);
  return {
    title: `${dict.blog.title} · MultivRSS`,
    description: dict.blog.subtitle,
    alternates: {
      canonical: `/${lang}/blog`,
      languages: {
        en: "/en/blog",
        it: "/it/blog",
      },
    },
  };
}

export default async function BlogIndexPage({ params }: Props) {
  const { lang } = await params;
  if (!isValidLang(lang)) notFound();

  const dict = getDictionary(lang);
  const t = dict.blog;
  const posts = getAllPosts(lang);

  return (
    <>
      <MarkBlogSeen latestPostDate={posts[0]?.date} />
      <header>
        <div className="bg-foreground text-background px-[34px] pt-[80px] pb-10 max-[920px]:px-[22px] max-[920px]:pt-14 max-[920px]:pb-8">
          <div className="max-w-[1200px] mx-auto">
            <p className="font-mono text-[10.5px] font-bold tracking-[0.18em] text-terracotta uppercase mb-[22px]">
              {"//"} {t.kicker}
            </p>
            <h1 className="normal-case font-black text-[clamp(48px,6vw,104px)] leading-[0.95] tracking-[-0.035em]">
              {t.title}
            </h1>
          </div>
        </div>
        <div className="px-[34px] pt-[26px] pb-[46px] max-[920px]:px-[22px] max-[920px]:pt-[18px] max-[920px]:pb-9">
          <div className="max-w-[1200px] mx-auto">
            <p className="text-[17px] leading-[1.6] text-black/55 m-0 max-w-[560px]">
              {t.subtitle}
            </p>
          </div>
        </div>
      </header>

      <section className="px-[34px] pb-24 max-[920px]:px-[22px]">
        <div className="max-w-[1200px] mx-auto border-t-2 border-black">
          {posts.length === 0 ? (
            <p role="status" className="py-16 text-black/55">
              {lang === "it" ? "Nessun post ancora." : "No posts yet."}
            </p>
          ) : (
            <ul className="list-none m-0 p-0">
              {posts.map((post) => (
                <li key={post.slug} className="border-b border-black/7 py-[26px]">
                  <span className="font-mono text-[10px] font-extrabold tracking-[0.16em] uppercase text-terracotta">
                    {post.category}
                  </span>
                  <Link href={`/${lang}/blog/${post.slug}`}>
                    <h2 className="normal-case text-[26px] font-extrabold tracking-[-0.02em] leading-[1.15] mt-3 mb-2 hover:text-terracotta transition-colors cursor-pointer">
                      {post.title}
                    </h2>
                  </Link>
                  {post.excerpt && (
                    <p className="text-[15.5px] leading-[1.6] text-black/55 m-0 max-w-[65ch]">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-3 font-mono text-[10px] font-semibold tracking-[0.1em] text-black/30 uppercase mt-3">
                    <span>{post.date}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
