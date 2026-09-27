import { Suspense, cache } from 'react';
import Sidebar from '@/components/Sidebar';
import SidebarContainer from '@/components/SidebarContainer';
import MobileShell from '@/components/MobileShell';
import { MobileSidebarProvider } from '@/components/MobileSidebarContext';
import { MobileActionsProvider } from '@/components/MobileActionsContext';
import { SavedLinksSyncProvider } from '@/components/SavedLinksSyncContext';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AutoSync from '@/components/AutoSync';
import SessionWatcher from '@/components/SessionWatcher';
import ShareTargetWatcher from '@/components/ShareTargetWatcher';
import { getCategories } from '@/app/actions/categories';
import { getTags } from '@/app/actions/tags';

// This layout's top-level `getServerSession()` call gates every route under
// /u/[username] with a redirect-if-unauthenticated check — that has to run
// before anything renders, so it can't be pushed behind a <Suspense> boundary
// the way Cache Components' "instant navigation" shell wants. Per Next.js's
// own authentication-with-cache-components guide, `instant = false` is the
// sanctioned way to mark a route as intentionally blocking here rather than
// chasing an unfixable warning. See:
// node_modules/next/dist/docs/01-app/02-guides/authentication-with-cache-components.md
export const instant = false;

// Deduped per request: both gates below need categories, MobileActionsGate needs
// only that, ShareTargetGate needs both. cache() collapses the repeated calls
// into a single DB round-trip per render pass.
const getCategoriesOnce = cache(getCategories);
const getTagsOnce = cache(getTags);

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

    return (
        <MobileSidebarProvider>
            <SavedLinksSyncProvider>
                <AutoSync />
                <SessionWatcher />
                <Suspense fallback={null}>
                    <ShareTargetGate />
                </Suspense>
                <div className="flex h-screen shrink-0 overflow-hidden bg-background text-foreground relative">
                    <SidebarContainer>
                        <Sidebar username={username} />
                    </SidebarContainer>
                    {/* Fallback renders the same visible shell without MobileActionsProvider
                        (MobileTabBar's "+ ADD" falls back to the context's no-op default until
                        categories resolve) so the page never blocks on this closed-by-default modal. */}
                    <Suspense fallback={<MobileShell username={username}>{children}</MobileShell>}>
                        <MobileActionsGate username={username}>{children}</MobileActionsGate>
                    </Suspense>
                </div>
            </SavedLinksSyncProvider>
        </MobileSidebarProvider>
    );
}

// Categories are only consumed by the closed-by-default "+ ADD" mobile modal
// (MobileActionsContext -> AddFeedForm), so this data has no business blocking
// the shared layout shell — isolate it behind its own Suspense boundary.
async function MobileActionsGate({
    username,
    children,
}: {
    username: string;
    children: React.ReactNode;
}) {
    const categories = await getCategoriesOnce();
    return (
        <MobileActionsProvider categories={categories}>
            <MobileShell username={username}>{children}</MobileShell>
        </MobileActionsProvider>
    );
}

async function ShareTargetGate() {
    const [categories, tags] = await Promise.all([getCategoriesOnce(), getTagsOnce()]);
    return <ShareTargetWatcher categories={categories} tags={tags} />;
}
