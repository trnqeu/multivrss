'use client';

import { useState } from 'react';
import RenameFeedTitle from './RenameFeedTitle';
import RenameCategoryTitle from './RenameCategoryTitle';
import ThreeDotMenu from './ThreeDotMenu';
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
    const [menuMode, setMenuMode] = useState<'main' | 'delete-pick'>('main');
    const [editSource, setEditSource] = useState<SourceData | null>(null);

    const otherCategories = allCategories.filter(c => c.id !== category.id);
    const sourceCount = category.sources.length;

    function handleDeleteCategory(moveToId?: string) {
        const label = moveToId
            ? `"${allCategories.find(c => c.id === moveToId)?.name}"`
            : 'UNSORTED';
        if (confirm(`DELETE_CATEGORY "${category.name}"? Sources will move to ${label}.`)) {
            deleteCategory(category.id, moveToId);
        }
    }

    function getCategoryItems() {
        if (sourceCount > 0 && otherCategories.length > 0 && menuMode === 'delete-pick') {
            return [
                { label: '← BACK', onClick: () => setMenuMode('main') },
                ...otherCategories.map(cat => ({
                    label: cat.name,
                    onClick: () => handleDeleteCategory(cat.id)
                })),
                { label: 'UNSORTED (delete)', danger: true as const, onClick: () => handleDeleteCategory() },
            ];
        }
        const items: { label: string; onClick: () => void; danger?: boolean }[] = [
            { label: 'Rename', onClick: () => setCatEditing(true) },
        ];
        if (sourceCount > 0 && otherCategories.length > 0) {
            items.push({ label: 'Delete', danger: true as const, onClick: () => setMenuMode('delete-pick') });
        } else {
            items.push({ label: 'Delete', danger: true as const, onClick: () => handleDeleteCategory() });
        }
        return items;
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="group flex items-center justify-between border-b-2 border-terracotta pb-2 gap-2">
                <div className="flex items-baseline gap-0.5 flex-1 min-w-0">
                    <ThreeDotMenu items={getCategoryItems()} />
                    <RenameCategoryTitle
                        categoryId={category.id}
                        name={category.name}
                        username={username}
                        editing={catEditing}
                        onDone={() => setCatEditing(false)}
                    />
                    <span className="font-mono text-[10px] font-bold text-foreground/40 tracking-wider shrink-0">
                        {sourceCount.toString().padStart(2, '0')}
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
                        <li key={source.id} className="group flex items-center gap-0.5">
                            <ThreeDotMenu items={[
                                { label: 'Edit', onClick: () => setEditSource(source) },
                                { label: 'Delete', danger: true as const, onClick: () => {
                                    if (confirm('REMOVE_SOURCE?')) deleteFeedSource(source.id);
                                }},
                            ]} />
                            <RenameFeedTitle
                                sourceId={source.id}
                                title={source.title ?? ''}
                                username={username}
                                editing={false}
                                onDone={() => {}}
                            />
                            {!source.lastSync && (
                                <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-terracotta/70 ml-auto animate-pulse shrink-0">
                                    PENDING
                                </span>
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
