export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#050505] min-h-[50vh]">
      <div className="flex flex-col items-center gap-6 animate-pulse">
        {/* Architectural Grid Line */}
        <div className="h-[2px] w-12 bg-accent"></div>
        
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-accent/80">
            MultivRSS
          </span>
          <span className="text-[8px] uppercase font-bold tracking-[0.15em] text-zinc-600">
            Initializing_Data_Stream // 0xAF4
          </span>
        </div>

        {/* Minimalist Progress Indicator */}
        <div className="flex gap-2">
          <div className="w-1 h-1 bg-accent/40 rounded-full"></div>
          <div className="w-1 h-1 bg-accent/60 rounded-full"></div>
          <div className="w-1 h-1 bg-accent rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
