import FeedList from "@/components/FeedList";
import PageHeader from "@/components/PageHeader";
import EmptyStream from "@/components/EmptyStream";
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCategories } from "@/app/actions";


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

    if (category._count.sources === 0) {
        return (
            <>
                <PageHeader categories={categories} username={session.user.username} email={session.user.email} />
                <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden relative scroll-smooth bg-background">
                    <EmptyStream variant="empty-category" contextLabel={category.name} />
                </main>
            </>
        );
    }

    return (
        <>
            <PageHeader categories={categories} username={session.user.username} />
            <main className="flex-1 min-h-0 overflow-y-auto relative scroll-smooth bg-background">
                <header className="p-8 md:p-12 border-b-2 border-foreground bg-background sticky top-0 z-10 flex flex-col gap-4">
                    <Link
                        href={`/u/${session.user.username}`}
                        className="label-system text-[10px] hover:bg-foreground hover:text-background w-fit px-1 transition-all border border-foreground font-bold"
                    >
                        ← BACK_TO_ALL
                    </Link>

                    <div className="flex flex-col gap-1">
                        <h1 className="tracking-[0.2em] text-terracotta font-bold">
                            CATEGORY // {category.name.toUpperCase()}
                        </h1>
                        <p className="text-foreground max-w-xl text-[11px] font-bold leading-relaxed uppercase tracking-widest">
                            SOURCES: {category._count.sources.toString().padStart(2, '0')}
                        </p>
                    </div>
                </header>

                <FeedList categoryName={category.name} />
            </main>
        </>
    );
}
