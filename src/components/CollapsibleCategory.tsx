'use client';

import RenameFeedTitle from './RenameFeedTitle';
import RenameCategoryTitle from './RenameCategoryTitle';

type Props = {
    category: {
        id: string;
        name: string;
        sources: { id: string; title: string | null; slug: string }[];
    };
    isOpen: boolean;
    onToggle: () => void;
    username: string;
};

export default function CollapsibleCategory({ category, isOpen, onToggle, username }: Props) {
    return (
        <div className="flex flex-col gap-4">
            <div className="group flex items-center justify-between border-b-2 border-terracotta pb-2 gap-2">
                <div className="flex items-baseline gap-2.5 flex-1 min-w-0">
                    <RenameCategoryTitle categoryId={category.id} name={category.name} username={username} />
                    <span className="font-mono text-[10px] font-bold text-foreground/40 tracking-wider shrink-0">
                        {category.sources.length.toString().padStart(2, '0')}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={onToggle}
                    aria-expanded={isOpen}
                    aria-label={isOpen ? `Chiudi ${category.name}` : `Apri ${category.name}`}
                    className="w-[22px] h-[22px] border-2 border-terracotta text-terracotta bg-background inline-flex items-center justify-center font-mono text-sm font-extrabold leading-none shrink-0 hover:bg-terracotta hover:text-background transition-colors"
                >
                    {isOpen ? '–' : '+'}
                </button>
            </div>

            {isOpen && (
                <ul className="flex flex-col gap-2">
                    {category.sources.map((source) => (
                        <li key={source.id} className="group flex items-center relative pr-16">
                            <RenameFeedTitle sourceId={source.id} title={source.title ?? ''} username={username} />
                        </li>
                    ))}
                    {category.sources.length === 0 && (
                        <span className="label-system text-[9px] opacity-20 italic">Empty_Slot</span>
                    )}
                </ul>
            )}
        </div>
    );
}
