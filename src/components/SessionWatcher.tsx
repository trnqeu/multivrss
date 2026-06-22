'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SessionWatcher() {
    const router = useRouter();

    useEffect(() => {
        let channel: BroadcastChannel | undefined;
        try {
            channel = new BroadcastChannel('auth');
            channel.onmessage = (e) => {
                if (e.data === 'logout') router.push('/login');
            };
        } catch {
            // BroadcastChannel not supported in this environment
        }
        return () => channel?.close();
    }, [router]);

    return null;
}
