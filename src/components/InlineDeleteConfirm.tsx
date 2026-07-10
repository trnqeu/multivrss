'use client';

interface Props {
    label: string;
    onCancel: () => void;
    onConfirm: () => void;
    pending?: boolean;
}

export default function InlineDeleteConfirm({ label, onCancel, onConfirm, pending }: Props) {
    return (
        <span className="flex items-center gap-2 flex-1 min-w-0 font-mono text-[10px] text-foreground/70">
            <span className="truncate">Delete <b className="text-foreground font-bold">&ldquo;{label}&rdquo;</b>?</span>
            <span className="flex gap-1.5 ml-auto shrink-0">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-2 py-1 bg-transparent border-0 font-bold uppercase tracking-wider text-foreground/50 hover:text-foreground"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={onConfirm}
                    disabled={pending}
                    className="px-2 py-1 bg-transparent border border-terracotta text-terracotta font-bold uppercase tracking-wider hover:bg-terracotta hover:text-background disabled:opacity-40"
                >
                    {pending ? '…' : 'Delete'}
                </button>
            </span>
        </span>
    );
}
