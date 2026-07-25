import PageHeader from "@/components/PageHeader";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCategories } from "@/app/actions/categories";
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import SavedPageClient from './SavedPageClient';

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

    const [savedFeedItems, savedLinks, allTags] = await Promise.all([
        prisma.feedItem.findMany({
            where: {
                savedAt: { not: null },
                source: { category: { userId: session.user.id } }
            },
            include: {
                source: { select: { title: true } },
                tags: { include: { tag: { select: { id: true, name: true } } } },
            },
            orderBy: { savedAt: 'desc' }
        }),
        prisma.savedLink.findMany({
            where: { userId: session.user.id },
            include: { tags: { include: { tag: { select: { id: true, name: true } } } } },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.tag.findMany({
            where: { userId: session.user.id },
            orderBy: { name: 'asc' },
        }),
    ]);

    const articles = savedFeedItems.map(item => ({
        id: item.id,
        title: item.title,
        link: item.link,
        content: item.content,
        savedAt: item.savedAt!,
        sourceTitle: item.source.title,
        tags: item.tags.map(jt => ({ id: jt.tag.id, name: jt.tag.name })),
    }));

    const links = savedLinks.map(link => ({
        id: link.id,
        title: link.title,
        url: link.url,
        description: link.description,
        createdAt: link.createdAt,
        tags: link.tags.map(jt => ({ id: jt.tag.id, name: jt.tag.name })),
    }));

    return (
        <>
            <PageHeader categories={categories} tags={allTags} username={session.user.username} email={session.user.email} />
            <Suspense fallback={null}>
                <SavedPageClient
                    username={session.user.username}
                    initialArticles={articles}
                    initialLinks={links}
                    initialTags={allTags.map(t => ({ id: t.id, name: t.name }))}
                />
            </Suspense>
        </>
    );
}
