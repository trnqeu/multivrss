import { Archivo } from "next/font/google";

const archivo = Archivo({ subsets: ["latin"], weight: "600", display: "swap" });

// trnq.eu wordmark: Archivo 600 with the site's accent dot, as in trnq.eu's header.
export default function TrnqWordmark({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`${archivo.className} font-semibold tracking-[-0.01em] leading-none ${className}`}>
      trnq<span className="text-[#3a4a6b]">.</span>eu
    </span>
  );
}
