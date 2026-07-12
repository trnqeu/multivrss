import FeedList from "@/components/FeedList";
import PageHeader from "@/components/PageHeader";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCategories } from "@/app/actions/categories";
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

    return (
        <>
            <PageHeader categories={categories} username={session.user.username} email={session.user.email} />
            <main className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden relative scroll-smooth bg-background">
                {/* Minimalist Source Header */}
                <header className="p-8 md:p-12 border-b-2 border-foreground bg-background sticky top-0 z-10 flex flex-col gap-4">
                    <Link 
                        href={`/u/${session.user.username}`} 
                        className="label-system text-[10px] hover:bg-foreground hover:text-background w-fit px-1 transition-all border border-foreground font-bold"
                    >
                        ← BACK_TO_ALL
                    </Link>
                    
                    <div className="flex flex-col gap-1">
                        <h1 className="tracking-[0.2em] text-terracotta font-bold">
                            SOURCE_ID // {source.title?.toUpperCase() || 'UNTITLED'}
                        </h1>
                        <p className="text-foreground max-w-xl text-[11px] font-bold leading-relaxed uppercase tracking-widest break-all">
                            SYNC_PATH: {source.url}
                        </p>
                    </div>
                </header>

                {/* Filtered Feed List */}
                <FeedList sourceId={source.id} />
            </main>
        </>
    );
}
