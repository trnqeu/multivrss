"use client";

import { useActionState, useEffect, useState } from "react";
import { importFeedsCsv, type ActionState } from "@/app/actions";

const initialState: ActionState = { success: false };

export default function ImportCsvForm() {
    const [state, formAction, isPending] = useActionState(importFeedsCsv, initialState);
    const [showOverlay, setShowOverlay] = useState(false);
    const [fileName, setFileName] = useState("");

    useEffect(() => {
        if (!showOverlay) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape" && !isPending) setShowOverlay(false);
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [showOverlay, isPending]);

    const dismiss = () => { if (!isPending) setShowOverlay(false); };

    return (
        <>
            {showOverlay && (
                <div
                    className="fixed inset-0 z-50 flex items-start justify-center pt-32 px-4"
                    style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
                    onClick={dismiss}
                >
                    <div
                        className="w-full max-w-lg border-2 border-foreground bg-background"
                        onClick={e => e.stopPropagation()}
                    >
                        {isPending ? (
                            <div className="flex flex-col items-center gap-5 py-20 px-8">
                                <span className="text-terracotta text-[11px] font-mono uppercase tracking-widest animate-pulse">
                                    IMPORTING FEEDS&hellip;
                                </span>
                                {fileName && (
                                    <span className="text-white/40 text-[10px] font-mono">
                                        {fileName}
                                    </span>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-5 py-10 px-8">
                                <span
                                    className={`text-[11px] font-mono uppercase tracking-widest ${
                                        state?.success ? "text-green-400/70" : "text-terracotta"
                                    }`}
                                >
                                    {state?.success ? "IMPORT COMPLETE" : "IMPORT FAILED"}
                                </span>
                                <p className="font-mono text-[13px] text-foreground whitespace-pre-wrap leading-relaxed">
                                    {state?.message}
                                </p>
                                <button
                                    onClick={dismiss}
                                    className="self-start mt-2 px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest border-2 border-foreground bg-foreground text-background hover:bg-background hover:text-foreground transition-colors cursor-pointer"
                                >
                                    DISMISS
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <form
                action={formAction}
                onSubmit={() => setShowOverlay(true)}
                className="flex flex-col gap-1.5"
            >
                <label htmlFor="import-csv-file" className="sr-only">Choose CSV file to import</label>
                <input
                    id="import-csv-file"
                    type="file"
                    name="file"
                    accept=".csv"
                    required
                    onChange={e => setFileName(e.target.files?.[0]?.name ?? "")}
                    className="text-[9px] font-mono text-foreground file:mr-2 file:border file:border-foreground file:bg-transparent file:text-[9px] file:font-mono file:text-foreground file:px-2 file:py-0.5 file:cursor-pointer"
                />
                <button
                    type="submit"
                    disabled={isPending}
                    className="self-start px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-widest border border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background transition-colors disabled:opacity-40 cursor-pointer"
                >
                    Import CSV
                </button>
            </form>
        </>
    );
}
