import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function Sidebar() {
    const categories = await prisma.category.findMany({
        include: {
            sources: true,
        },
        orderBy: { name: 'asc' }
    });

    return (
        <aside className="w-64 border-r border-accent/10 hidden md:flex flex-col bg-[#050505] h-full">
            {/* System Brand / Logo Area */}
            <div className="p-8 border-b border-accent/10">
                <h1 className="!text-xl tracking-[0.2em] !text-accent">
                    MULTIVRSS
                </h1>
            </div>

            <nav className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
                {/* Main Navigation */}
                <div className="flex flex-col gap-4">
                    <span className="label-system opacity-30">NAV_ROOT</span>
                    <Link
                        href="/"
                        className="group flex items-center gap-3 text-sm uppercase tracking-widest font-bold hover:text-accent transition-all pl-2 border-l-2 border-transparent hover:border-accent"
                    >
                        <span className="text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                            _
                        </span>
                        All Feeds
                    </Link>
                </div>

                {/* Categories as Modules */}
                {categories.map((category) => (
                    <div key={category.id} className="flex flex-col gap-4">
                        <div className="label-system border-b border-accent/10 pb-2 flex justify-between items-center">
                            <span>{category.name}</span>
                            <span className="opacity-30">{category.sources.length.toString().padStart(2, '0')}</span>
                        </div>

                        <ul className="flex flex-col gap-2">
                            {category.sources.map((source) => (
                                <li key={source.id}>
                                    <Link
                                        href={`/source/${source.id}`}
                                        className="text-[13px] text-zinc-500 hover:text-white hover:translate-x-1 transition-all block py-1 font-medium"
                                    >
                                        // {source.title || 'UNTITLED_SOURCE'}
                                    </Link>
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
            <div className="p-8 border-t border-accent/10">
                <div className="label-system text-[9px] opacity-40">
                    Connection: [PROTECTED]
                    <br />
                    Node: MULTIVRSS_ALPHA
                </div>
            </div>
        </aside>
    );
}
