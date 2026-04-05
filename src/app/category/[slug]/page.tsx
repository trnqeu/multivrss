import Sidebar from '@/components/Sidebar';
import FeedList from "@/components/FeedList";
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
    const { slug } = await params;

    const nameQuery = slug.replace(/-/g, ' ');
    const category = await prisma.category.findFirst({
        where: { name: { equals: nameQuery, mode: 'insensitive' } },
        include: { _count: { select: { sources: true } } }
    });

    if (!category) {
        return notFound();
    }

    return (
        <div className="flex flex-1 overflow-hidden h-screen bg-background text-foreground">
            <Sidebar />

            <main className="flex-1 overflow-y-auto relative scroll-smooth bg-background">
                <header className="p-8 md:p-12 border-b-2 border-foreground bg-background sticky top-0 z-10 flex flex-col gap-4">
                    <Link
                        href="/"
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

                <FeedList categoryId={category.id} />
            </main>
        </div>
    );
}
