"use client";

import { useTransition } from "react";
import { deleteFeedSource } from "@/app/actions";

interface DeleteFeedButtonProps {
    sourceId: string;
}

export default function DeleteFeedButton({ sourceId }: DeleteFeedButtonProps) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        if (confirm("REMOVE_SOURCE?")) {
            startTransition(async () => {
                await deleteFeedSource(sourceId);
            });
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isPending}
            className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-terracotta bg-background hover:bg-terracotta hover:text-background px-1 border-2 border-terracotta font-mono disabled:opacity-20"
            title="DELETE_SOURCE"
        >
            {isPending ? "..." : "[X]"}
        </button>
    );
}
