import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import type { Dictionary, Lang } from "@/lib/i18n";

interface Props {
  lang: Lang;
  dict: Dictionary;
}

const META =
  "font-mono text-[10px] font-extrabold tracking-[0.12em] uppercase";

export default function MarketingBlog({ lang, dict }: Props) {
  const t = dict.blog;
  const posts = getAllPosts(lang);
  const featured = posts.find((p) => p.featured);
  const list = posts.filter((p) => !p.featured).slice(0, 3);

  return (
    <section
      id="blog"
      aria-labelledby="blog-title"
      className="px-[52px] pt-14 pb-16 border-t-4 border-[#0d0d0d] text-[#0d0d0d] max-[720px]:px-5 max-[720px]:pt-8 max-[720px]:pb-10"
    >
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <header className="flex justify-between items-end gap-6 pb-[22px] mb-7 border-b-2 border-[#0d0d0d] max-[720px]:block">
          <div>
            <span className="font-mono text-[14px] font-extrabold tracking-[0.12em] uppercase text-terracotta">
              {t.kicker}
            </span>
            <h2
              id="blog-title"
              className="normal-case font-black text-[60px] tracking-[-0.04em] leading-[0.98] mt-[10px] mb-0 max-[720px]:text-[38px]"
            >
              {t.title}
            </h2>
            <p className="text-[15px] text-[#6b6862] mt-[10px] mb-0 text-pretty">
              {t.subtitle}
            </p>
          </div>
          <Link
            href={`/${lang}/blog`}
            className="font-mono text-[11px] font-extrabold tracking-[0.12em] uppercase border-b-2 border-[#0d0d0d] pb-1 whitespace-nowrap hover:text-terracotta hover:border-terracotta max-[720px]:inline-block max-[720px]:mt-[18px]"
          >
            {t.seeAll}
          </Link>
        </header>

        {/* Posts grid */}
        <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-14 max-[720px]:grid-cols-1 max-[720px]:gap-0">
          {featured && (
            <article>
              <div className={`${META} text-terracotta`}>{featured.category}</div>
              <h3 className="normal-case text-[34px] font-extrabold tracking-[-0.025em] leading-[1.08] mt-3 mb-[14px] max-[720px]:text-[28px]">
                <Link
                  href={`/${lang}/blog/${featured.slug}`}
                  className="hover:text-terracotta"
                >
                  {featured.title}
                </Link>
              </h3>
              {featured.excerpt && (
                <p className="text-[16px] leading-[1.6] text-[#6b6862] mt-0 mb-[18px] max-w-[520px] text-pretty">
                  {featured.excerpt}
                </p>
              )}
              <div className={`${META} text-[#a9a59d]`}>
                {featured.date}
                {featured.lang && <> · {featured.lang}</>}
              </div>
            </article>
          )}

          <div className="max-[720px]:border-t-2 max-[720px]:border-[#0d0d0d] max-[720px]:pt-[22px] max-[720px]:mt-8">
            {list.map((post) => (
              <article
                key={post.slug}
                className="pb-5 mb-5 border-b border-[#e0dbd1] last:pb-0 last:mb-0 last:border-b-0"
              >
                <div className={`${META} text-terracotta`}>{post.category}</div>
                <h4 className="normal-case text-[19px] font-bold tracking-[-0.015em] leading-[1.2] my-2">
                  <Link
                    href={`/${lang}/blog/${post.slug}`}
                    className="hover:text-terracotta"
                  >
                    {post.title}
                  </Link>
                </h4>
                <div className={`${META} text-[#a9a59d]`}>{post.date}</div>
              </article>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 flex flex-wrap gap-4 items-center">
          <a
            href={`/blog/${lang}.xml`}
            className="inline-flex items-center gap-2 border-2 border-[#0d0d0d] px-[14px] py-[10px] font-mono text-[11px] font-extrabold tracking-[0.12em] uppercase hover:bg-[#0d0d0d] hover:text-paper"
          >
            <i
              aria-hidden="true"
              className="block w-2 h-2 rounded-full bg-terracotta"
            />
            {t.feedLabel}
          </a>
          <span className="font-mono text-[10px] font-medium tracking-[0.06em] text-[#a9a59d]">
            {t.feedHint}
          </span>
        </div>
      </div>
    </section>
  );
}
