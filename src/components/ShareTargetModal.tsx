"use client";

import { useEffect, useState, useTransition, useActionState } from "react";
import AddFeedForm from "./AddFeedForm";
import AssignTagsModal from "./AssignTagsModal";
import { saveExternalLink, setSavedLinkTags, SaveExternalLinkState, TagData } from "@/app/actions";
import type { Category } from "@prisma/client";

interface Props {
    categories: Category[];
    tags: TagData[];
    url: string;
    title: string;
    onClose: () => void;
}

const initialState: SaveExternalLinkState = { success: false };

export default function ShareTargetModal({ categories, tags, url, title, onClose }: Props) {
    const [showFeedModal, setShowFeedModal] = useState(false);
    const [savedLinkId, setSavedLinkId] = useState<string | null>(null);
    const [saveState, saveAction, isSaving] = useActionState(saveExternalLink, initialState);
    const [, startTransition] = useTransition();

    useEffect(() => {
        if (saveState?.success && saveState.link) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSavedLinkId(saveState.link.id);
        }
    }, [saveState]);

    function handleFollow() {
        setShowFeedModal(true);
    }

    function handleSave() {
        const formData = new FormData();
        formData.set("url", url);
        if (title) formData.set("title", title);
        startTransition(() => saveAction(formData));
    }

    if (showFeedModal) {
        return (
            <AddFeedForm
                categories={categories}
                open
                onClose={onClose}
                initialUrl={url}
            />
        );
    }

    if (savedLinkId) {
        return (
            <AssignTagsModal
                open
                onClose={onClose}
                itemId={savedLinkId}
                initialTags={[]}
                allTags={tags}
                onSave={setSavedLinkTags}
                onTagsApplied={onClose}
            />
        );
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
            style={{ backgroundColor: "rgba(0,0,0,0.70)" }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="w-full max-w-lg border-2 border-foreground bg-background">
                <div className="flex items-center justify-between px-[22px] py-[22px] border-b-2 border-foreground">
                    <div className="flex flex-col gap-1 min-w-0">
                        <span className="label-system font-mono text-[10px] uppercase tracking-widest text-terracotta">
                            SHARED_LINK
                        </span>
                        <h2
                            className="font-bold text-foreground text-[18px] break-all"
                            style={{ textTransform: "none", letterSpacing: "normal" }}
                        >
                            {title || url}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="w-9 h-9 shrink-0 flex items-center justify-center bg-transparent border border-white/40 text-foreground text-xl leading-none normal-case tracking-normal hover:border-foreground hover:bg-transparent transition-colors"
                    >
                        ×
                    </button>
                </div>

                <div role="group" aria-label="Choose action" className="flex flex-col divide-y divide-white/10">
                    <button
                        type="button"
                        onClick={handleFollow}
                        className="flex items-start gap-3 w-full px-[22px] py-5 bg-transparent hover:bg-white/5 text-left transition-colors"
                    >
                        <div className="w-8 h-8 shrink-0 border-2 border-foreground flex items-center justify-center font-mono text-[16px] font-bold">
                            +
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[14px] font-bold text-foreground">Follow as source</span>
                            <span className="text-[12px] text-white/55">Get every new post from this feed in your stream.</span>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-start gap-3 w-full px-[22px] py-5 bg-transparent hover:bg-white/5 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="w-8 h-8 shrink-0 bg-terracotta flex items-center justify-center text-background font-mono text-[14px] font-bold">
                            ↓
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[14px] font-bold text-foreground">
                                {isSaving ? "Saving…" : "Save the link"}
                            </span>
                            <span className="text-[12px] text-white/55">Drop it in Saved, to read later.</span>
                        </div>
                    </button>
                </div>

                {saveState && !saveState.success && saveState.message && (
                    <p role="alert" className="font-mono text-[11px] text-terracotta px-[22px] pb-4">
                        {saveState.message}
                    </p>
                )}
            </div>
        </div>
    );
}
