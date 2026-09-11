'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import RowActionIcons from './RowActionIcons';
import InlineDeleteConfirm from './InlineDeleteConfirm';
import { useCloseOnNavigate } from './useCloseOnNavigate';

interface Props {
    tag: { id: string; name: string };
    username: string;
    onRename: (tagId: string, newName: string) => void;
    onDelete: (tagId: string) => void;
}

export default function SavedTagPill({ tag, username, onRename, onDelete }: Props) {
    const [mode, setMode] = useState<'idle' | 'editing' | 'confirm-delete'>('idle');
    const [value, setValue] = useState(tag.name);
    const [actionsOpen, setActionsOpen] = useState(false);
    const router = useRouter();
    useCloseOnNavigate(() => { setActionsOpen(false); setMode('idle'); });

    if (mode === 'editing') {
        return (
            <input
                autoFocus
                value={value}
                onChange={e => setValue(e.target.value)}
                onBlur={() => {
                    setMode('idle');
                    if (value.trim() && value.trim() !== tag.name) onRename(tag.id, value);
                }}
                onKeyDown={e => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                    if (e.key === 'Escape') { setValue(tag.name); setMode('idle'); }
                }}
                aria-label={`Rename tag ${tag.name}`}
                className="text-[9.5px] uppercase tracking-widest px-2.5 py-1.5 border border-terracotta bg-terracotta/10 text-terracotta font-bold w-28"
            />
        );
    }

    if (mode === 'confirm-delete') {
        return (
            <span className="flex items-center px-2.5 py-1.5 border border-terracotta">
                <InlineDeleteConfirm
                    label={tag.name}
                    onCancel={() => setMode('idle')}
                    onConfirm={() => onDelete(tag.id)}
                />
            </span>
        );
    }

    // The rename/delete cluster is an ABSOLUTE overlay pinned to the pill's
    // right edge — never an inline child. Revealing it inline on hover grew the
    // pill, which in the wrapped flex row made the pill wrap under the cursor,
    // un-hovering itself → shrink → re-hover → infinite flicker. Positioned
    // absolutely, the pill's box never changes, so there is no reflow.
    return (
        <span className="group/tag relative inline-flex items-center border border-foreground/40 hover:border-foreground transition-colors">
            <button
                type="button"
                onClick={() => router.push(`/u/${username}/saved?tag=${encodeURIComponent(tag.name)}`)}
                className="text-[9.5px] uppercase tracking-widest px-2.5 py-1.5 bg-transparent border-0 text-foreground hover:bg-foreground hover:text-background transition-colors"
            >
                {tag.name}
            </button>
            <button
                type="button"
                onClick={() => setActionsOpen(v => !v)}
                aria-label={actionsOpen ? `Hide actions for tag ${tag.name}` : `Show actions for tag ${tag.name}`}
                aria-expanded={actionsOpen}
                className="shrink-0 bg-transparent border-0 p-0 pr-1 text-foreground/40 hover:text-terracotta font-mono text-xs leading-none pointer-fine:hidden"
            >
                ⋮
            </button>
            <RowActionIcons
                onRename={() => { setValue(tag.name); setMode('editing'); }}
                onDeleteClick={() => setMode('confirm-delete')}
                renameLabel={`Rename tag ${tag.name}`}
                deleteLabel={`Delete tag ${tag.name}`}
                className={`absolute left-full top-0 z-10 -ml-px h-full border border-foreground bg-background px-1.5 ${actionsOpen ? 'flex' : 'hidden'} group-hover/tag:flex group-focus-within/tag:flex`}
            />
        </span>
    );
}
