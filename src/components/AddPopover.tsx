"use client";

import { useRef, useState, useEffect, useCallback, useTransition } from "react";
import { useActionState } from "react";
import AddFeedForm from "./AddFeedForm";
import { saveExternalLink } from "@/app/actions";
import { Bookmark } from "./icons/Bookmark";
import type { Category } from "@prisma/client";

interface Props {
    categories: Category[];
}

const URL_RE = /^https?:\/\/.+\..+/;

export default function AddPopover({ categories }: Props) {
    const [open, setOpen] = useState(false);
    const [url, setUrl] = useState("");
    const [showFeedModal, setShowFeedModal] = useState(false);
    const [feedInitialUrl, setFeedInitialUrl] = useState("");

    const buttonRef = useRef<HTMLButtonElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const [saveState, saveAction, isSaving] = useActionState(saveExternalLink, null);
    const [, startTransition] = useTransition();

    const close = useCallback(() => {
        setOpen(false);
        setUrl("");
    }, []);

    // Focus input when popover opens
    useEffect(() => {
        if (open) inputRef.current?.focus();
    }, [open]);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        function onPointerDown(e: PointerEvent) {
            const target = e.target as Node;
            if (!popoverRef.current?.contains(target) && !buttonRef.current?.contains(target)) {
                close();
            }
        }
        document.addEventListener("pointerdown", onPointerDown);
        return () => document.removeEventListener("pointerdown", onPointerDown);
    }, [open, close]);

    // Close on Esc
    useEffect(() => {
        if (!open) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") close();
        }
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open, close]);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { if (saveState?.success) close(); }, [saveState?.success, close]);

    function handleFollowSource() {
        setFeedInitialUrl(url);
        setOpen(false);
        setUrl("");
        setShowFeedModal(true);
    }

    function handleSaveLink() {
        if (!URL_RE.test(url)) return;
        const formData = new FormData();
        formData.set("url", url);
        startTransition(() => saveAction(formData));
    }

    const urlValid = URL_RE.test(url);

    return (
        <>
            {/* Trigger button */}
            <div className="relative">
                <button
                    ref={buttonRef}
                    onClick={() => setOpen(v => !v)}
                    aria-expanded={open}
                    aria-haspopup="dialog"
                    className="flex items-center gap-[7px] bg-background text-foreground border-2 border-foreground font-mono text-[11px] font-extrabold tracking-[0.12em] uppercase px-[13px] py-[9px] hover:bg-foreground hover:text-background transition-colors"
                >
                    <span className="text-terracotta">+</span>
                    <span>ADD</span>
                    <span className="text-[9px]">▾</span>
                </button>

                {/* Popover */}
                {open && (
                    <div
                        ref={popoverRef}
                        role="dialog"
                        aria-label="Add a link"
                        className="fixed left-4 right-4 top-16 md:absolute md:left-auto md:right-0 md:top-full md:mt-2 md:w-[340px] border-2 border-black bg-white z-50"
                    >
                        {/* Header */}
                        <div className="font-mono text-[9.5px] font-extrabold tracking-[0.16em] uppercase text-black/30 px-[13px] py-[10px] border-b border-black/12">
                            PASTE A LINK
                        </div>

                        {/* Paste field */}
                        <div className="m-3 flex items-center gap-2 border border-black bg-[#f6f3ec] px-3 py-[10px]">
                            <span className="text-terracotta font-extrabold text-[13px] select-none">›</span>
                            <label htmlFor="addpop-url" className="sr-only">URL</label>
                            <input
                                id="addpop-url"
                                ref={inputRef}
                                type="url"
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                                placeholder="https://…"
                                className="flex-1 bg-transparent font-mono text-[11px] text-black placeholder:text-black/30 border-none outline-none"
                            />
                        </div>

                        {/* Choices */}
                        <div role="group" aria-label="Choose action">
                            {/* Follow as source */}
                            <button
                                onClick={handleFollowSource}
                                disabled={!urlValid}
                                className="flex items-start gap-3 w-full px-[13px] py-3 border-t border-black/12 bg-white hover:bg-[#f6f3ec] text-left disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <div className="w-7 h-7 shrink-0 border-2 border-black flex items-center justify-center font-mono text-[14px] font-bold">
                                    +
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[13px] font-extrabold text-black">Follow as source</span>
                                    <span className="text-[11px] text-black/55 leading-[1.4]">Get every new post in your stream.</span>
                                </div>
                            </button>

                            {/* Save the link */}
                            <button
                                onClick={handleSaveLink}
                                disabled={!urlValid || isSaving}
                                className="flex items-start gap-3 w-full px-[13px] py-3 border-t border-black/12 bg-white hover:bg-[#f6f3ec] text-left disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <div className="w-7 h-7 shrink-0 bg-terracotta flex items-center justify-center text-black">
                                    <Bookmark size={13} />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[13px] font-extrabold text-black">
                                        {isSaving ? "Saving…" : "Save the link"}
                                    </span>
                                    <span className="text-[11px] text-black/55 leading-[1.4]">Drop it in Saved, to read once.</span>
                                </div>
                            </button>
                        </div>

                        {/* Inline error */}
                        {saveState && !saveState.success && saveState.message && (
                            <p role="alert" className="font-mono text-[10px] text-terracotta px-[13px] pb-3">
                                {saveState.message}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Feed modal — opened after choosing "Follow as source" */}
            <AddFeedForm
                categories={categories}
                open={showFeedModal}
                onClose={() => setShowFeedModal(false)}
                initialUrl={feedInitialUrl}
            />
        </>
    );
}
