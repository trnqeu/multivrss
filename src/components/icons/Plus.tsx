export function PlusIcon({ size = 13, className = '' }: { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 14 14" className={className} aria-hidden="true">
            <path d="M7 1.6v10.8M1.6 7h10.8" stroke="currentColor" strokeWidth="1.7" />
        </svg>
    );
}
