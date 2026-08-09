'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchSavedItemsPage, type SavedItemsPage } from "@/lib/saved-items";

export async function getMoreSavedItems(opts: {
    tag?: string;
    q?: string;
    feedOffset: number;
    linkOffset: number;
}): Promise<SavedItemsPage | { error: string }> {
    const session = await getServerSession(authOptions);
    if (!session) return { error: "Unauthorized" };

    return fetchSavedItemsPage(session.user.id, opts);
}
