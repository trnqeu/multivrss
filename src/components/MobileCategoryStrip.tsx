'use client';

import { useRouter, useSearchParams } from 'next/navigation';

type Props = {
    categories: { id: string; name: string }[];
    username: string;
};

export default function MobileCategoryStrip({ categories, username }: Props) {
    const router = useRouter();
    const params = useSearchParams();
    const activeCat = params.get('cat');

    function select(name: string | null) {
        const next = new URLSearchParams(params.toString());
        if (name) next.set('cat', name);
        else next.delete('cat');
        router.replace(`/u/${username}?${next}`);
    }

    return (
        <div className="md:hidden flex overflow-x-auto border-b-2 border-foreground shrink-0">
            <button
                onClick={() => select(null)}
                className={`px-5 py-3 text-[11px] font-bold uppercase tracking-widest shrink-0 border-b-2 -mb-0.5 transition-colors ${!activeCat
                        ? 'text-terracotta border-terracotta'
                        : 'text-foreground/50 border-transparent'
                    }`}
            >
                ALL
            </button>
            {categories.map((cat) => (
                <button
                    key={cat.id}
                    onClick={() => select(cat.name)}
                    className={`px-5 py-3 text-[11px] font-bold uppercase tracking-widest shrink-0 border-b-2 -mb-0.5 transition-colors ${activeCat === cat.name
                            ? 'text-terracotta border-terracotta'
                            : 'text-foreground/50 border-transparent'
                        }`}
                >
                    {cat.name}
                </button>
            ))}
        </div>
    );
}