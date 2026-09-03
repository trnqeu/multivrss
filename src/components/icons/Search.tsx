export function Search({ size = 13, className = '' }:
    { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16"
            className={className} aria-hidden="true"
            fill="none" stroke="currentColor" strokeWidth={1.5}
            strokeLinecap="round" strokeLinejoin="round">
            <circle cx="7" cy="7" r="4.25" />
            <path d="M10.5 10.5 14 14" />
        </svg>
    );
}
