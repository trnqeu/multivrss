"use client";

import { useActionState } from "react";
import { createFeedSource, ActionState } from "@/app/actions";
import type { Category } from "@prisma/client";

interface AddFeedFormProps {
    categories: Category[];
}

const initialState: ActionState = {
    success: false,
};

export default function AddFeedForm({ categories }: AddFeedFormProps) {
    // This hook manages the form submission, loading state, and feedback from the server
    const [state, formAction, isPending] = useActionState(createFeedSource, initialState);

    return (
        <div className="p-8 border-2 border-foreground mb-12 bg-background relative overflow-hidden">
            {/* Structural Accent Line */}
            <div className="absolute top-0 left-0 w-12 h-[4px] bg-foreground"></div>
            
            <h2 className="mb-8 text-foreground font-bold">
                Add New Feed Source
            </h2>

            <form action={formAction} className="flex flex-col gap-8">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
                    {/* URL Input */}
                    <div className="md:col-span-5 flex flex-col gap-3">
                        <label className="label-system text-foreground font-bold">RSS_FEED_URL</label>
                        <input
                            name="url"
                            type="url"
                            placeholder="https://news.ycombinator.com/rss"
                            className="p-4 bg-background border-2 border-foreground focus:ring-0 outline-none font-mono text-[13px] w-full text-foreground placeholder:text-foreground/20 transition-colors"
                            required
                            disabled={isPending}
                        />
                    </div>

                    {/* Category Dropdown */}
                    <div className="md:col-span-4 flex flex-col gap-3">
                        <label className="label-system text-foreground font-bold">CATEGORY_FOLDER</label>
                        <div className="relative">
                            <select
                                name="categoryId"
                                className="p-4 bg-background border-2 border-foreground focus:ring-0 outline-none w-full text-[13px] text-foreground appearance-none cursor-pointer transition-colors"
                                disabled={isPending}
                            >
                                <option value="" className="bg-background text-foreground">Select a category...</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id} className="bg-background text-foreground">{cat.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-foreground text-[10px]">▼</div>
                        </div>
                    </div>

                    {/* Submit button with pending state */}
                    <div className="md:col-span-3">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full p-4 bg-foreground text-background font-bold hover:bg-background hover:text-foreground border-2 border-foreground transition-all duration-300 uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-2"
                        >
                            {isPending ? "INGESTING..." : "ADD_SOURCE"}
                            {!isPending && <span className="text-lg">→</span>}
                        </button>
                    </div>
                </div>

                {/* New Category Input Sub-Zone */}
                <div className="flex flex-col gap-3 pt-6 border-t-2 border-foreground border-dashed">
                    <label className="label-system text-foreground font-bold">OR_CREATE_NEW_CATEGORY // (Optional)</label>
                    <input
                        name="newCategoryName"
                        type="text"
                        placeholder="ENTER NEW CATEGORY NAME (e.g. TECHNOLOGY, SPORT...)"
                        className="p-4 bg-background border-2 border-foreground focus:ring-0 outline-none font-mono text-[13px] w-full text-foreground placeholder:text-foreground/20 transition-colors uppercase"
                        disabled={isPending}
                    />
                    <p className="text-[10px] text-foreground font-mono">SYSTEM_NOTE: All categories are normalized to uppercase for structural integrity.</p>
                </div>
            </form>

            {/* Smart Feedback Message */}
            {state?.message && (
                <p className={`mt-4 text-sm font-bold uppercase tracking-tight ${state.success ? 'text-green-600' : 'text-accent'}`}>
                    {state.message}
                </p>
            )}
        </div>
    );
}
