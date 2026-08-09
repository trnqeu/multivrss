import PageHeader from "@/components/PageHeader";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCategories } from "@/app/actions/categories";
import { prisma } from '@/lib/prisma';
import { fetchSavedItemsPage } from '@/lib/saved-items';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import SavedPageClient from './SavedPageClient';

interface SavedPageProps {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tag?: string; q?: string }>;
}

export default async function SavedPage({ params, searchParams }: SavedPageProps) {
    const resolvedParams = await params;
    const { username } = resolvedParams;
    const { tag, q } = await searchParams;
    const session = await getServerSession(authOptions);
    if (!session) return notFound();
    if (session.user.username !== username) {
        notFound();
    }

    const categories = await getCategories();

    const [itemsPage, allTags] = await Promise.all([
        fetchSavedItemsPage(session.user.id, { tag, q }),
        prisma.tag.findMany({
            where: { userId: session.user.id },
            orderBy: { name: 'asc' },
        }),
    ]);

    return (
        <>
            <PageHeader categories={categories} tags={allTags} username={session.user.username} email={session.user.email} />
            <Suspense fallback={null}>
                <SavedPageClient
                    key={`${tag ?? ''}:${q ?? ''}`}
                    username={session.user.username}
                    initialArticles={itemsPage.articles}
                    initialLinks={itemsPage.links}
                    initialTags={allTags.map(t => ({ id: t.id, name: t.name }))}
                    initialFeedOffset={itemsPage.nextFeedOffset}
                    initialLinkOffset={itemsPage.nextLinkOffset}
                    initialHasMore={itemsPage.hasMore}
                />
            </Suspense>
        </>
    );
}
