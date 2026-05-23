'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import CollapsibleCategory from './CollapsibleCategory';

const LS_KEY = 'multivrss:sidebar:openCategories';

type Props = {
    categories: {
        id: string;
        name: string;
        sources: { id: string; title: string | null; slug: string }[];
    }[];
};

export default function SidebarCategories({ categories }: Props) {
    const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
    const restored = useRef(false);

    useEffect(() => {
        if (restored.current) return;
        restored.current = true;
        try {
            const raw = localStorage.getItem(LS_KEY);
            if (raw) {
                const ids: string[] = JSON.parse(raw);
                requestAnimationFrame(() => setOpenCategories(new Set(ids)));
            }
        } catch {
            // ignore invalid stored data
        }
    }, []);

    const toggle = useCallback((id: string) => {
        setOpenCategories(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            try {
                localStorage.setItem(LS_KEY, JSON.stringify([...next]));
            } catch { /* quota exceeded, ignore */ }
            return next;
        });
    }, []);

    return (
        <>
            {categories.map(category => (
                <CollapsibleCategory
                    key={category.id}
                    category={category}
                    isOpen={openCategories.has(category.id)}
                    onToggle={() => toggle(category.id)}
                />
            ))}
        </>
    );
}
