'use client';

import { useState, useTransition, useCallback } from 'react';
import { saveFeedItem, unsaveFeedItem } from '@/app/actions/feed-items';
import { Bookmark } from '@/components/icons/Bookmark';
import AssignTagsModal from '@/components/AssignTagsModal';

type TagVM = { id: string; name: string };

type Props = {
    itemId: string;
    allTags: TagVM[];
};

export default function FrontPageItemActions({ itemId, allTags }: Props) {
    const [saved, setSaved] = useState(false);
    const [tags, setTags] = useState<TagVM[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [, startTransition] = useTransition();

    function handleSave() {
        const next = !saved;
        setSaved(next);
        startTransition(async () => {
            if (next) await saveFeedItem(itemId);
            else await unsaveFeedItem(itemId);
        });
    }

    const handleTagsApplied = useCallback((_id: string, newTags: TagVM[]) => {
        setTags(newTags);
    }, []);

    return (
        <div className="inline-flex items-center gap-2">
            {tags.length > 0 && (
                <span className="inline-flex gap-1">
                    {tags.map(tag => (
                        <span
                            key={tag.id}
                            className="font-mono text-[9px] uppercase border border-current text-terracotta px-1 py-0.5 leading-none"
                        >
                            #{tag.name}
                        </span>
                    ))}
                </span>
            )}
            <button
                type="button"
                onClick={handleSave}
                aria-label={saved ? 'Remove from saved' : 'Save'}
                title={saved ? 'Remove from saved' : 'Save'}
                className="bg-transparent border-0 px-0 py-0 cursor-pointer leading-none"
            >
                <Bookmark
                    filled={saved}
                    size={12}
                    className={saved ? 'text-terracotta' : 'text-foreground/40 hover:text-terracotta'}
                />
            </button>
            <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="bg-transparent border border-current font-mono text-[9px] font-bold uppercase text-foreground/30 hover:text-foreground px-1 py-0.5 cursor-pointer leading-none transition-colors whitespace-nowrap"
            >
                + TAG
            </button>
            {modalOpen && (
                <AssignTagsModal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    itemId={itemId}
                    initialTags={tags}
                    allTags={allTags}
                    onTagsApplied={handleTagsApplied}
                />
            )}
        </div>
    );
}
