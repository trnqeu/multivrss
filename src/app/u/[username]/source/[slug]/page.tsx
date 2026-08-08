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
                <header className="px-6 py-3 md:px-10 md:py-4 border-b-2 border-foreground bg-background sticky top-0 z-10 flex items-center gap-3">
                    <Link
                        href={`/u/${session.user.username}`}
                        className="label-system shrink-0 hover:bg-foreground hover:text-background px-1 transition-all border border-foreground font-bold"
                    >
                        ← BACK_TO_ALL
                    </Link>
                    <span className="label-system shrink-0 text-terracotta">SOURCE</span>
                    <h1 className="min-w-0 flex-1 truncate text-lg md:text-xl font-bold normal-case tracking-normal text-foreground">
                        {source.title || 'Untitled'}
                    </h1>
                    <span
                        className="hidden sm:inline-flex items-baseline gap-1.5 shrink-0 text-foreground/40 text-[10px] font-bold uppercase tracking-widest"
                        title={source.url}
                    >
                        SYNC_PATH
                        <span className="normal-case tracking-normal font-mono text-foreground/50 max-w-[280px] truncate">
                            {source.url.replace(/^https?:\/\//, '')}
                        </span>
                    </span>
                </header>

                {/* Filtered Feed List */}
                <FeedList sourceId={source.id} />
            </main>
        </>
    );
}
