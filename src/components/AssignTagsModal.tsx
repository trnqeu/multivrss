'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { setFeedItemTags, createTag } from '@/app/actions/tags';

interface TagVM {
    id: string;
    name: string;
}

interface TitleFieldConfig {
    value: string;
    onChange: (value: string) => void;
    label?: string;
}

interface AssignTagsModalProps {
    open: boolean;
    onClose: () => void;
    itemId: string;
    initialTags: TagVM[];
    allTags: TagVM[];
    onTagsApplied: (itemId: string, tags: TagVM[]) => void;
    onSave?: (itemId: string, tagIds: string[], title?: string) => Promise<{ success: boolean }>;
    titleField?: TitleFieldConfig;
    heading?: string;
}

export default function AssignTagsModal({
    open, onClose, itemId, initialTags, allTags, onTagsApplied, onSave, titleField, heading,
}: AssignTagsModalProps) {
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(initialTags.map(t => t.id)));
    const [localTags, setLocalTags] = useState<TagVM[]>(allTags);
    const [isPending, setIsPending] = useState(false);
    const [uid] = useState(() => Math.floor(1000 + Math.random() * 9000));
    const pendingCreateRef = useRef<{ name: string; promise: Promise<TagVM | null> } | null>(null);

    useEffect(() => {
        if (!open) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [open, onClose]);

    const filtered = localTags.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase())
    );
    const exactMatch = localTags.some(t => t.name.toLowerCase() === search.trim().toLowerCase());
    const canCreate = search.trim().length > 0 && !exactMatch;

    const toggleTag = useCallback((tagId: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(tagId)) next.delete(tagId);
            else next.add(tagId);
            return next;
        });
    }, []);

    const ensureTagExists = useCallback(async (rawName: string): Promise<TagVM | null> => {
        const name = rawName.trim();
        const existing = localTags.find(t => t.name.toLowerCase() === name.toLowerCase());
        if (existing) return existing;
        if (pendingCreateRef.current?.name.toLowerCase() === name.toLowerCase()) {
            return pendingCreateRef.current.promise;
        }
        const promise = createTag(name).then(result => {
            if (result.success && result.tag) {
                const tag = result.tag;
                setLocalTags(prev => prev.some(t => t.id === tag.id) ? prev : [...prev, tag]);
                return tag;
            }
            return null;
        }).finally(() => {
            pendingCreateRef.current = null;
        });
        pendingCreateRef.current = { name, promise };
        return promise;
    }, [localTags]);

    const handleCreate = useCallback(async () => {
        const name = search.trim();
        if (!name || exactMatch || isPending) return;
        setIsPending(true);
        try {
            const tag = await ensureTagExists(name);
            if (tag) {
                setSelectedIds(prev => new Set(prev).add(tag.id));
                setSearch('');
            }
        } finally {
            setIsPending(false);
        }
    }, [search, exactMatch, isPending, ensureTagExists]);

    const handleApply = async () => {
        setIsPending(true);
        try {
            const finalTagIds = new Set(selectedIds);
            let createdTag: TagVM | null = null;

            if (canCreate) {
                createdTag = await ensureTagExists(search.trim());
                if (createdTag) finalTagIds.add(createdTag.id);
            }

            const saveFn = onSave || setFeedItemTags;
            const saveResult = await saveFn(itemId, Array.from(finalTagIds), titleField?.value);
            if (saveResult.success) {
                const allCurrentTags = createdTag && !localTags.some(t => t.id === createdTag!.id)
                    ? [...localTags, createdTag]
                    : localTags;
                const appliedTags = allCurrentTags.filter(t => finalTagIds.has(t.id));
                onTagsApplied(itemId, appliedTags);
                onClose();
            }
        } finally {
            setIsPending(false);
        }
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.70)' }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="w-full max-w-lg border-2 border-foreground bg-background">
                {/* Header */}
                <div className="flex items-center justify-between px-[22px] py-[22px] border-b-2 border-foreground">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-terracotta font-bold">
                        {heading ?? 'ASSIGN_TAGS'}
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="w-9 h-9 flex items-center justify-center bg-transparent border border-foreground/40 text-foreground text-xl leading-none hover:border-foreground transition-colors"
                    >
                        ×
                    </button>
                </div>

                {/* Body */}
                <div className="px-[26px] pt-[26px] flex flex-col gap-[22px]">
                    {/* Section 00: Title (only when editing a saved link) */}
                    {titleField && (
                        <div className="flex flex-col gap-2">
                            <label htmlFor="atm-title" className="font-mono text-[10px] uppercase tracking-widest text-terracotta">
                                {titleField.label ?? 'TITLE'}
                            </label>
                            <input
                                id="atm-title"
                                type="text"
                                value={titleField.value}
                                onChange={e => titleField.onChange(e.target.value)}
                                disabled={isPending}
                                placeholder="ARTICLE_TITLE..."
                                className="w-full px-3 py-3 bg-background border-2 border-foreground font-mono text-[13px] text-foreground placeholder:text-foreground/30 outline-none focus-visible:border-terracotta disabled:opacity-50"
                            />
                        </div>
                    )}
                    {/* Section 01: Filter/Search */}
                    <div className="flex flex-col gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-terracotta">
                            FILTER OR CREATE NEW TAG
                        </span>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-terracotta font-mono text-xs select-none pointer-events-none">
                                &gt;
                            </span>
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                aria-label="Filter or create a tag"
                                placeholder="TYPE_TAG_NAME..."
                                disabled={isPending}
                                onKeyDown={e => {
                                    if (e.key !== 'Enter') return;
                                    e.preventDefault();
                                    if (canCreate) {
                                        void handleCreate();
                                    } else if (filtered.length === 1) {
                                        toggleTag(filtered[0].id);
                                        setSearch('');
                                    }
                                }}
                                className="w-full pl-8 pr-12 py-3 bg-background border-2 border-foreground font-mono text-[13px] text-foreground placeholder:text-foreground/30 outline-none focus-visible:border-terracotta disabled:opacity-50"
                            />
                            {search.trim() && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-foreground/35 border border-foreground/25 px-1.5 leading-[18px] select-none pointer-events-none">↵</span>
                            )}
                        </div>

                        {/* CREATE row */}
                        {canCreate && (
                            <button
                                type="button"
                                onClick={() => void handleCreate()}
                                disabled={isPending}
                                className="mt-2.5 flex w-full items-center gap-3 px-3 py-2.5 bg-terracotta/[0.08] border-2 border-terracotta font-mono cursor-pointer hover:bg-terracotta/[0.14] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="text-terracotta font-bold text-[15px] leading-none">+</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-terracotta">Create new tag</span>
                                <span className="px-2.5 py-1 bg-terracotta text-background text-[10px] font-bold uppercase"># {search.trim()}</span>
                                <span className="ml-auto text-[9px] tracking-widest text-foreground/40">PRESS ↵</span>
                            </button>
                        )}
                    </div>

                    {/* Section 02: Existing Directory */}
                    <div className="flex flex-col gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-terracotta">
                            EXISTING_DIRECTORY
                            {selectedIds.size > 0 && (
                                <span className="ml-2 text-foreground/40 text-[9px]">{String(selectedIds.size).padStart(2, '0')} SELECTED</span>
                            )}
                        </span>
                        <div className="flex flex-wrap gap-2 min-h-[60px]" role="status" aria-live="polite" aria-atomic="false">
                            {filtered.map(tag => {
                                const isSelected = selectedIds.has(tag.id);
                                return (
                                    <button
                                        key={tag.id}
                                        type="button"
                                        onClick={() => toggleTag(tag.id)}
                                        className={`px-3 py-1.5 font-mono text-[10px] uppercase font-bold border-2 transition-all active:translate-x-[1px] active:translate-y-[1px] ${
                                            isSelected
                                                ? 'bg-terracotta text-background border-terracotta'
                                                : 'bg-transparent text-foreground/60 border-foreground/30 hover:border-foreground'
                                        }`}
                                    >
                                        # {tag.name}
                                    </button>
                                );
                            })}
                            {filtered.length === 0 && (
                                <span className="font-mono text-[10px] text-foreground/30 italic">
                                    NO_TAGS_FOUND
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-[26px] py-5 mt-[22px] border-t-2 border-foreground">
                    <span className="font-mono text-[9px] text-foreground/30 tracking-widest">
                        UID: TAG_PROC_{uid}
                    </span>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-28 px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-widest border-2 border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background transition-colors"
                        >
                            CANCEL
                        </button>
                        <button
                            type="button"
                            onClick={handleApply}
                            disabled={isPending}
                            className={`w-28 px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-widest border-2 transition-all ${
                                isPending
                                    ? 'bg-[rgba(226,114,91,0.18)] text-white/30 border-[rgba(226,114,91,0.30)] cursor-not-allowed'
                                    : 'bg-terracotta text-background border-terracotta hover:bg-background hover:text-terracotta'
                            }`}
                        >
                            {isPending ? 'APPLYING…' : <>APPLY{selectedIds.size > 0 && <span className="ml-2 px-1.5 bg-background text-terracotta leading-[16px]">{selectedIds.size}</span>}</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
