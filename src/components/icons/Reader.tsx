export function Reader({ size = 13, className = '' }:
    { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16"
            className={className} aria-hidden="true"
            fill="none" stroke="currentColor" strokeWidth={1.3}>
            <path d="M2 3h5v10H2zM9 3h5v10H9z" />
        </svg>
    );
}
