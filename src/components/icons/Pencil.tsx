export function Pencil({ size = 12, className = '' }:
    { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 12 12"
            className={className} aria-hidden="true"
            fill="none" stroke="currentColor" strokeWidth={1.2}
            strokeLinejoin="round" strokeLinecap="round">
            <path d="M8.6 1.4l2 2L4.3 9.7l-2.7.5.5-2.7z" />
        </svg>
    );
}
