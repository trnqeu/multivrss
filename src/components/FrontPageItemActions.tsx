'use client';

import { useState, useTransition, useCallback } from 'react';
import Link from 'next/link';
import { saveFeedItem, unsaveFeedItem } from '@/app/actions/feed-items';
import { Bookmark } from '@/components/icons/Bookmark';
import { TagIcon } from '@/components/icons/Tag';
import { Reader } from '@/components/icons/Reader';
import AssignTagsModal from '@/components/AssignTagsModal';
import { useCloseOnNavigate } from '@/components/useCloseOnNavigate';
import { useReadQueue } from '@/lib/useReadQueue';

type TagVM = { id: string; name: string };

type Props = {
    itemId: string;
    allTags: TagVM[];
    username: string;
};

export default function FrontPageItemActions({ itemId, allTags, username }: Props) {
    const [saved, setSaved] = useState(false);
    const [tags, setTags] = useState<TagVM[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [, startTransition] = useTransition();
    useCloseOnNavigate(() => setModalOpen(false));
    const { queueRead } = useReadQueue();

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
                    size={13}
                    className={saved ? 'text-terracotta' : 'text-foreground/40 hover:text-terracotta'}
                />
            </button>
            <button
                type="button"
                onClick={() => setModalOpen(true)}
                aria-label="Assign tags"
                title="+ TAG"
                className="bg-transparent border-0 px-0 py-0 cursor-pointer leading-none"
            >
                <TagIcon size={13} className="text-foreground/40 hover:text-terracotta" />
            </button>
            <Link
                href={`/u/${username}/read/${itemId}`}
                prefetch={false}
                onClick={() => queueRead(itemId)}
                aria-label="Read"
                title="Read"
                className="inline-flex items-center bg-terracotta text-background px-2 py-1.5 leading-none"
            >
                <Reader size={13} />
            </Link>
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
