'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import ImportModal from './ImportModal';
import { importFeedsCsv, exportFeedsCsv, importSavedLinksCsv, exportSavedLinksCsv } from '@/app/actions/csv';
import { importFeedsOpml, exportFeedsOpml } from '@/app/actions/opml';

type ModalKey = 'opml' | 'csv-feeds' | 'pocket' | 'instapaper' | 'csv-saved' | null;

function download(data: string, filename: string, mimeType: string) {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

interface Props {
    username: string;
    feedCount: number;
    categoryCount: number;
    savedCount: number;
    tagCount: number;
}

export default function ImportExportClient({ username, feedCount, categoryCount, savedCount, tagCount }: Props) {
    const router = useRouter();
    const [openModal, setOpenModal] = useState<ModalKey>(null);
    const [exportError, setExportError] = useState<string | null>(null);

    async function handleExport(
        exportFn: () => Promise<{ success: boolean; data?: string; message?: string }>,
        filename: string,
        mimeType: string,
    ) {
        setExportError(null);
        const result = await exportFn();
        if (!result.success || !result.data) {
            setExportError(result.message || 'Export failed.');
            return;
        }
        download(result.data, filename, mimeType);
    }

    function refresh() {
        router.refresh();
    }

    return (
        <main className="flex-1 min-h-0 overflow-y-auto relative scroll-smooth bg-background">
            <header className="p-8 md:p-12 border-b-2 border-foreground bg-background sticky top-0 z-10 flex flex-col gap-4">
                <Link
                    href={`/u/${username}`}
                    className="label-system text-[10px] hover:bg-foreground hover:text-background w-fit px-1 transition-all border border-foreground font-bold"
                >
                    ← BACK_TO_ALL
                </Link>
                <h1 className="tracking-[0.2em] text-terracotta font-bold">
                    SETTINGS // IMPORT · EXPORT
                </h1>
                <p className="text-foreground max-w-xl text-[11px] font-bold leading-relaxed uppercase tracking-widest">
                    Bring your feeds and saved links in, or take everything out. OPML and CSV for RSS sources; Pocket, Instapaper, or CSV for saved links.
                </p>
            </header>

            <div className="p-8 md:p-12 flex flex-col gap-12 max-w-4xl">
                {exportError && (
                    <p role="alert" className="text-[11px] font-bold uppercase tracking-widest text-terracotta">
                        {exportError}
                    </p>
                )}

                {/* 01 — RSS sources */}
                <section aria-labelledby="sources-heading" className="flex flex-col gap-5">
                    <div className="flex items-baseline justify-between gap-4 border-b border-foreground/20 pb-2">
                        <h2 id="sources-heading" className="text-[12px] font-bold uppercase tracking-widest text-foreground">
                            01 · RSS sources
                        </h2>
                        <span className="font-mono text-[10px] text-foreground/40 uppercase tracking-widest whitespace-nowrap">
                            {feedCount} feed{feedCount !== 1 ? 's' : ''} · {categoryCount} categor{categoryCount !== 1 ? 'ies' : 'y'}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Card
                            direction="IMPORT"
                            tag="RECOMMENDED"
                            recommended
                            title="Import OPML"
                            body="Bring in a subscription list exported from another feed reader. Nested folders become categories."
                            spec={'.opml / .xml\nnested <outline> → category\nfeeds deduped by URL'}
                        >
                            <button
                                type="button"
                                onClick={() => setOpenModal('opml')}
                                className="w-full px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-widest border-2 border-terracotta bg-terracotta text-background hover:bg-background hover:text-terracotta transition-colors"
                            >
                                CHOOSE FILE…
                            </button>
                        </Card>

                        <Card
                            direction="EXPORT"
                            title="Export OPML"
                            body="Download every source, grouped by category, in the standard format any feed reader can read."
                            spec={'multivrss-feeds.opml\ncategories preserved'}
                        >
                            <button
                                type="button"
                                onClick={() => handleExport(exportFeedsOpml, 'multivrss-feeds.opml', 'text/x-opml+xml')}
                                className="w-full px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-widest border-2 border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background transition-colors"
                            >
                                DOWNLOAD ↓
                            </button>
                        </Card>

                        <Card
                            direction="IMPORT"
                            title="Import CSV"
                            body="Bring in a plain spreadsheet of feed URLs — useful for lists exported from a script or another tool."
                            spec={'columns: url, title, category\nonly "url" is required'}
                        >
                            <button
                                type="button"
                                onClick={() => setOpenModal('csv-feeds')}
                                className="w-full px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-widest border-2 border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background transition-colors"
                            >
                                CHOOSE FILE…
                            </button>
                        </Card>

                        <Card
                            direction="EXPORT"
                            title="Export CSV"
                            body="Download the same source list as a spreadsheet, for scripts, backups, or another tool."
                            spec={'multivrss-feeds.csv\nurl, category, title'}
                        >
                            <button
                                type="button"
                                onClick={() => handleExport(exportFeedsCsv, 'multivrss-feeds.csv', 'text/csv')}
                                className="w-full px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-widest border-2 border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background transition-colors"
                            >
                                DOWNLOAD ↓
                            </button>
                        </Card>
                    </div>
                </section>

                {/* 02 — Saved links */}
                <section aria-labelledby="saved-heading" className="flex flex-col gap-5">
                    <div className="flex items-baseline justify-between gap-4 border-b border-foreground/20 pb-2">
                        <h2 id="saved-heading" className="text-[12px] font-bold uppercase tracking-widest text-foreground">
                            02 · Saved links
                        </h2>
                        <span className="font-mono text-[10px] text-foreground/40 uppercase tracking-widest whitespace-nowrap">
                            {savedCount} saved · {tagCount} tag{tagCount !== 1 ? 's' : ''}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Card
                            direction="IMPORT"
                            tag="READ LATER"
                            title="Import from Pocket"
                            body="Bring in a Pocket CSV export. Tags carry over; archived items import the same as unread ones for now."
                            spec={'.csv\ntitle, url, time_added, tags, status\ntags → tags'}
                        >
                            <button
                                type="button"
                                onClick={() => setOpenModal('pocket')}
                                className="w-full px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-widest border-2 border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background transition-colors"
                            >
                                CHOOSE FILE…
                            </button>
                        </Card>

                        <Card
                            direction="IMPORT"
                            tag="READ LATER"
                            title="Import from Instapaper"
                            body="Bring in an Instapaper CSV export. Folders become tags."
                            spec={'.csv\nURL, Title, Selection, Folder\nfolders → tags'}
                        >
                            <button
                                type="button"
                                onClick={() => setOpenModal('instapaper')}
                                className="w-full px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-widest border-2 border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background transition-colors"
                            >
                                CHOOSE FILE…
                            </button>
                        </Card>

                        <Card
                            direction="IMPORT"
                            title="Import a CSV list of links"
                            body="Bring in any plain spreadsheet of links. Missing titles are fetched automatically."
                            spec={'columns: url, title, tags, saved_at\ntags comma-separated in-cell'}
                        >
                            <button
                                type="button"
                                onClick={() => setOpenModal('csv-saved')}
                                className="w-full px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-widest border-2 border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background transition-colors"
                            >
                                CHOOSE FILE…
                            </button>
                        </Card>

                        <Card
                            direction="EXPORT"
                            title="Export saved links"
                            body="Download every saved link as a spreadsheet, with tags and the date each one was saved."
                            spec={'multivrss-saved.csv\nurl, title, description, tags, saved_at'}
                        >
                            <button
                                type="button"
                                onClick={() => handleExport(exportSavedLinksCsv, 'multivrss-saved.csv', 'text/csv')}
                                className="w-full px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-widest border-2 border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background transition-colors"
                            >
                                DOWNLOAD ↓
                            </button>
                        </Card>
                    </div>
                </section>
            </div>

            <ImportModal
                open={openModal === 'opml'}
                onClose={() => setOpenModal(null)}
                kicker="IMPORT · OPML"
                title="Import OPML"
                accept=".opml,.xml"
                dropLabel="DROP YOUR .OPML FILE HERE"
                formatPreview={'nested <outline> elements\n→ each folder becomes a category\n→ each xmlUrl becomes a feed'}
                action={importFeedsOpml}
                onImported={refresh}
            />
            <ImportModal
                open={openModal === 'csv-feeds'}
                onClose={() => setOpenModal(null)}
                kicker="IMPORT · CSV"
                title="Import CSV"
                accept=".csv"
                dropLabel="DROP YOUR .CSV FILE HERE"
                formatPreview={'url,title,category\nhttps://example.com/rss.xml,Example,NEWS'}
                action={importFeedsCsv}
                onImported={refresh}
            />
            <ImportModal
                open={openModal === 'pocket'}
                onClose={() => setOpenModal(null)}
                kicker="IMPORT · POCKET"
                title="Import from Pocket"
                accept=".csv"
                dropLabel="DROP YOUR POCKET .CSV HERE"
                formatPreview={'title,url,time_added,tags,status\n"Article",https://example.com/a,1700000000,tech,unread'}
                action={importSavedLinksCsv}
                onImported={refresh}
            />
            <ImportModal
                open={openModal === 'instapaper'}
                onClose={() => setOpenModal(null)}
                kicker="IMPORT · INSTAPAPER"
                title="Import from Instapaper"
                accept=".csv"
                dropLabel="DROP YOUR INSTAPAPER .CSV HERE"
                formatPreview={'URL,Title,Selection,Folder\nhttps://example.com/a,"Article","",Biology'}
                action={importSavedLinksCsv}
                onImported={refresh}
            />
            <ImportModal
                open={openModal === 'csv-saved'}
                onClose={() => setOpenModal(null)}
                kicker="IMPORT · CSV"
                title="Import a CSV list of links"
                accept=".csv"
                dropLabel="DROP YOUR .CSV FILE HERE"
                formatPreview={'url,title,tags,saved_at\nhttps://example.com/a,Article,tech;news,2026-01-01'}
                action={importSavedLinksCsv}
                onImported={refresh}
            />
        </main>
    );
}

function Card({
    direction, tag, recommended, title, body, spec, children,
}: {
    direction: 'IMPORT' | 'EXPORT';
    tag?: string;
    recommended?: boolean;
    title: string;
    body: string;
    spec: string;
    children: React.ReactNode;
}) {
    return (
        <div
            className={`flex flex-col gap-3 p-5 border-2 transition-colors ${
                recommended ? 'border-terracotta' : 'border-foreground/20 hover:border-foreground'
            }`}
        >
            <div className="flex items-center justify-between gap-2">
                <span
                    className={`font-mono text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 border ${
                        recommended ? 'border-terracotta text-terracotta' : 'border-foreground/40 text-foreground/50'
                    }`}
                >
                    {direction}
                </span>
                {tag && (
                    <span className="font-mono text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 bg-terracotta/10 text-terracotta">
                        {tag}
                    </span>
                )}
            </div>
            <h3 className="font-bold text-foreground text-[14px]">{title}</h3>
            <p className="text-foreground/60 text-[12px] leading-relaxed">{body}</p>
            <pre className="font-mono text-[10px] text-foreground/45 leading-relaxed border-l-2 border-foreground/15 pl-2.5 whitespace-pre-wrap">
                {spec}
            </pre>
            <div className="mt-1">{children}</div>
        </div>
    );
}
