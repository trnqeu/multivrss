"use client";

import { useActionState, useState, useEffect, useRef, useCallback } from "react";
import { updateFeedSource, ActionState } from "@/app/actions";

interface Props {
    source: {
        id: string;
        title: string | null;
        slug: string;
        categoryId: string;
    };
    categories: { id: string; name: string }[];
    open: boolean;
    onClose: () => void;
}

const initialState: ActionState = { success: false };

export default function EditSourceForm({ source, categories, open, onClose }: Props) {
    const [state, formAction, isPending] = useActionState(updateFeedSource, initialState);

    const [title, setTitle] = useState(source.title ?? source.slug);
    const [pickedCategoryId, setPickedCategoryId] = useState(source.categoryId);
    const [creatingNew, setCreatingNew] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const newCatInputRef = useRef<HTMLInputElement>(null);

    // Close on success
    useEffect(() => {
        if (state?.success) {
            onClose();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state?.success]);

    // ESC to dismiss
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
    }, [onClose]);

    useEffect(() => {
        if (!open) return;
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, handleKeyDown]);

    // Close dropdown on outside click
    useEffect(() => {
        if (!dropdownOpen) return;
        function onOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", onOutside);
        return () => document.removeEventListener("mousedown", onOutside);
    }, [dropdownOpen]);

    // Autofocus when entering create-new mode
    useEffect(() => {
        if (creatingNew) newCatInputRef.current?.focus();
    }, [creatingNew]);

    if (!open) return null;

    const categoryReady = creatingNew
        ? newCategoryName.trim().length > 0
        : pickedCategoryId !== "";
    const canSubmit = title.trim().length > 0 && categoryReady && !isPending;

    const pickedCategory = categories.find(c => c.id === pickedCategoryId);

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
            style={{ backgroundColor: "rgba(0,0,0,0.70)" }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="w-full max-w-2xl border-2 border-foreground bg-background">

                {/* ── Header ── */}
                <div className="flex items-center justify-between px-[22px] py-[22px] border-b-2 border-foreground">
                    <div className="flex flex-col gap-1">
                        <span className="label-system font-mono text-[10px] uppercase tracking-widest text-terracotta">
                            EDIT_SOURCE
                        </span>
                        <h2
                            className="font-bold text-foreground text-[22px]"
                            style={{ textTransform: "none", letterSpacing: "normal" }}
                        >
                            Edit feed source
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="w-9 h-9 flex items-center justify-center bg-transparent border border-white/40 text-foreground text-xl leading-none normal-case tracking-normal hover:border-foreground hover:bg-transparent transition-colors"
                    >
                        ×
                    </button>
                </div>

                {/* ── Body ── */}
                <form action={formAction} className="px-[26px] pt-[26px] flex flex-col gap-[22px]">
                    <input type="hidden" name="sourceId" value={source.id} />
                    <input type="hidden" name="categoryId" value={creatingNew ? "" : pickedCategoryId} />
                    <input type="hidden" name="newCategoryName" value={creatingNew ? newCategoryName : ""} />

                    {/* Field 1 — Title */}
                    <div className="flex flex-col gap-2">
                        <div className="label-system font-mono text-[10px] uppercase tracking-widest">
                            <span className="text-terracotta">01</span>
                            <span className="text-foreground">&nbsp;&nbsp;TITLE</span>
                        </div>
                        <input
                            name="title"
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Feed title…"
                            required
                            disabled={isPending}
                            className="w-full px-4 py-3 bg-transparent font-mono text-[13px] text-foreground placeholder:text-white/25 border-2 border-foreground outline-none transition-colors"
                        />
                    </div>

                    {/* Field 2 — Category */}
                    <div className="flex flex-col gap-2">
                        <div className="label-system font-mono text-[10px] uppercase tracking-widest">
                            <span className="text-terracotta">02</span>
                            <span className="text-foreground">&nbsp;&nbsp;CATEGORY</span>
                        </div>

                        {creatingNew ? (
                            <div className="flex border-2 border-terracotta">
                                <input
                                    ref={newCatInputRef}
                                    type="text"
                                    value={newCategoryName}
                                    onChange={e => setNewCategoryName(e.target.value.toUpperCase())}
                                    placeholder="NEW CATEGORY NAME…"
                                    disabled={isPending}
                                    className="flex-1 px-4 py-3 bg-transparent border-none font-mono text-[13px] text-foreground placeholder:text-white/30 outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => { setCreatingNew(false); setNewCategoryName(""); }}
                                    className="px-4 border-l-2 border-terracotta bg-transparent text-terracotta font-mono text-[11px] normal-case tracking-widest hover:bg-white/5 hover:text-terracotta transition-colors"
                                >
                                    ← BACK
                                </button>
                            </div>
                        ) : (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => setDropdownOpen(v => !v)}
                                    disabled={isPending}
                                    className="w-full flex items-center justify-between px-4 py-3 bg-transparent border-2 border-foreground font-mono text-[13px] text-left normal-case tracking-normal hover:bg-white/5 hover:text-foreground transition-colors"
                                >
                                    <span className={pickedCategory ? "text-foreground" : "text-white/30"}>
                                        {pickedCategory ? pickedCategory.name : "Select a category…"}
                                    </span>
                                    <span className="text-terracotta text-[11px] ml-2 shrink-0">▾</span>
                                </button>

                                {dropdownOpen && (
                                    <div className="absolute left-0 right-0 top-full z-10 bg-background border-2 border-t-0 border-terracotta">
                                        {categories.map((cat, i) => (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => { setPickedCategoryId(cat.id); setDropdownOpen(false); }}
                                                className={`w-full flex items-center px-4 py-3 font-mono text-[12px] uppercase font-bold tracking-widest text-left normal-case transition-colors hover:bg-white/5 ${
                                                    i < categories.length - 1 ? "border-b border-white/10" : ""
                                                } ${
                                                    pickedCategoryId === cat.id
                                                        ? "bg-[rgba(226,114,91,0.18)] text-foreground"
                                                        : "bg-transparent text-foreground"
                                                }`}
                                            >
                                                {cat.name}
                                            </button>
                                        ))}
                                        {categories.length > 0 && (
                                            <div className="border-t border-white/10" />
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => { setCreatingNew(true); setDropdownOpen(false); }}
                                            className="w-full px-4 py-3 bg-terracotta text-background font-mono text-[12px] font-bold uppercase tracking-widest text-left normal-case hover:opacity-90 transition-opacity"
                                        >
                                            + CREATE NEW CATEGORY…
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {creatingNew && (
                            <p className="font-mono text-[10px] text-white/40 uppercase tracking-widest">
                                SYSTEM_NOTE: All categories are normalized to uppercase.
                            </p>
                        )}
                    </div>

                    {/* Action error */}
                    {state?.message && !state.success && (
                        <p className="font-mono text-[11px] text-terracotta uppercase tracking-widest -mt-2">
                            {state.message}
                        </p>
                    )}

                    {/* ── Footer ── */}
                    <div className="flex items-center justify-between py-5 -mx-[26px] px-[26px] border-t border-white/20">
                        <div className="flex items-center gap-1 font-mono text-[10px] text-white/40 normal-case tracking-normal">
                            <kbd className="border border-white/40 px-[5px] py-px text-[10px] font-mono normal-case">ESC</kbd>
                            <span>CANCEL</span>
                            <span className="mx-1">·</span>
                            <kbd className="border border-white/40 px-[5px] py-px text-[10px] font-mono normal-case">↵</kbd>
                            <span>SAVE</span>
                        </div>
                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className={`px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest border-2 transition-all ${
                                canSubmit
                                    ? "bg-terracotta text-background border-terracotta hover:bg-background hover:text-terracotta"
                                    : "bg-[rgba(226,114,91,0.18)] text-white/30 border-[rgba(226,114,91,0.30)] cursor-not-allowed"
                            }`}
                        >
                            {isPending ? "SAVING…" : "SAVE →"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
