export function SourceIcon({ size = 13, className = '' }: { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className} aria-hidden="true">
            <circle cx="3" cy="11" r="1.5" fill="currentColor" />
            <path d="M2.4 6.4A5.2 5.2 0 0 1 7.6 11.6M2.4 2.6A9 9 0 0 1 11.4 11.6" stroke="currentColor" strokeWidth="1.6" />
        </svg>
    );
}
