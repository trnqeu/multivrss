"use client";

import Image from "next/image";
import Wordmark from "@/components/Wordmark";

type Variant = "no-sources" | "empty-category" | "no-results" | "no-saved";

type Props = {
    variant: Variant;
    contextLabel?: string;
    onAddSource?: () => void;
};

const COPY: Record<Variant, { label: string; title: (ctx?: string) => string; body: string }> = {
    "no-sources": {
        label: "NO SIGNAL",
        title: () => "The stream is empty.",
        body: "Add a feed source to start receiving signal.",
    },
    "empty-category": {
        label: "EMPTY CATEGORY",
        title: (ctx) => `Nothing in ${ctx ?? "this category"}.`,
        body: "This category has no sources yet. Add one to populate the stream.",
    },
    "no-results": {
        label: "ZERO HITS",
        title: (ctx) => `No matches for "${ctx ?? ""}".`,
        body: "Try a different query or remove filters.",
    },
    "no-saved": {
        label: "EMPTY ARCHIVE",
        title: () => "Nothing saved yet.",
        body: "Save articles from your feeds or add external links to build your reading list.",
    },
};

export default function EmptyStream({ variant, contextLabel, onAddSource }: Props) {
    const copy = COPY[variant];

    return (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 p-10 relative overflow-hidden">
            <Image
                src="/logo/multivrss-mark.png"
                alt=""
                width={280}
                height={215}
                className="w-[280px] h-auto object-contain"
            />

            <Wordmark className="text-[30px] tracking-[0.1em] mt-2" />

            <div className="text-center max-w-[480px] mt-1">
                <div className="label-system text-terracotta mb-2.5">{copy.label}</div>
                <h2 className="m-0 text-2xl font-extrabold tracking-tight leading-snug">
                    {copy.title(contextLabel)}
                </h2>
                <p className="font-mono text-xs text-foreground/55 leading-relaxed mt-3 tracking-[0.04em]">
                    {copy.body}
                </p>
            </div>

            {variant === "no-sources" && (
                <button
                    type="button"
                    onClick={onAddSource}
                    className="font-mono bg-terracotta text-background px-[22px] py-3 text-[11px] font-extrabold tracking-[0.2em] border-2 border-terracotta hover:bg-background hover:text-terracotta transition-colors cursor-pointer"
                >
                    + ADD FIRST SOURCE
                </button>
            )}
        </div>
    );
}
