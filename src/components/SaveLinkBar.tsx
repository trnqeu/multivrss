'use client';
import { useActionState, useEffect, useRef, useState } from 'react';
import { saveExternalLink, updateSavedLinkDetails, type SavedLinkData } from '@/app/actions/saved-links';
import type { TagData } from '@/app/actions/tags';
import AssignTagsModal from '@/components/AssignTagsModal';
import { Bookmark } from '@/components/icons/Bookmark';

interface SaveLinkBarProps {
    tags: TagData[];
    onSaved?: (link: SavedLinkData) => void;
    onDetailsSaved?: (linkId: string, title: string | null, tags: TagData[]) => void;
}

export default function SaveLinkBar({ tags, onSaved, onDetailsSaved }: SaveLinkBarProps) {
    const [state, formAction, pending] = useActionState(saveExternalLink, null);
    const [url, setUrl] = useState('');
    const [editingLink, setEditingLink] = useState<SavedLinkData | null>(null);
    const [titleDraft, setTitleDraft] = useState('');
    const formRef = useRef<HTMLFormElement>(null);
    const valid = (() => { try { new URL(url); return true; } catch { return false; } })();

    useEffect(() => {
        if (state?.success && state.link) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setUrl('');
            formRef.current?.reset();
            onSaved?.(state.link);
            setEditingLink(state.link);
            setTitleDraft(state.link.title ?? '');
        }
    }, [state, onSaved]);

    return (
        <>
            <form ref={formRef} action={formAction}
                className="flex items-stretch border-2 bg-background transition-colors border-foreground/15">
                <span className="flex items-center px-3 border-r border-foreground/15">
                    <span className="label-system text-[9.5px] text-terracotta">PASTE_URL_</span>
                </span>
                <label htmlFor="slb-url" className="sr-only">URL to save</label>
                <input id="slb-url" name="url" value={url} onChange={e => setUrl(e.target.value)} inputMode="url"
                    placeholder="https://…  paste a link, press enter"
                    className="flex-1 bg-transparent px-3.5 py-3 font-mono text-xs text-foreground placeholder:text-foreground/40" />
                <button type="submit" disabled={!valid || pending}
                    className="flex items-center gap-2 px-4 label-system text-[10px] font-extrabold transition-all
                        disabled:bg-terracotta/20 disabled:text-foreground/40
                        enabled:bg-terracotta enabled:text-background">
                    <Bookmark filled size={11} /> {pending ? 'SAVING' : 'SAVE'}
                </button>
            </form>
            {editingLink && (
                <AssignTagsModal
                    open
                    onClose={() => setEditingLink(null)}
                    itemId={editingLink.id}
                    initialTags={[]}
                    allTags={tags}
                    heading="EDIT_SAVED_LINK"
                    titleField={{ value: titleDraft, onChange: setTitleDraft }}
                    onSave={(id, tagIds, title) => updateSavedLinkDetails(id, title ?? '', tagIds)}
                    onTagsApplied={(id, appliedTags) => {
                        onDetailsSaved?.(id, titleDraft.trim() || null, appliedTags);
                        setEditingLink(null);
                    }}
                />
            )}
        </>
    );
}
