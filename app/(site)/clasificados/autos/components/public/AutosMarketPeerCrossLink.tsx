"use client";

import Link from "next/link";
import type { AutosPublicMarketCopy } from "@/app/lib/clasificados/autos/autosPublicMarketCopy";

export function AutosMarketPeerCrossLink({
  copy,
  href,
  compact,
}: {
  copy: AutosPublicMarketCopy;
  href: string;
  compact?: boolean;
}) {
  return (
    <section
      className={
        compact
          ? "w-full"
          : "mx-auto w-full max-w-[min(100%,90rem)] px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:px-6"
      }
      aria-label={copy.peerCrossLinkTitle}
    >
      <div className="rounded-[20px] border border-[#7A1E2C]/18 bg-[#FFF7F2] p-4 shadow-[0_12px_32px_-18px_rgba(31,36,28,0.2)] sm:p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A1E2C]/75">Leonix Autos</p>
        <h2 className="mt-2 text-lg font-extrabold tracking-tight text-[#1E1810]">{copy.peerCrossLinkTitle}</h2>
        <p className="mt-2 text-sm leading-relaxed text-[#5C5346]">{copy.peerCrossLinkBody}</p>
        <Link
          href={href}
          className="mt-4 inline-flex min-h-[44px] items-center rounded-full bg-[#2A2620] px-5 text-xs font-bold text-[#FFFCF7] transition hover:bg-[#7A1E2C]"
        >
          {copy.peerCrossLinkCta}
        </Link>
      </div>
    </section>
  );
}
