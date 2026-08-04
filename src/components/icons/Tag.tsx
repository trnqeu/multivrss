export function TagIcon({ size = 13, className = '' }:
    { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16"
            className={className} aria-hidden="true"
            fill="none" stroke="currentColor" strokeWidth={1.3}>
            <path d="M2 8.5 8.5 2H14v5.5L7.5 14z" />
            <circle cx="11" cy="5" r="1" fill="currentColor" stroke="none" />
        </svg>
    );
}
