import Sidebar from '@/components/Sidebar';
import FeedList from "@/components/FeedList";
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface SourcePageProps {
  params: Promise<{ slug: string }>;
}

export default async function SourcePage({ params }: SourcePageProps) {
    const resolvedParams = await params;
    const { slug } = resolvedParams;
    
    const source = await prisma.feedSource.findUnique({
        where: { slug }
    });

    if (!source) {
        return notFound();
    }

    return (
        <div className="flex flex-1 overflow-hidden h-screen bg-background text-foreground">
            <Sidebar />

            <main className="flex-1 overflow-y-auto relative scroll-smooth bg-background">
                {/* Minimalist Source Header */}
                <header className="p-8 md:p-12 border-b-2 border-foreground bg-background sticky top-0 z-10 flex flex-col gap-4">
                    <Link 
                        href="/" 
                        className="label-system text-[10px] hover:bg-foreground hover:text-background w-fit px-1 transition-all border border-foreground font-bold"
                    >
                        ← BACK_TO_ALL
                    </Link>
                    
                    <div className="flex flex-col gap-1">
                        <h1 className="tracking-[0.2em] text-foreground font-bold">
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
        </div>
    );
}
