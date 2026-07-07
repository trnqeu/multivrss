import { getCategories } from "@/app/actions";
import { connection } from 'next/server';
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
    searchParams: Promise<{ view?: string; q?: string; cat?: string; read?: string; source?: string; since?: string }>;
}) {
    await connection();
    const session = await getServerSession(authOptions);
    const categories = await getCategories();
    const params = await searchParams;

    // A category or source filter implies the user wants the River — default there
    // unless they explicitly switched to Front Page with ?view=front
    const hasFilter = !!(params.cat || params.source);
    const view: 'front' | 'river' =
        params.view === 'front' ? 'front'
        : params.view === 'river' || hasFilter ? 'river'
        : 'front';
    const userId = session?.user.id ?? '';

    const sourceCount = await prisma.feedSource.count({
        where: { category: { userId } }
    });

    return (
        <>
            <PageHeader
                categories={categories}
                username={session?.user.username ?? ''}
                email={session?.user.email}
                tabs={sourceCount > 0 ? <FeedViewSwitch view={view} /> : undefined}
            />
            <main id="main-content" className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden scroll-smooth bg-background">
                {sourceCount === 0 ? (
                    <OnboardingEmptyState username={session?.user.username ?? ''} />
                ) : view === 'river' ? (
                    <SearchBar allTags={await prisma.tag.findMany({
                        where: { userId },
                        select: { id: true, name: true },
                        orderBy: { name: 'asc' },
                    })} />
                ) : (
                    <FrontPage
                        data={await getFrontPage(userId)}
                        allTags={await prisma.tag.findMany({
                            where: { userId },
                            select: { id: true, name: true },
                            orderBy: { name: 'asc' },
                        })}
                    />
                )}
            </main>
        </>
    );
}
