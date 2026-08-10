import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound } from 'next/navigation';
import { prisma } from "@/lib/prisma";
import { getCategories } from "@/app/actions/categories";
import { getTags } from "@/app/actions/tags";
import PageHeader from "@/components/PageHeader";
import ImportExportClient from "./ImportExportClient";

interface ImportExportPageProps {
    params: Promise<{ username: string }>;
}

export default async function ImportExportPage({ params }: ImportExportPageProps) {
    const { username } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return notFound();
    if (session.user.username !== username) {
        notFound();
    }

    const userId = session.user.id;
    const [categories, tags, feedCount, savedCount] = await Promise.all([
        getCategories(),
        getTags(),
        prisma.feedSource.count({ where: { category: { userId } } }),
        prisma.savedLink.count({ where: { userId } }),
    ]);

    return (
        <>
            <PageHeader categories={categories} tags={tags} username={session.user.username} email={session.user.email} />
            <ImportExportClient
                username={session.user.username}
                feedCount={feedCount}
                categoryCount={categories.length}
                savedCount={savedCount}
                tagCount={tags.length}
            />
        </>
    );
}
