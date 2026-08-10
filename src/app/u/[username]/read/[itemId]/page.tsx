import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getReaderArticle, type ReaderItemKind } from '@/app/actions/feed-items';
import { getTags } from '@/app/actions/tags';
import { getHost, slugify } from '@/lib/utils';
import { ReaderContent } from './ReaderContent';
import { ReaderActions } from './ReaderActions';
import SmartBackLink from '@/components/SmartBackLink';

interface Props {
    params: Promise<{ username: string; itemId: string }>;
    // `type=savedLink` on the URL distinguishes a manually-saved link (e.g. via
    // the mobile share target) from a feed-sourced FeedItem — see SavedView.tsx
    // and SearchBar.tsx, which append it when linking to this page.
    searchParams: Promise<{ type?: string }>;
}

function resolveKind(type: string | undefined): ReaderItemKind {
    return type === 'savedLink' ? 'savedLink' : 'feedItem';
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
    const session = await getServerSession(authOptions);
    if (!session) return {};
    const { itemId } = await params;
    const kind = resolveKind((await searchParams).type);
    // A separate, cheap lookup — not getReaderArticle. Setting <title> should
    // never trigger a full extraction or spend the user's rate-limit budget.
    if (kind === 'savedLink') {
        const link = await prisma.savedLink.findFirst({
            where: { id: itemId, userId: session.user.id },
            select: { title: true, url: true },
        });
        if (!link) return {};
        return { title: `${link.title ?? getHost(link.url)} · MultivRSS` };
    }
    const item = await prisma.feedItem.findFirst({
        where: { id: itemId, source: { category: { userId: session.user.id } } },
        select: { title: true },
    });
    if (!item) return {};
    return { title: `${item.title} · MultivRSS` };
}

export default async function ReadPage({ params, searchParams }: Props) {
    const { username, itemId } = await params;
    const kind = resolveKind((await searchParams).type);
    const [data, allTags] = await Promise.all([getReaderArticle(itemId, kind), getTags()]);

    if (data.status === 'not-found') notFound();

    const { item } = data;

    return (
        <main className="flex-1 min-h-0 overflow-y-auto relative scroll-smooth bg-background">
            <header className="p-6 md:p-10 border-b-2 border-foreground bg-background sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4">
                <SmartBackLink
                    fallbackHref={`/u/${username}`}
                    className="label-system text-[10px] hover:bg-foreground hover:text-background w-fit px-1 transition-all border border-foreground font-bold inline-block"
                >
                    ← BACK_TO_FEED
                </SmartBackLink>
                <ReaderActions
                    itemId={item.id}
                    itemKind={item.kind}
                    initialSaved={!!item.savedAt}
                    initialTags={item.tags}
                    allTags={allTags}
                />
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
