import MobileTabBar from './MobileTabBar';

export default function MobileShell({ username, children }: { username: string; children: React.ReactNode }) {
    return (
        <main id="main-content" tabIndex={-1} className="relative flex-1 flex flex-col min-h-0 min-w-0">
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden pb-[calc(44px+env(safe-area-inset-bottom))] md:pb-0">
                {children}
            </div>
            <MobileTabBar username={username} />
        </main>
    );
}
