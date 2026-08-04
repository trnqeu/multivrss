import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cacheLife, cacheTag } from 'next/cache';
import SidebarCategories from "./SidebarCategories";
import MobileNavLink from "./MobileNavLink";
import SidebarNavLink from "./SidebarNavLink";
import SpinningWrapper from "./SpinningWrapper";
import SyncBadge from "./SyncBadge";
import { version } from "../../package.json";


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
        <aside className="w-full shrink-0 border-r-2 border-foreground flex flex-col bg-background h-full">
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
                <SidebarNavLink
                    href={`/u/${username}`}
                    label="All Feeds"
                    extraActivePrefixes={[`/u/${username}/category`, `/u/${username}/source`]}
                />
                <SidebarNavLink
                    href={`/u/${username}/saved`}
                    label="Saved"
                    count={savedCount.toString().padStart(2, '0')}
                />
                <SidebarNavLink
                    href={`/u/${username}/suggested`}
                    label="Suggested"
                />

                {/* Categories as Modules */}
                <span className="font-mono text-[9px] font-extrabold uppercase tracking-[.2em] text-foreground/35 px-1 mt-[10px]">CATEGORIES</span>
                <SidebarCategories categories={categories} username={username} />

            </nav>

            <div className="font-mono text-[9px] font-extrabold uppercase tracking-[.2em] text-foreground px-[18px] py-[9px] border-t-2 border-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                POWERED BY{" "}
                <a
                    href="https://trnq.eu/"
                    target="_blank"
                    rel="noopener"
                    className="text-terracotta no-underline hover:underline"
                >
                    trnq.eu
                </a>{" "}
                <span className="text-foreground/35 text-[8px]">v{version}</span>
            </div>
        </aside>
    );
}
