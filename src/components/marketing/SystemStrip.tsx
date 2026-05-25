export default function SystemStrip() {
  return (
    <div className="flex items-center justify-between px-7 py-[10px] border-b border-black/10 font-mono text-[10.5px] font-semibold tracking-[0.12em] text-black/55">
      <div className="flex items-center gap-[18px]">
        <span>
          <span className="inline-block w-[7px] h-[7px] bg-terracotta align-middle mr-[6px]" />
          <b className="text-black font-bold">LIVE</b>
        </span>
        <span>NODE_<b className="text-black font-bold">multivrss_alpha</b></span>
        <span>CONNECTION_<b className="text-black font-bold">protected</b></span>
        <span>BUILD_<b className="text-black font-bold">0.1.0 · 2026.05.23</b></span>
      </div>
      <div className="hidden md:flex items-center gap-[18px]">
        <span>UPTIME_<b className="text-black font-bold">99.98%</b></span>
        <span>ITEMS_INDEXED_<b className="text-black font-bold">1 248 902</b></span>
        <span>READERS_TODAY_<b className="text-black font-bold">3 412</b></span>
      </div>
    </div>
  );
}
