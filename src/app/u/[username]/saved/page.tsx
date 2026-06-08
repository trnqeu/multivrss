import PageHeader from "@/components/PageHeader";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCategories } from "@/app/actions";
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
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

    const articles = savedFeedItems.map(item => ({
        id: item.id,
        title: item.title,
        link: item.link,
        content: item.content,
        savedAt: item.savedAt!,
        sourceTitle: item.source.title,
    }));

    const links = savedLinks.map(link => ({
        id: link.id,
        title: link.title,
        url: link.url,
        description: link.description,
        createdAt: link.createdAt,
    }));

    return (
        <>
            <PageHeader categories={categories} username={session.user.username} email={session.user.email} />
            <SavedPageClient
                username={session.user.username}
                initialArticles={articles}
                initialLinks={links}
            />
        </>
    );
}
