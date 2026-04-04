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
        <div className="p-8 border border-zinc-900 mb-12 bg-zinc-950/50 backdrop-blur-sm relative overflow-hidden">
            {/* Structural Accent Line */}
            <div className="absolute top-0 left-0 w-12 h-[3px] bg-accent"></div>
            
            <h2 className="mb-8">
                Add New Feed Source
            </h2>

            <form action={formAction} className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
                {/* URL Input */}
                <div className="md:col-span-5 flex flex-col gap-3">
                    <label className="label-system !text-zinc-500">RSS_FEED_URL</label>
                    <input
                        name="url"
                        type="url"
                        placeholder="https://news.ycombinator.com/rss"
                        className="p-4 bg-black border border-zinc-800 focus:border-accent outline-none font-mono text-[13px] w-full text-zinc-300 placeholder:opacity-20 transition-colors"
                        required
                        disabled={isPending}
                    />
                </div>

                {/* Category Dropdown */}
                <div className="md:col-span-4 flex flex-col gap-3">
                    <label className="label-system !text-zinc-500">CATEGORY_FOLDER</label>
                    <div className="relative">
                        <select
                            name="categoryId"
                            className="p-4 bg-black border border-zinc-800 focus:border-accent outline-none w-full text-[13px] text-zinc-300 appearance-none cursor-pointer disabled:opacity-50 transition-colors"
                            required
                            disabled={isPending}
                        >
                            <option value="" className="bg-black text-zinc-500">Select a category...</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id} className="bg-black text-zinc-300">{cat.name}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-accent opacity-50 text-[10px]">▼</div>
                    </div>
                </div>

                {/* Submit button with pending state */}
                <div className="md:col-span-3">
                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full p-4 bg-accent text-white font-bold hover:bg-white hover:text-black transition-all duration-300 uppercase text-xs tracking-[0.2em] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isPending ? "INGESTING..." : "ADD_SOURCE"}
                        {!isPending && <span className="text-lg">→</span>}
                    </button>
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
