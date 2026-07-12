import { Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import SidebarContainer from '@/components/SidebarContainer';
import MobileShell from '@/components/MobileShell';
import { MobileSidebarProvider } from '@/components/MobileSidebarContext';
import { MobileActionsProvider } from '@/components/MobileActionsContext';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AutoSync from '@/components/AutoSync';
import SessionWatcher from '@/components/SessionWatcher';
import ShareTargetWatcher from '@/components/ShareTargetWatcher';
import { getCategories } from '@/app/actions/categories';
import { getTags } from '@/app/actions/tags';

export default async function UserLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ username: string }>;
}) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const { username } = await params;
    if (session.user.username !== username) {
        redirect(`/u/${session.user.username}`);
    }

    const categories = await getCategories();
    const tags = await getTags();

    return (
        <MobileSidebarProvider>
            <MobileActionsProvider categories={categories}>
                <AutoSync />
                <SessionWatcher />
                <Suspense fallback={null}>
                    <ShareTargetWatcher categories={categories} tags={tags} />
                </Suspense>
                <div className="flex flex-1 overflow-hidden h-screen bg-background text-foreground relative">
                    <SidebarContainer>
                        <Sidebar username={session.user.username} />
                    </SidebarContainer>
                    <MobileShell username={session.user.username}>
                        {children}
                    </MobileShell>
                </div>
            </MobileActionsProvider>
        </MobileSidebarProvider>
    );
}
