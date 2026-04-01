import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function Sidebar() {
    const categories = await prisma.category.findMany({
        include: {
            _count: {
                select: { sources: true }
            }
        },
        orderBy: { name: 'asc' }
    });

    return (
        <aside className="w-64 border-r-2 border-accent hidden md:flex flex-col p-4">
            <h2 className="text-xl mb-4 text-accent font-bold">CATEGORIES</h2>
            <nav className="flex flex-col gap-2">
                <Link
                    href="/"
                    className="hover:text-accent transition-colors font-medium border-b border-transparent hover:border-accent pb-1 w-fit"
                >
                    All Feeds
                </Link>
                <hr className="my-2 border-zinc-200" />
                {categories.map((category) => (
                    <Link
                        key={category.id}
                        href={`/category/${category.id}`}
                        className="flex justify-between items-center hover:text-accent transition-colors font-medium group"
                    >
                        <span>{category.name}</span>
                        <span className="text-xs bg-zinc-100 px-2 py-1 rounded text-zinc-500 group-hover:bg-accent group-hover:text-white transition-colors">
                            {category._count.sources}
                        </span>
                    </Link>
                ))}
            </nav>
        </aside>
    )
}