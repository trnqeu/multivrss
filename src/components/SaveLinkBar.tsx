'use client';
import { useActionState, useEffect, useRef, useState } from 'react';
import { saveExternalLink } from '@/app/actions';
import { Bookmark } from '@/components/icons/Bookmark';

export default function SaveLinkBar() {
    const [state, formAction, pending] = useActionState(saveExternalLink, null);
    const [url, setUrl] = useState('');
    const formRef = useRef<HTMLFormElement>(null);
    const valid = (() => { try { new URL(url); return true; } catch { return false; } })();

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { if (state?.success) { setUrl(''); formRef.current?.reset(); } }, [state]);

    return (
        <form ref={formRef} action={formAction}
            className={`flex items-stretch border-2 bg-background transition-colors
                ${state?.success ? 'border-terracotta' : 'border-foreground/15'}`}>
            <span className="flex items-center px-3 border-r border-foreground/15">
                <span className="label-system text-[9.5px] text-terracotta">PASTE_URL_</span>
            </span>
            <input name="url" value={url} onChange={e => setUrl(e.target.value)} inputMode="url"
                placeholder={state?.success ? 'Link saved' : 'https://…  — paste a link, press enter'}
                className="flex-1 bg-transparent outline-none px-3.5 py-3 font-mono text-xs text-foreground placeholder:text-foreground/40" />
            <button type="submit" disabled={!valid || pending}
                className="flex items-center gap-2 px-4 label-system text-[10px] font-extrabold transition-all
                    disabled:text-foreground/28 enabled:bg-terracotta enabled:text-background">
                <Bookmark filled size={11} /> {pending ? 'SAVING' : 'SAVE'}
            </button>
        </form>
    );
}
