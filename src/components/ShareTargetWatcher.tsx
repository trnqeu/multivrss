"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import ShareTargetModal from "./ShareTargetModal";
import type { Category } from "@prisma/client";
import type { TagData } from "@/app/actions/tags";

interface Props {
    categories: Category[];
    tags: TagData[];
}

export default function ShareTargetWatcher({ categories, tags }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [shared, setShared] = useState<{ url: string; title: string } | null>(null);

    useEffect(() => {
        const url = searchParams.get("share_url");
        if (!url) return;

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setShared({ url, title: searchParams.get("share_title") ?? "" });

        const rest = new URLSearchParams(searchParams);
        rest.delete("share_url");
        rest.delete("share_title");
        router.replace(rest.size ? `${pathname}?${rest}` : pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    if (!shared) return null;

    return (
        <ShareTargetModal
            categories={categories}
            tags={tags}
            url={shared.url}
            title={shared.title}
            onClose={() => setShared(null)}
        />
    );
}
