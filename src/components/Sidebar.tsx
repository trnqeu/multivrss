import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import DeleteFeedButton from './DeleteFeedButton';

export default async function Sidebar() {
    const categories = await prisma.category.findMany({
        include: {
            sources: true,
        },
        orderBy: { name: 'asc' }
    });

    return (
        <aside className="w-64 border-r-2 border-foreground hidden md:flex flex-col bg-background h-full">
            {/* System Brand / Logo Area */}
            <div className="p-8 border-b-2 border-foreground">
                <h1 className="!text-xl tracking-[0.2em] !text-foreground">
                    MULTIVRSS
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
                    <div key={category.id} className="flex flex-col gap-4">
                        <div className="label-system border-b-2 border-foreground pb-2 flex justify-between items-center text-foreground font-bold">
                            <span>{category.name}</span>
                            <span className="">{category.sources.length.toString().padStart(2, '0')}</span>
                        </div>

                        <ul className="flex flex-col gap-2">
                            {category.sources.map((source) => (
                                <li key={source.id} className="group flex items-center gap-1">
                                    <Link
                                        href={`/source/${source.slug}`}
                                        className="text-[13px] text-foreground hover:bg-foreground hover:text-background hover:translate-x-1 transition-all block py-1 font-medium px-2 flex-1"
                                    >
                                        // {source.title || 'UNTITLED_SOURCE'}
                                    </Link>
                                    <DeleteFeedButton sourceId={source.id} />
                                </li>
                            ))}

                            {category.sources.length === 0 && (
                                <span className="label-system text-[9px] opacity-20 italic">Empty_Slot</span>
                            )}
                        </ul>
                    </div>
                ))}
            </nav>

            {/* System Footer */}
            <div className="p-8 border-t-2 border-foreground">
                <div className="label-system text-[9px] text-foreground font-bold">
                    Connection: [PROTECTED]
                    <br />
                    Node: MULTIVRSS_ALPHA
                </div>
            </div>
        </aside>
    );
}
