'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createApiKey, revokeApiKey, type ApiKeyData } from '@/app/actions/api-keys';
import type { ActionState } from '@/app/actions/types';

const initialState: ActionState & { token?: string } = { success: false };

function ApiKeyRow({ apiKey }: { apiKey: ApiKeyData }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    async () => revokeApiKey(apiKey.id),
    { success: false } as ActionState,
  );

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state, router]);

  return (
    <li className="flex items-center justify-between gap-4 p-4 border-2 border-foreground">
      <div className="flex flex-col gap-1 min-w-0">
        <span className="font-mono text-[12px] font-bold text-foreground truncate">
          {apiKey.name}
        </span>
        <span className="font-mono text-[10px] text-foreground/50">
          Created {apiKey.createdAt.toLocaleDateString()}
          {apiKey.lastUsedAt && ` · Last used ${apiKey.lastUsedAt.toLocaleDateString()}`}
          {apiKey.revokedAt && ' · REVOKED'}
        </span>
      </div>
      {!apiKey.revokedAt && (
        <form action={formAction}>
          <button
            type="submit"
            disabled={isPending}
            className="px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest border-2 border-terracotta text-terracotta bg-transparent hover:bg-terracotta hover:text-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'REVOKING…' : 'REVOKE'}
          </button>
        </form>
      )}
    </li>
  );
}

export default function ApiKeysClient({
  username,
  initialKeys,
}: {
  username: string;
  initialKeys: ApiKeyData[];
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createApiKey, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

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
          SETTINGS // API KEYS
        </h1>
        <p className="text-foreground max-w-xl text-[11px] font-bold leading-relaxed uppercase tracking-widest">
          Generate personal access tokens to connect external tools (e.g. an MCP server) to your MultivRSS account.
        </p>
      </header>

      <div className="p-8 md:p-12 flex flex-col gap-10 max-w-2xl">
        <section className="flex flex-col gap-4" aria-labelledby="generate-heading">
          <h2 id="generate-heading" className="text-[12px] font-bold uppercase tracking-widest text-foreground">
            Generate new key
          </h2>
          <form ref={formRef} action={formAction} className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
            <div className="flex flex-col gap-2 flex-1 w-full">
              <label htmlFor="key-name" className="font-mono text-[10px] uppercase tracking-widest text-terracotta">
                Name
              </label>
              <input
                id="key-name"
                name="name"
                type="text"
                required
                maxLength={50}
                placeholder="E.G. MCP SERVER"
                className="w-full px-3 py-3 bg-background border-2 border-foreground font-mono text-[13px] text-foreground placeholder:text-foreground/30 outline-none focus-visible:border-terracotta"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest border-2 border-terracotta bg-terracotta text-background hover:bg-background hover:text-terracotta transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? 'GENERATING…' : 'GENERATE KEY'}
            </button>
          </form>

          <div role="alert">
            {!state.success && state.message && (
              <p className="text-[11px] font-bold uppercase tracking-widest text-terracotta">
                {state.message}
              </p>
            )}
            {state.success && state.token && (
              <div className="flex flex-col gap-2 p-4 border-2 border-terracotta bg-terracotta/[0.08]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-terracotta">
                  Copy this key now — it will not be shown again
                </p>
                <code className="font-mono text-[12px] text-foreground break-all select-all">
                  {state.token}
                </code>
              </div>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-4" aria-labelledby="keys-heading">
          <h2 id="keys-heading" className="text-[12px] font-bold uppercase tracking-widest text-foreground">
            Your keys
          </h2>

          {initialKeys.length === 0 ? (
            <p role="status" className="text-[11px] font-mono text-foreground/40 italic">
              No API keys yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {initialKeys.map((key) => (
                <ApiKeyRow key={key.id} apiKey={key} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
