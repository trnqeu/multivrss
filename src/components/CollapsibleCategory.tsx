'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import RenameFeedTitle from './RenameFeedTitle';
import RenameCategoryTitle from './RenameCategoryTitle';
import RowActionIcons from './RowActionIcons';
import InlineDeleteConfirm from './InlineDeleteConfirm';
import EditSourceForm from './EditSourceForm';
import { deleteCategory, deleteFeedSource } from '@/app/actions';

type SourceData = {
    id: string;
    title: string | null;
    slug: string;
    categoryId: string;
    lastSync: Date | null;
};

type Props = {
    category: {
        id: string;
        name: string;
        sources: SourceData[];
    };
    allCategories: { id: string; name: string }[];
    isOpen: boolean;
    onToggle: () => void;
    username: string;
};

export default function CollapsibleCategory({ category, allCategories, isOpen, onToggle, username }: Props) {
    const [catEditing, setCatEditing] = useState(false);
    const [catDeleteMode, setCatDeleteMode] = useState<'idle' | 'confirm' | 'pick-destination'>('idle');
    const [catActionsOpen, setCatActionsOpen] = useState(false);
    const [confirmingSourceId, setConfirmingSourceId] = useState<string | null>(null);
    const [revealedSourceId, setRevealedSourceId] = useState<string | null>(null);
    const [editSource, setEditSource] = useState<SourceData | null>(null);
    const searchParams = useSearchParams();

    const otherCategories = allCategories.filter(c => c.id !== category.id);
    const sourceCount = category.sources.length;
    const isActive = searchParams.get('view') === 'river' && searchParams.get('cat') === category.name;

    function handleDeleteCategory(moveToId?: string) {
        deleteCategory(category.id, moveToId);
        setCatDeleteMode('idle');
    }

    return (
        <div className="flex flex-col gap-1">
            <div
                className={`group/sbc flex items-center gap-2 px-1 py-[6px] border-t border-foreground/[0.08] transition-colors ${isActive ? 'bg-[var(--tc-soft)]' : 'hover:bg-[var(--tc-soft)]'}`}
            >
                {catDeleteMode === 'idle' && (
                    <>
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                            <RenameCategoryTitle
                                categoryId={category.id}
                                name={category.name}
                                username={username}
                                editing={catEditing}
                                onDone={() => setCatEditing(false)}
                                active={isActive}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => setCatActionsOpen(v => !v)}
                            aria-label={catActionsOpen ? `Hide actions for ${category.name}` : `Show actions for ${category.name}`}
                            aria-expanded={catActionsOpen}
                            className="shrink-0 bg-transparent border-0 p-0 text-foreground/40 hover:text-terracotta font-mono text-xs leading-none pointer-fine:hidden"
                        >
                            ⋮
                        </button>
                        <RowActionIcons
                            onRename={() => setCatEditing(true)}
                            onDeleteClick={() => setCatDeleteMode(
                                sourceCount > 0 && otherCategories.length > 0 ? 'pick-destination' : 'confirm'
                            )}
                            renameLabel={`Rename ${category.name}`}
                            deleteLabel={`Delete ${category.name}`}
                            className={`${catActionsOpen ? 'flex' : 'hidden'} group-hover/sbc:flex group-focus-within/sbc:flex`}
                        />
                        <span className="font-mono text-[9px] text-foreground/25 shrink-0">
                            {sourceCount.toString().padStart(2, '0')}
                        </span>
                        <span
                            aria-hidden="true"
                            className={`font-mono text-[11px] transition-opacity shrink-0 ${isActive ? 'opacity-100 text-terracotta' : 'opacity-0 group-hover/sbc:opacity-100 text-terracotta'}`}
                        >
                            →
                        </span>
                        <button
                            type="button"
                            onClick={onToggle}
                            aria-expanded={isOpen}
                            aria-label={isOpen ? `Close ${category.name}` : `Open ${category.name}`}
                            className="w-[18px] h-[18px] border border-foreground/25 text-foreground/45 bg-background inline-flex items-center justify-center font-mono text-xs font-extrabold leading-none shrink-0 hover:border-terracotta hover:text-terracotta transition-colors"
                        >
                            {isOpen ? '–' : '+'}
                        </button>
                    </>
                )}

                {catDeleteMode === 'confirm' && (
                    <InlineDeleteConfirm
                        label={category.name}
                        onCancel={() => setCatDeleteMode('idle')}
                        onConfirm={() => handleDeleteCategory()}
                    />
                )}

                {catDeleteMode === 'pick-destination' && (
                    <div className="flex items-center gap-1.5 flex-1 min-w-0 font-mono text-[9px] overflow-x-auto">
                        <span className="text-foreground/50 uppercase tracking-wider shrink-0">Move {sourceCount} to:</span>
                        {otherCategories.map(cat => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="px-2 py-1 border border-foreground/30 uppercase tracking-wider font-bold text-foreground/70 hover:border-terracotta hover:text-terracotta shrink-0"
                            >
                                {cat.name}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => handleDeleteCategory()}
                            className="px-2 py-1 border border-terracotta uppercase tracking-wider font-bold text-terracotta hover:bg-terracotta hover:text-background shrink-0"
                        >
                            Unsorted
                        </button>
                        <button
                            type="button"
                            onClick={() => setCatDeleteMode('idle')}
                            className="ml-auto px-1 text-foreground/40 hover:text-foreground shrink-0 uppercase tracking-wider font-bold"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>

            {isOpen && (
                <ul className="flex flex-col gap-2">
                    {category.sources.map((source) => (
                        <li key={source.id} className="group flex items-center gap-1">
                            {confirmingSourceId === source.id ? (
                                <InlineDeleteConfirm
                                    label={source.title ?? source.slug}
                                    onCancel={() => setConfirmingSourceId(null)}
                                    onConfirm={() => { deleteFeedSource(source.id); setConfirmingSourceId(null); }}
                                />
                            ) : (
                                <>
                                    <RenameFeedTitle
                                        sourceId={source.id}
                                        title={source.title ?? source.slug}
                                        username={username}
                                        editing={false}
                                        onDone={() => {}}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setRevealedSourceId(v => v === source.id ? null : source.id)}
                                        aria-label={revealedSourceId === source.id ? `Hide actions for ${source.title ?? source.slug}` : `Show actions for ${source.title ?? source.slug}`}
                                        aria-expanded={revealedSourceId === source.id}
                                        className="shrink-0 bg-transparent border-0 p-0 text-foreground/40 hover:text-terracotta font-mono text-xs leading-none pointer-fine:hidden"
                                    >
                                        ⋮
                                    </button>
                                    <RowActionIcons
                                        onRename={() => setEditSource(source)}
                                        onDeleteClick={() => setConfirmingSourceId(source.id)}
                                        renameLabel={`Edit ${source.title ?? source.slug}`}
                                        deleteLabel={`Delete ${source.title ?? source.slug}`}
                                        className={`${revealedSourceId === source.id ? 'flex' : 'hidden'} group-hover:flex group-focus-within:flex`}
                                    />
                                    {!source.lastSync && (
                                        <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-terracotta/70 ml-auto animate-pulse shrink-0">
                                            PENDING
                                        </span>
                                    )}
                                </>
                            )}
                        </li>
                    ))}
                    {category.sources.length === 0 && (
                        <span className="label-system text-[9px] opacity-20 italic">Empty_Slot</span>
                    )}
                </ul>
            )}

            {editSource && (
                <EditSourceForm
                    key={editSource.id}
                    source={editSource}
                    categories={allCategories}
                    open={true}
                    onClose={() => setEditSource(null)}
                />
            )}
        </div>
    );
}
