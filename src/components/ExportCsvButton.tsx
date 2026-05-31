"use client";

import { exportFeedsCsv } from "@/app/actions";


export default function ExportCsvButton() {
    const handleClick = async () => {
        const result = await exportFeedsCsv();
        if (!result.success || !result.data) return;

        const blob = new Blob([result.data], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "multivrss-feed.csv";
        a.click();
        URL.revokeObjectURL(url);
    }
    return (
        <button
            onClick={handleClick}
            className="self-start px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-widest border border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background transition-colors cursor-pointer"
        >
            Export CSV
        </button>
    );
}