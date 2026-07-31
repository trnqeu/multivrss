export default function ReadLoading() {
    return (
        <div role="status" aria-live="polite" className="flex-1 flex items-center justify-center min-h-[50vh] bg-background">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/40 animate-pulse">
                Extracting article…
            </span>
        </div>
    );
}
