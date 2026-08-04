import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getReaderArticle } from '@/app/actions/feed-items';
import { getHost, slugify } from '@/lib/utils';
import { ReaderContent } from './ReaderContent';

interface Props {
    params: Promise<{ username: string; itemId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const session = await getServerSession(authOptions);
    if (!session) return {};
    const { itemId } = await params;
    // A separate, cheap lookup — not getReaderArticle. Setting <title> should
    // never trigger a full extraction or spend the user's rate-limit budget.
    const item = await prisma.feedItem.findFirst({
        where: { id: itemId, source: { category: { userId: session.user.id } } },
        select: { title: true },
    });
    if (!item) return {};
    return { title: `${item.title} · MultivRSS` };
}

export default async function ReadPage({ params }: Props) {
    const { username, itemId } = await params;
    const data = await getReaderArticle(itemId);

    if (data.status === 'not-found') notFound();

    const { item } = data;

    return (
        <main className="flex-1 min-h-0 overflow-y-auto relative scroll-smooth bg-background">
            <header className="p-6 md:p-10 border-b-2 border-foreground bg-background sticky top-0 z-10">
                <Link
                    href={`/u/${username}`}
                    className="label-system text-[10px] hover:bg-foreground hover:text-background w-fit px-1 transition-all border border-foreground font-bold inline-block"
                >
                    ← BACK_TO_FEED
                </Link>
            </header>

            <article className="px-6 md:px-12 py-10 max-w-[720px] mx-auto">
                {data.status === 'rate-limited' && (
                    <p role="alert" className="font-mono text-[11px] uppercase tracking-widest text-terracotta">
                        Too many read requests — try again in a minute.{' '}
                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="underline">
                            Open the original article ↗
                        </a>
                    </p>
                )}

                {data.status === 'ready' && !data.result.ok && (
                    <div role="alert">
                        <h1 className="font-serif font-bold text-2xl mb-4">{item.title}</h1>
                        <p className="text-foreground/60 mb-4">
                            We couldn&apos;t load a clean reading view for this article.
                        </p>
                        <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block px-4 py-2 border border-foreground font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
                        >
                            Open original article ↗
                        </a>
                    </div>
                )}

                {data.status === 'ready' && data.result.ok && (
                    <>
                        <h1 className="font-serif font-bold text-3xl mb-2">{data.result.article.title ?? item.title}</h1>
                        {data.result.article.byline && (
                            <p className="text-foreground/50 text-sm mb-1">{data.result.article.byline}</p>
                        )}
                        <p className="mb-8">
                            <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-terracotta underline text-sm">
                                View original on {getHost(item.link)} ↗
                            </a>
                        </p>
                        <ReaderContent
                            contentHtml={data.result.article.contentHtml}
                            markdown={data.result.article.markdown}
                            filenameBase={slugify(data.result.article.title ?? item.title)}
                        />
                    </>
                )}
            </article>
        </main>
    );
}
