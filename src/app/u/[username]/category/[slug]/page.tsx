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
                <header className="px-6 py-3 md:px-10 md:py-4 border-b-2 border-foreground bg-background sticky top-0 z-10 flex flex-col gap-1.5">
                    <div className="flex items-center gap-3 min-w-0">
                        <Link
                            href={`/u/${session.user.username}`}
                            className="label-system shrink-0 hover:bg-foreground hover:text-background px-1 transition-all border border-foreground font-bold"
                        >
                            ← BACK_TO_ALL
                        </Link>
                        <h1 className="min-w-0 truncate text-sm md:text-base tracking-[0.15em] text-terracotta font-bold">
                            CATEGORY // {category.name.toUpperCase()}
                        </h1>
                    </div>
                    <p className="text-foreground/40 text-[10px] font-bold leading-relaxed uppercase tracking-widest">
                        SOURCES: {category._count.sources.toString().padStart(2, '0')}
                    </p>
                </header>

                <FeedList categoryName={category.name} />
            </main>
        </>
    );
}
