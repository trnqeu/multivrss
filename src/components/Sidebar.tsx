import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cacheLife, cacheTag } from 'next/cache';
import LogoutButton from "./LogoutButton";
import SidebarCategories from "./SidebarCategories";
import MobileNavLink from "./MobileNavLink";

import SpinningWrapper from "./SpinningWrapper";
import SyncBadge from "./SyncBadge";
import ExportCsvButton from "./ExportCsvButton";
import ImportCsvForm from "./ImportCsvForm";


export default async function Sidebar({ username }: { username: string }) {
    const session = await getServerSession(authOptions);
    return <CachedSidebar username={username} userId={session?.user.id} />;
}

async function CachedSidebar({ username, userId }: { username: string; userId?: string }) {
    'use cache';
    cacheLife('minutes');
    cacheTag(`sidebar:${userId}`);

    const categories = await prisma.category.findMany({
        where: { userId },
        include: {
            sources: {
                orderBy: { title: 'asc' }
            },
        },
        orderBy: { name: 'asc' }
    });

    return (
        <aside className="w-64 border-r-2 border-foreground flex flex-col bg-background h-full">
            {/* Brand lockup */}
            <div className="p-6 border-b-2 border-foreground">
                <MobileNavLink href={`/u/${username}`} className="flex items-center gap-3.5 hover:opacity-80 transition-opacity">
                    <SpinningWrapper>
                        <Image
                            src="/logo/multivrss-ico.png"
                            alt=""
                            width={40}
                            height={40}
                            className="w-10 h-10 object-contain shrink-0"
                            priority
                        />
                    </SpinningWrapper>
                    <span className="text-lg font-extrabold uppercase tracking-[0.18em] text-terracotta">
                        multivrss
                    </span>
                </MobileNavLink>
                <SyncBadge />
            </div>

            <nav className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
                {/* Main Navigation */}
                <div className="flex flex-col gap-4">
                    <span className="label-system text-foreground">NAV_ROOT</span>
                    <MobileNavLink
                        href={`/u/${username}`}
                        className="group flex items-center gap-3 text-sm uppercase tracking-widest font-bold hover:text-background hover:bg-foreground transition-all pl-2 border-l-2 border-transparent hover:border-foreground"
                    >
                        <span className="text-foreground group-hover:text-background transition-colors">
                            _
                        </span>
                        All Feeds
                    </MobileNavLink>
                </div>

                {/* Categories as Modules */}
                <SidebarCategories categories={categories} username={username} />
            </nav>

            {/* System Footer */}
            <div className="p-8 border-t-2 border-foreground flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                    <ExportCsvButton />
                    <ImportCsvForm />
                </div>
                <div>
                    <LogoutButton />
                </div>
                <div className="label-system text-[9px] text-foreground font-bold">
                    Connection: [PROTECTED]
                    <br />
                    Node: MULTIVRSS_ALPHA
                </div>
            </div>
        </aside>
    );
}
