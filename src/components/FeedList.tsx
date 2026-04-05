import { prisma } from '@/lib/prisma';

interface FeedListProps {
    sourceId?: string;
}

export default async function FeedList({ sourceId }: FeedListProps) {
    const items = await prisma.feedItem.findMany({
        where: sourceId ? { sourceId } : {},
        take: 50,
        orderBy: { pubDate: 'desc' },
        include: { source: true }
    });

    return (
        <section className="p-6 md:p-8 flex flex-col gap-8 max-w-5xl">
            {items.map((item) => (
                <article key={item.id} className="relative group pl-6 border-l-2 border-foreground hover:border-foreground transition-all duration-200">
                    {/* Vertical accent bar on hover (now using foreground) */}
                    <div className="absolute left-0 top-0 w-[2px] h-0 bg-foreground group-hover:h-full transition-all duration-300"></div>

                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-3">
                            <span className="label-system text-foreground font-bold text-[9px]">
                                {item.source.title}
                            </span>
                            <span className="h-px w-4 bg-foreground"></span>
                            <span className="label-system text-foreground text-[9px]">
                                {item.pubDate ? new Date(item.pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '---'}
                            </span>
                        </div>

                        <a
                            href={item.link}
                            target="_blank"
                            className="block"
                        >
                            <h3 className="text-foreground group-hover:bg-foreground group-hover:text-background transition-all !normal-case !font-bold !text-base leading-tight inline-block px-1">
                                {item.title}
                            </h3>
                        </a>

                        {item.content && (
                            <p className="text-foreground line-clamp-2 leading-relaxed text-xs max-w-3xl font-medium mt-0.5">
                                {item.content.replace(/<[^>]*>?/gm, '')}
                            </p>
                        )}

                        <div className="mt-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <a href={item.link} target="_blank" className="label-system text-[8px] hover:bg-foreground hover:text-background flex items-center gap-1.5 transition-all w-fit px-1">
                                OPEN_TRANSIT <span className="text-[10px]">→</span>
                            </a>
                        </div>
                    </div>
                </article>
            ))}

            {items.length === 0 && (
                <div className="py-8 border-2 border-dashed border-foreground text-center">
                    <p className="label-system italic">NULL_SET // SYNC_REQUIRED</p>
                </div>
            )}

            {/* End of Feed Sentinel */}
            <div className="pt-8 pb-16 flex flex-col items-center">
                <div className="h-0.5 w-full bg-foreground relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 bg-background label-system !text-[8px] font-bold">
                        SYSTEM_END
                    </div>
                </div>
            </div>
        </section>
    );
}
