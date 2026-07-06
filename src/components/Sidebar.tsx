import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cacheLife, cacheTag } from 'next/cache';
import SidebarCategories from "./SidebarCategories";
import MobileNavLink from "./MobileNavLink";
import SpinningWrapper from "./SpinningWrapper";
import SyncBadge from "./SyncBadge";


export default async function Sidebar({ username }: { username: string }) {
    const session = await getServerSession(authOptions);
    return <CachedSidebar username={username} userId={session?.user.id} />;
}

async function CachedSidebar({ username, userId }: { username: string; userId?: string }) {
    'use cache';
    cacheLife('minutes');
    cacheTag(`sidebar:${userId}`);

    const [categories, savedFeedCount, savedLinkCount] = await Promise.all([
        prisma.category.findMany({
            where: { userId },
            include: {
                sources: {
                    orderBy: { title: 'asc' }
                },
            },
            orderBy: { name: 'asc' }
        }),
        prisma.feedItem.count({ where: { savedAt: { not: null }, source: { category: { userId } } } }),
        prisma.savedLink.count({ where: { userId } }),
    ]);
    const savedCount = savedFeedCount + savedLinkCount;

    return (
        <aside className="w-[212px] shrink-0 border-r-2 border-foreground flex flex-col bg-background h-full">
            {/* Brand lockup */}
            <div className="flex items-center gap-[11px] p-[18px] border-b-2 border-foreground">
                <MobileNavLink href={`/u/${username}`} className="flex items-center gap-[11px] hover:opacity-80 transition-opacity">
                    <SpinningWrapper>
                        <Image
                            src="/logo/multivrss-ico.png"
                            alt=""
                            width={28}
                            height={28}
                            className="w-7 h-7 object-contain shrink-0"
                            priority
                        />
                    </SpinningWrapper>
                    <span className="font-mono text-sm font-extrabold uppercase tracking-[.16em] text-terracotta">
                        multivrss
                    </span>
                </MobileNavLink>
                <SyncBadge />
            </div>

            <nav aria-label="Main navigation" className="flex-1 overflow-y-auto p-[14px] pt-[18px] flex flex-col gap-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {/* Main Navigation */}
                <span className="font-mono text-[9px] font-extrabold uppercase tracking-[.2em] text-foreground/35 px-1">NAV_ROOT</span>
                <MobileNavLink
                    href={`/u/${username}`}
                    className="group flex items-center gap-[9px] font-mono text-[11px] font-bold uppercase tracking-[.1em] text-foreground hover:text-terracotta transition-colors px-1 py-[3px]"
                >
                    <span aria-hidden="true">◈</span> All Feeds
                </MobileNavLink>
                <MobileNavLink
                    href={`/u/${username}/saved`}
                    className="group flex items-center gap-[9px] font-mono text-[11px] font-bold uppercase tracking-[.1em] text-foreground hover:text-terracotta transition-colors px-1 py-[3px]"
                >
                    <span aria-hidden="true">▢</span>
                    <span className="flex-1">Saved</span>
                    <span className="font-mono text-[9px] text-foreground/35">
                        {savedCount.toString().padStart(2, '0')}
                    </span>
                </MobileNavLink>
                <MobileNavLink
                    href={`/u/${username}/suggested`}
                    className="group flex items-center gap-[9px] font-mono text-[11px] font-bold uppercase tracking-[.1em] text-foreground hover:text-terracotta transition-colors px-1 py-[3px]"
                >
                    <span aria-hidden="true">◷</span>
                    <span className="flex-1">Suggested</span>
                </MobileNavLink>

                {/* Categories as Modules */}
                <span className="font-mono text-[9px] font-extrabold uppercase tracking-[.2em] text-foreground/35 px-1 mt-[10px]">CATEGORIES</span>
                <SidebarCategories categories={categories} username={username} />

            </nav>

            {/* System Footer */}
            <div className="px-[18px] py-[13px] border-t-2 border-foreground">
                <div className="font-mono text-[9px] font-extrabold uppercase tracking-[.2em] text-foreground/35 leading-[1.7]">
                    NODE · MULTIVRSS_ALPHA
                    <br />
                    Connection: [PROTECTED]
                </div>
            </div>
        </aside>
    );
}
