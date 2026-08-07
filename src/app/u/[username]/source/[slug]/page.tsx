import FeedList from "@/components/FeedList";
import PageHeader from "@/components/PageHeader";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCategories } from "@/app/actions/categories";
import { getTags } from "@/app/actions/tags";
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface SourcePageProps {
  params: Promise<{ slug: string }>;
}

export default async function SourcePage({ params }: SourcePageProps) {
    const resolvedParams = await params;
    const { slug } = resolvedParams;
    const session = await getServerSession(authOptions);
    if (!session) return notFound();
    const userId = session.user.id;
    
    const source = await prisma.feedSource.findUnique({
        where: { slug, category: { userId } }
    });

    if (!source) {
        return notFound();
    }

    const categories = await getCategories();
    const tags = await getTags();

    return (
        <>
            <PageHeader categories={categories} tags={tags} username={session.user.username} email={session.user.email} />
            <main className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden relative scroll-smooth bg-background">
                {/* Minimalist Source Header */}
                <header className="px-6 py-3 md:px-10 md:py-4 border-b-2 border-foreground bg-background sticky top-0 z-10 flex flex-col gap-1.5">
                    <div className="flex items-center gap-3 min-w-0">
                        <Link
                            href={`/u/${session.user.username}`}
                            className="label-system shrink-0 hover:bg-foreground hover:text-background px-1 transition-all border border-foreground font-bold"
                        >
                            ← BACK_TO_ALL
                        </Link>
                        <h1 className="min-w-0 truncate text-sm md:text-base tracking-[0.15em] text-terracotta font-bold">
                            SOURCE // {source.title?.toUpperCase() || 'UNTITLED'}
                        </h1>
                    </div>
                    <p
                        className="text-foreground/40 text-[10px] font-bold leading-relaxed uppercase tracking-widest truncate"
                        title={source.url}
                    >
                        SYNC_PATH: {source.url}
                    </p>
                </header>

                {/* Filtered Feed List */}
                <FeedList sourceId={source.id} />
            </main>
        </>
    );
}
