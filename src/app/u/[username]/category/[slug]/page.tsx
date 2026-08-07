import FeedList from "@/components/FeedList";
import PageHeader from "@/components/PageHeader";
import EmptyStream from "@/components/EmptyStream";
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCategories } from "@/app/actions/categories";
import { getTags } from "@/app/actions/tags";


interface CategoryPageProps {
    params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
    const session = await getServerSession(authOptions);
    if (!session) return notFound();

    const { slug } = await params;
    const nameQuery = slug.replace(/-/g, ' ');
    const category = await prisma.category.findFirst({
        where: {
            name: { equals: nameQuery, mode: 'insensitive' },
            userId: session.user.id,
        },
        include: { _count: { select: { sources: true } } }
    });

    if (!category) {
        return notFound();
    }

    const categories = await getCategories();
    const tags = await getTags();

    if (category._count.sources === 0) {
        return (
            <>
                <PageHeader categories={categories} tags={tags} username={session.user.username} email={session.user.email} />
                <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden relative scroll-smooth bg-background">
                    <EmptyStream variant="empty-category" contextLabel={category.name} />
                </main>
            </>
        );
    }

    return (
        <>
            <PageHeader categories={categories} tags={tags} username={session.user.username} />
            <main className="flex-1 min-h-0 overflow-y-auto relative scroll-smooth bg-background">
                <header className="px-6 py-3 md:px-10 md:py-4 border-b-2 border-foreground bg-background sticky top-0 z-10 flex items-center gap-3">
                    <Link
                        href={`/u/${session.user.username}`}
                        className="label-system shrink-0 hover:bg-foreground hover:text-background px-1 transition-all border border-foreground font-bold"
                    >
                        ← BACK_TO_ALL
                    </Link>
                    <span className="label-system shrink-0 text-terracotta">CATEGORY</span>
                    <h1 className="min-w-0 flex-1 truncate text-lg md:text-xl font-bold normal-case tracking-normal text-foreground">
                        {category.name}
                    </h1>
                    <span className="hidden sm:inline-flex items-baseline gap-1.5 shrink-0 text-foreground/40 text-[10px] font-bold uppercase tracking-widest">
                        SOURCES
                        <span className="font-mono text-foreground/50">{category._count.sources.toString().padStart(2, '0')}</span>
                    </span>
                </header>

                <FeedList categoryName={category.name} />
            </main>
        </>
    );
}
