"use client";

import { useState, useEffect, startTransition } from "react";

export default function SystemStrip() {
  const [lang, setLang] = useState<"en" | "it">("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("mv_lang");
      const next: "en" | "it" =
        saved === "it" || saved === "en"
          ? saved
          : navigator.language?.toLowerCase().startsWith("it")
            ? "it"
            : "en";
      startTransition(() => setLang(next));
    } catch {}
  }, []);

  const toggle = (l: "en" | "it") => {
    setLang(l);
    try { localStorage.setItem("mv_lang", l); } catch {}
  };

  return (
    <div className="flex items-center justify-between px-[34px] py-[11px] border-b border-black/12 font-mono text-[10.5px] font-semibold tracking-[0.13em] text-black/30 max-[920px]:px-[22px]">
      <div className="flex items-center gap-5 whitespace-nowrap max-[560px]:gap-3">
        <span>
          <span className="inline-block w-[7px] h-[7px] bg-terracotta align-middle mr-[7px]" aria-hidden="true" />
          <b className="text-black/55">LIVE</b>
        </span>
        <span>NODE_<b className="text-black/55">multivrss_alpha</b></span>
        <span>BUILD_<b className="text-black/55">0.1.0</b></span>
      </div>
      <div className="flex items-center gap-[9px]" role="group" aria-label="Language">
        <button
          onClick={() => toggle("it")}
          className={`border-0 bg-transparent font-mono text-[10.5px] font-bold tracking-[0.16em] transition-colors px-0.5 ${
            lang === "it" ? "text-terracotta" : "text-black/30 hover:text-black"
          }`}
        >
          IT
        </button>
        <span className="text-black/12" aria-hidden="true">/</span>
        <button
          onClick={() => toggle("en")}
          className={`border-0 bg-transparent font-mono text-[10.5px] font-bold tracking-[0.16em] transition-colors px-0.5 ${
            lang === "en" ? "text-terracotta" : "text-black/30 hover:text-black"
          }`}
        >
          EN
        </button>
      </div>
    </div>
  );
}
