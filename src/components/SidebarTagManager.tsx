'use client';

import { useState, useCallback } from 'react';
import { createTag, deleteTag } from '@/app/actions';
import { useRouter } from 'next/navigation';

interface TagVM {
  id: string;
  name: string;
}

export default function SidebarTagManager({
  tags,
  username,
}: {
  tags: TagVM[];
  username: string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const handleCreate = useCallback(async () => {
    if (!name.trim()) return;
    setPending(true);
    const res = await createTag(name.trim());
    if (res.success) {
      setName('');
      setShowForm(false);
      router.refresh();
    }
    setPending(false);
  }, [name, router]);

  const handleDelete = useCallback(async (tagId: string) => {
    await deleteTag(tagId);
    router.refresh();
  }, [router]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="label-system text-foreground">TAGS</span>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="text-[10px] uppercase tracking-widest bg-transparent border border-foreground/40 px-2 py-0.5 text-foreground/60 hover:text-foreground hover:border-foreground transition-colors cursor-pointer"
        >
          {showForm ? '✕' : '+ TAG'}
        </button>
      </div>
      {showForm && (
        <div className="flex gap-1">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="new tag…"
            maxLength={50}
            className="flex-1 bg-transparent border border-foreground/40 px-2 py-1 text-[10px] uppercase tracking-widest outline-none placeholder:text-foreground/30 font-bold"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={!name.trim() || pending}
            className="text-[10px] uppercase tracking-widest bg-terracotta text-background border border-terracotta px-2 py-1 disabled:opacity-40 cursor-pointer"
          >
            {pending ? '…' : 'ADD'}
          </button>
        </div>
      )}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span key={tag.id} className="group flex items-center gap-0.5">
              <a
                href={`/u/${username}/saved?tag=${encodeURIComponent(tag.name)}`}
                className="text-[10px] uppercase tracking-widest font-bold px-2 py-1 border border-foreground/40 hover:bg-foreground hover:text-background transition-colors"
              >
                {tag.name}
              </a>
              <button
                type="button"
                onClick={() => handleDelete(tag.id)}
                className="text-[8px] text-foreground/30 hover:text-terracotta bg-transparent border-0 px-0.5 py-0 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                title={`Delete ${tag.name}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
