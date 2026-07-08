'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
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
    const searchParams = useSearchParams();

    const otherCategories = allCategories.filter(c => c.id !== category.id);
    const sourceCount = category.sources.length;
    const isActive = searchParams.get('view') === 'river' && searchParams.get('cat') === category.name;

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
        <div className="flex flex-col gap-1">
            <div
                className={`group/sbc flex items-center gap-2 px-1 py-[6px] border-t border-foreground/[0.08] transition-colors ${isActive ? 'bg-[var(--tc-soft)]' : 'hover:bg-[var(--tc-soft)]'}`}
            >
                <div className="flex items-center gap-1 flex-1 min-w-0">
                    <ThreeDotMenu items={getCategoryItems()} />
                    <RenameCategoryTitle
                        categoryId={category.id}
                        name={category.name}
                        username={username}
                        editing={catEditing}
                        onDone={() => setCatEditing(false)}
                        active={isActive}
                    />
                </div>
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
                    aria-label={isOpen ? `Chiudi ${category.name}` : `Apri ${category.name}`}
                    className="w-[18px] h-[18px] border border-foreground/25 text-foreground/45 bg-background inline-flex items-center justify-center font-mono text-xs font-extrabold leading-none shrink-0 hover:border-terracotta hover:text-terracotta transition-colors"
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
                                title={source.title ?? source.slug}
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
