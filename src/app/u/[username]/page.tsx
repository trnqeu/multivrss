import { getCategories } from "@/app/actions";
import { connection } from 'next/server';
import SearchBar from "@/components/SearchBar";
import PageHeader from "@/components/PageHeader";
import EmptyStream from "@/components/EmptyStream";
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Home() {
    await connection();
    const session = await getServerSession(authOptions);
    const categories = await getCategories();

    const sourceCount = await prisma.feedSource.count({
        where: { category: { userId: session?.user.id ?? '' } }
    });

    return (
        <>
            <PageHeader categories={categories} username={session?.user.username ?? ''} email={session?.user.email} />
            <main className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden scroll-smooth bg-background">
                {sourceCount === 0 ? (
                    <EmptyStream variant="no-sources" />
                ) : (
                    <SearchBar />
                )}
            </main>
        </>
    );
}
