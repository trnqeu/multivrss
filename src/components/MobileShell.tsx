export default function MobileShell({ children }: { children: React.ReactNode }) {
    return (
        <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col min-h-0 min-w-0">
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {children}
            </div>
        </main>
    );
}
