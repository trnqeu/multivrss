'use client';

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBar() {
    const router = useRouter();
    const [query, setQuery] = useState("");

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!query.trim()) return;
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }

    return (
        <form onSubmit={handleSubmit} className="flex gap-0 border-b-2 border-foreground">
            <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="SEARCH_QUERY //"
                className="flex-1 bg-background text-foreground px-8 py-4 text-sm font-bold uppercase tracking-widest placeholder:text-foreground/30 outline-none"
            />
            <button
                type="submit"
                className="px-8 py-4 border-l-2 border-foreground text-sm font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-all"
            >
                EXEC
            </button>
        </form>
    );
}