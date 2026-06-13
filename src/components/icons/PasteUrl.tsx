export function PasteUrlIcon({ size = 13, className = '' }: { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" className={className} aria-hidden="true">
            <rect x="2.2" y="2.5" width="9.6" height="10" />
            <path d="M5 2.5V1.2h4v1.3" />
            <path d="M4.4 6h5.2M4.4 8.6h3.6" />
        </svg>
    );
}
