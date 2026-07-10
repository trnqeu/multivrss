'use client';

interface Props {
    onRename: () => void;
    onDeleteClick: () => void;
    renameLabel: string;
    deleteLabel: string;
    className?: string;
}

export default function RowActionIcons({ onRename, onDeleteClick, renameLabel, deleteLabel, className = '' }: Props) {
    return (
        <span className={`items-center gap-1 shrink-0 ${className}`}>
            <button
                type="button"
                onClick={onRename}
                aria-label={renameLabel}
                className="p-1 bg-transparent border-0 text-foreground/50 hover:text-terracotta transition-colors"
            >
                <PencilIcon />
            </button>
            <button
                type="button"
                onClick={onDeleteClick}
                aria-label={deleteLabel}
                className="p-1 bg-transparent border-0 text-foreground/50 hover:text-terracotta transition-colors"
            >
                <TrashIcon />
            </button>
        </span>
    );
}

function PencilIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M8.6 1.4l2 2L4.3 9.7l-2.7.5.5-2.7z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
    );
}

function TrashIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M2 3.1h8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
            <path d="M4.5 3.1V1.9c0-.33.27-.6.6-.6h1.8c.33 0 .6.27.6.6v1.2" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
            <path d="M3.1 3.1l.55 7.15c.03.4.37.7.77.7h3.16c.4 0 .74-.3.77-.7l.55-7.15" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
        </svg>
    );
}
