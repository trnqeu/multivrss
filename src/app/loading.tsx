import Image from "next/image";

export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex-1 flex flex-col items-center justify-center bg-background min-h-[50vh]"
    >
      <div className="flex flex-col items-center gap-6">
        <span className="sr-only">Loading MultivRSS</span>

        <Image
          src="/assets/multivrss-ico.png"
          alt=""
          aria-hidden="true"
          width={40}
          height={40}
          className="w-10 h-10 motion-safe:animate-spin"
        />

        <div aria-hidden="true" className="flex flex-col items-center gap-2 animate-pulse">
          <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-terracotta/80">
            MultivRSS
          </span>
          <span className="text-[8px] uppercase font-bold tracking-[0.15em] text-foreground/30">
            Initializing_Data_Stream // 0xAF4
          </span>
        </div>

        <div aria-hidden="true" className="flex gap-2">
          <div className="w-1 h-1 bg-terracotta/40"></div>
          <div className="w-1 h-1 bg-terracotta/60"></div>
          <div className="w-1 h-1 bg-terracotta"></div>
        </div>
      </div>
    </div>
  );
}
