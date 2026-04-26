import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LogoutButton from "./LogoutButton";
import CollapsibleCategory from "./CollapsibleCategory";


export default async function Sidebar() {
    const session = await getServerSession(authOptions);
    const categories = await prisma.category.findMany({
        where: { userId: session?.user.id }, // filter by userId
        include: {
            sources: {
                orderBy: { title: 'asc' }
            },
        },
        orderBy: { name: 'asc' }
    });

    return (
        <aside className="w-64 border-r-2 border-foreground flex flex-col bg-background h-full">
            {/* System Brand / Logo Area */}
            <div className="p-8 border-b-2 border-foreground">
                <h1 className="!text-xl tracking-[0.2em] !text-terracotta">
                    <Link href="/">MULTIVRSS</Link>
                </h1>
            </div>

            <nav className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
                {/* Main Navigation */}
                <div className="flex flex-col gap-4">
                    <span className="label-system text-foreground">NAV_ROOT</span>
                    <Link
                        href="/"
                        className="group flex items-center gap-3 text-sm uppercase tracking-widest font-bold hover:text-background hover:bg-foreground transition-all pl-2 border-l-2 border-transparent hover:border-foreground"
                    >
                        <span className="text-foreground group-hover:text-background transition-colors">
                            _
                        </span>
                        All Feeds
                    </Link>
                </div>

                {/* Categories as Modules */}
                {categories.map((category) => (
                    <CollapsibleCategory key={category.id} category={category} />
                ))}
            </nav>

            {/* System Footer */}
            <div className="p-8 border-t-2 border-foreground flex flex-col gap-3">
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
