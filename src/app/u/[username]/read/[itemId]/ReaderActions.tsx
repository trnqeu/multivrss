'use client';

import { useEffect, useState } from 'react';
import { saveFeedItem, unsaveFeedItem, type ReaderItemKind } from '@/app/actions/feed-items';
import { setSavedLinkTags } from '@/app/actions/tags';
import { Bookmark } from '@/components/icons/Bookmark';
import { TagIcon } from '@/components/icons/Tag';
import AssignTagsModal from '@/components/AssignTagsModal';
import { useCloseOnNavigate } from '@/components/useCloseOnNavigate';

interface TagVM {
    id: string;
    name: string;
}

interface ReaderActionsProps {
    itemId: string;
    itemKind: ReaderItemKind;
    initialSaved: boolean;
    initialTags: TagVM[];
    allTags: TagVM[];
}

// Save/tag controls for Reader Mode. Mirrors the toggle pattern in FeedItem.tsx
// (same actions, same AssignTagsModal) but lives in the reader header instead
// of a feed row.
//
// The save/bookmark toggle only applies to `feedItem`: it means "add this feed
// article to the saved list" and can be undone. A `savedLink` is inherently
// saved (that's the only reason it exists) — there is no unsaved state to
// toggle back to, so that control is hidden for it, matching SearchBar.tsx and
// SavedView.tsx, which hide the same toggle for saved links.
export function ReaderActions({ itemId, itemKind, initialSaved, initialTags, allTags }: ReaderActionsProps) {
    const [isSaved, setIsSaved] = useState(initialSaved);
    const [tags, setTags] = useState<TagVM[]>(initialTags);
    const [modalOpen, setModalOpen] = useState(false);
    const [announcement, setAnnouncement] = useState('');
    useCloseOnNavigate(() => setModalOpen(false));

    useEffect(() => {
        if (!announcement) return;
        const timer = setTimeout(() => setAnnouncement(''), 3000);
        return () => clearTimeout(timer);
    }, [announcement]);

    async function handleSaveToggle() {
        if (isSaved) {
            setIsSaved(false);
            setAnnouncement('Removed from saved.');
            await unsaveFeedItem(itemId);
        } else {
            setIsSaved(true);
            setAnnouncement('Saved.');
            await saveFeedItem(itemId);
        }
    }

    return (
        <div className="flex items-center gap-2">
            {itemKind === 'feedItem' && (
                <button
                    type="button"
                    onClick={handleSaveToggle}
                    aria-label={isSaved ? 'Remove article from saved' : 'Save article'}
                    title={isSaved ? 'Remove from saved' : 'Save'}
                    className={`flex items-center gap-1.5 px-3 py-2 border border-foreground font-mono text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer ${
                        isSaved
                            ? 'bg-terracotta text-background border-terracotta'
                            : 'hover:bg-foreground hover:text-background'
                    }`}
                >
                    <Bookmark filled={isSaved} size={12} />
                    {isSaved ? 'Saved' : 'Save'}
                </button>
            )}
            <button
                type="button"
                onClick={() => setModalOpen(true)}
                aria-label="Assign tags to this item"
                title="Assign tags"
                className="flex items-center gap-1.5 px-3 py-2 border border-foreground font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors cursor-pointer"
            >
                <TagIcon size={12} />
                {tags.length > 0 ? `Tags (${tags.length})` : 'Tag'}
            </button>
            {tags.length > 0 && (
                <span className="hidden md:inline-flex gap-1">
                    {tags.map(tag => (
                        <span
                            key={tag.id}
                            className="font-mono text-[10px] uppercase border border-terracotta/55 text-terracotta px-1.5 py-1 leading-none"
                        >
                            #{tag.name}
                        </span>
                    ))}
                </span>
            )}
            <p role="status" aria-live="polite" className="sr-only">
                {announcement}
            </p>
            {modalOpen && (
                <AssignTagsModal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    itemId={itemId}
                    initialTags={tags}
                    allTags={allTags}
                    onSave={itemKind === 'savedLink' ? setSavedLinkTags : undefined}
                    onTagsApplied={(_id, newTags) => setTags(newTags)}
                />
            )}
        </div>
    );
}
