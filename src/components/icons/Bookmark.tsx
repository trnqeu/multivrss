export function Bookmark({ filled = false, size = 13, className = '' }:
    { filled?: boolean; size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 14 16"
            className={className} aria-hidden="true"
            fill={filled ? 'currentColor' : 'none'}
            stroke="currentColor" strokeWidth={1.6}>
            <path d="M2 1.6 H12 V14.4 L7 10.4 L2 14.4 Z" strokeLinejoin="miter" />
        </svg>
    );
}
