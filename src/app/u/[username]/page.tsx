import { getCategories } from "@/app/actions/categories";
import { getTags } from "@/app/actions/tags";
import { connection } from 'next/server';
import { cookies } from 'next/headers';
import SearchBar from "@/components/SearchBar";
import PageHeader from "@/components/PageHeader";
import FeedViewSwitch from "@/components/FeedViewSwitch";
import FrontPage from "@/components/FrontPage";
import OnboardingEmptyState from "@/components/OnboardingEmptyState";
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getFrontPage } from "@/lib/frontpage";

export default async function Home({
    searchParams,
}: {
    searchParams: Promise<{ view?: string; q?: string; cat?: string; read?: string; source?: string; since?: string; added?: string; addError?: string }>;
}) {
    await connection();
    const session = await getServerSession(authOptions);
    const categories = await getCategories();
    const tags = await getTags();
    const params = await searchParams;

    // A category or source filter implies the user wants the River — default there
    // unless they explicitly switched to Front Page with ?view=front
    const hasFilter = !!(params.cat || params.source || params.q);
    const cookieStore = await cookies();
    const defaultView: 'front' | 'river' = cookieStore.get('default-view')?.value === 'river' ? 'river' : 'front';
    const view: 'front' | 'river' =
        params.view === 'front' ? 'front'
        : params.view === 'river' || hasFilter ? 'river'
        : defaultView;
    const userId = session?.user.id ?? '';

    const sourceCount = await prisma.feedSource.count({
        where: { category: { userId } }
    });

    return (
        <>
            <PageHeader
                categories={categories}
                tags={tags}
                username={session?.user.username ?? ''}
                email={session?.user.email}
                tabs={sourceCount > 0 ? <FeedViewSwitch view={view} /> : undefined}
            />
            {(params.added || params.addError) && (
                <div
                    role="status"
                    aria-live="polite"
                    className="px-4 py-2 border-b-2 border-foreground bg-background font-mono text-[11px] font-bold uppercase tracking-widest text-center"
                >
                    {params.added
                        ? <span>Added <span className="text-terracotta">{params.added}</span> to your reader.</span>
                        : <span className="text-terracotta">{params.addError}</span>}
                </div>
            )}
            <main id="main-content" className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden scroll-smooth bg-background">
                {sourceCount === 0 ? (
                    <OnboardingEmptyState username={session?.user.username ?? ''} />
                ) : view === 'river' ? (
                    <SearchBar
                        username={session?.user.username ?? ''}
                        allTags={await prisma.tag.findMany({
                            where: { userId },
                            select: { id: true, name: true },
                            orderBy: { name: 'asc' },
                        })}
                    />
                ) : (
                    <FrontPage
                        data={await getFrontPage(userId)}
                        allTags={await prisma.tag.findMany({
                            where: { userId },
                            select: { id: true, name: true },
                            orderBy: { name: 'asc' },
                        })}
                        username={session?.user.username ?? ''}
                    />
                )}
            </main>
        </>
    );
}
