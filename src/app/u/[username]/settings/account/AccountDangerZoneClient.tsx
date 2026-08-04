'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { deleteAccount } from '@/app/actions/account';
import type { ActionState } from '@/app/actions/types';

const initialState: ActionState = { success: false };
const CONFIRMATION_PHRASE = 'delete';

export default function AccountDangerZoneClient({
  username,
  hasPassword,
}: {
  username: string;
  hasPassword: boolean;
}) {
  const [step, setStep] = useState<'idle' | 'confirm'>('idle');
  const [confirmationInput, setConfirmationInput] = useState('');
  const [state, formAction, isPending] = useActionState(deleteAccount, initialState);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  // Move focus into the confirmation form when it appears — keyboard users
  // shouldn't have to hunt for it.
  useEffect(() => {
    if (step === 'confirm') firstFieldRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (!state.success) return;
    try { new BroadcastChannel('auth').postMessage('logout'); } catch { /* unsupported */ }
    signOut({ callbackUrl: '/' });
  }, [state.success]);

  const canSubmit = confirmationInput.trim().toLowerCase() === CONFIRMATION_PHRASE;

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
          SETTINGS // ACCOUNT
        </h1>
      </header>

      <div className="p-8 md:p-12 flex flex-col gap-10 max-w-2xl">
        <section className="flex flex-col gap-4 border-2 border-terracotta p-6" aria-labelledby="danger-zone-heading">
          <h2 id="danger-zone-heading" className="text-[12px] font-bold uppercase tracking-widest text-terracotta">
            Danger zone
          </h2>

          {state.success ? (
            <p role="status" className="text-[11px] font-bold uppercase tracking-widest text-foreground">
              Account deleted. Signing you out…
            </p>
          ) : step === 'idle' ? (
            <>
              <p className="text-[11px] font-bold leading-relaxed uppercase tracking-widest text-foreground/70">
                Permanently deletes your account, categories, feed sources, saved links, tags and API keys.
                This cannot be undone.
              </p>
              <button
                type="button"
                onClick={() => setStep('confirm')}
                className="self-start px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest border-2 border-terracotta text-terracotta bg-transparent hover:bg-terracotta hover:text-background transition-colors"
              >
                Delete my account
              </button>
            </>
          ) : (
            <form action={formAction} className="flex flex-col gap-4">
              <p className="text-[11px] font-bold leading-relaxed uppercase tracking-widest text-foreground/70">
                This is permanent. All your data will be deleted immediately and cannot be recovered.
              </p>

              {hasPassword && (
                <div className="flex flex-col gap-2">
                  <label htmlFor="delete-password" className="font-mono text-[10px] uppercase tracking-widest text-terracotta">
                    Current password
                  </label>
                  <input
                    id="delete-password"
                    ref={firstFieldRef}
                    type="password"
                    name="password"
                    required
                    aria-describedby={!state.success && state.message ? 'delete-account-error' : undefined}
                    className="w-full px-3 py-3 bg-background border-2 border-foreground font-mono text-[13px] text-foreground outline-none focus-visible:border-terracotta"
                  />
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label htmlFor="delete-confirmation" className="font-mono text-[10px] uppercase tracking-widest text-terracotta">
                  Type &quot;{CONFIRMATION_PHRASE}&quot; to confirm
                </label>
                <input
                  id="delete-confirmation"
                  ref={hasPassword ? undefined : firstFieldRef}
                  type="text"
                  name="confirmation"
                  required
                  autoComplete="off"
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value)}
                  aria-describedby={!state.success && state.message ? 'delete-account-error' : undefined}
                  className="w-full px-3 py-3 bg-background border-2 border-foreground font-mono text-[13px] text-foreground outline-none focus-visible:border-terracotta"
                />
              </div>

              {!state.success && state.message && (
                <p id="delete-account-error" role="alert" className="text-[11px] font-bold uppercase tracking-widest text-terracotta">
                  {state.message}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isPending || !canSubmit}
                  className="px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest border-2 border-terracotta bg-terracotta text-background hover:bg-background hover:text-terracotta transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? 'DELETING…' : 'PERMANENTLY DELETE'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('idle')}
                  disabled={isPending}
                  className="px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest border-2 border-foreground text-foreground bg-transparent hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
