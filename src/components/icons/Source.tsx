export function SourceIcon({ size = 13, className = '' }: { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 14 14" className={className} aria-hidden="true">
            <path d="M7 1.5v11M1.5 7h11" stroke="currentColor" strokeWidth="1.6" />
        </svg>
    );
}
