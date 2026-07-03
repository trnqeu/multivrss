interface WordmarkProps {
  className?: string;
  onDark?: boolean;
}

export default function Wordmark({ className = "", onDark = false }: WordmarkProps) {
  return (
    <span className={`font-extrabold uppercase leading-none ${className}`}>
      <span className={onDark ? "text-paper" : "text-foreground"}>multiv</span>
      <span className="text-terracotta">rss</span>
    </span>
  );
}
