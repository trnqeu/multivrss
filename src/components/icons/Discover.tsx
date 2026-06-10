export function Discover({ size = 13, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16"
      className={className} aria-hidden="true"
      fill="none" stroke="currentColor" strokeWidth={1.5}
      strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M5.5 5.5 L9 7 L10.5 10.5 L7 9 Z" fill="currentColor" stroke="none" />
    </svg>
  );
}
