import PageHeader from "@/components/PageHeader";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCategories } from "@/app/actions";
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import SavedList from './SavedList';

interface SavedPageProps {
  params: Promise<{ username: string }>;
}

export default async function SavedPage({ params }: SavedPageProps) {
    const resolvedParams = await params;
    const { username } = resolvedParams;
    const session = await getServerSession(authOptions);
    if (!session) return notFound();
    if (session.user.username !== username) {
        notFound();
    }

    const categories = await getCategories();

    const [savedFeedItems, savedLinks] = await Promise.all([
        prisma.feedItem.findMany({
            where: {
                savedAt: { not: null },
                source: { category: { userId: session.user.id } }
            },
            include: { source: { select: { title: true } } },
            orderBy: { savedAt: 'desc' }
        }),
        prisma.savedLink.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' }
        })
    ]);

    const feedItems = savedFeedItems.map(item => ({
        id: item.id,
        title: item.title,
        link: item.link,
        content: item.content,
        savedAt: item.savedAt!,
        sourceTitle: item.source.title,
    }));

    const externalLinks = savedLinks.map(link => ({
        id: link.id,
        title: link.title,
        link: link.url,
        content: link.description,
        savedAt: link.createdAt,
        sourceTitle: null,
        isExternal: true as const,
    }));

    const combined = [
        ...feedItems.map(i => ({ ...i, type: 'feed' as const })),
        ...externalLinks,
    ].sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime());

    return (
        <>
            <PageHeader categories={categories} username={session.user.username} email={session.user.email} />
            <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden relative scroll-smooth bg-background">
                <header className="p-8 md:p-12 border-b-2 border-foreground bg-background sticky top-0 z-10 flex flex-col gap-4">
                    <Link
                        href={`/u/${username}`}
                        className="label-system text-[10px] hover:bg-foreground hover:text-background w-fit px-1 transition-all border border-foreground font-bold"
                    >
                        ← BACK_TO_ALL
                    </Link>
                    <h1 className="tracking-[0.2em] text-terracotta font-bold">
                        SAVED // {combined.length} ITEMS
                    </h1>
                </header>
                <SavedList items={combined} />
            </main>
        </>
    );
}
