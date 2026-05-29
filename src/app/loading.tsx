export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-background min-h-[50vh]">
      <div className="flex flex-col items-center gap-6 animate-pulse">
        <div className="h-[2px] w-12 bg-terracotta"></div>
        
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-terracotta/80">
            MultivRSS
          </span>
          <span className="text-[8px] uppercase font-bold tracking-[0.15em] text-foreground/30">
            Initializing_Data_Stream // 0xAF4
          </span>
        </div>

        <div className="flex gap-2">
          <div className="w-1 h-1 bg-terracotta/40"></div>
          <div className="w-1 h-1 bg-terracotta/60"></div>
          <div className="w-1 h-1 bg-terracotta"></div>
        </div>
      </div>
    </div>
  );
}
