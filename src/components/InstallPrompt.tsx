"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/sw.js").catch((err) => {
                console.error("Service worker registration failed:", err);
            });
        }

        function onBeforeInstallPrompt(e: Event) {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        }

        function onAppInstalled() {
            setDeferredPrompt(null);
        }

        window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
        window.addEventListener("appinstalled", onAppInstalled);
        return () => {
            window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
            window.removeEventListener("appinstalled", onAppInstalled);
        };
    }, []);

    if (!deferredPrompt || dismissed) return null;

    async function handleInstall() {
        if (!deferredPrompt) return;
        await deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        setDeferredPrompt(null);
    }

    return (
        <div
            role="status"
            className="fixed bottom-0 left-0 right-0 z-[100] flex items-center justify-between gap-4 border-t-2 border-foreground bg-background px-5 py-4"
        >
            <div className="flex flex-col gap-0.5 min-w-0">
                <span className="label-system font-mono text-[10px] uppercase tracking-widest text-terracotta">
                    INSTALL
                </span>
                <span className="text-[13px] font-bold text-foreground truncate">
                    Add MultivRSS to your home screen
                </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <button
                    type="button"
                    onClick={() => setDismissed(true)}
                    className="px-3 py-2 font-mono text-[11px] uppercase tracking-widest bg-transparent border border-white/40 text-foreground hover:border-foreground transition-colors"
                >
                    Not now
                </button>
                <button
                    type="button"
                    onClick={handleInstall}
                    className="px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-widest bg-terracotta text-background border-2 border-terracotta hover:bg-background hover:text-terracotta transition-colors"
                >
                    Install
                </button>
            </div>
        </div>
    );
}
