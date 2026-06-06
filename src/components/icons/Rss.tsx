export function Rss({ size = 13, className = '' }:
    { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16"
            className={className} aria-hidden="true"
            fill="none" stroke="currentColor" strokeWidth={1.5}
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" fill="currentColor" stroke="none" />
            <path d="M3 7a6 6 0 0 1 6 6" />
            <path d="M3 3a10 10 0 0 1 10 10" />
        </svg>
    );
}
