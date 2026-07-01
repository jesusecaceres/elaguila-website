import type { ReactNode } from "react";
import { RENTAS_PUBLIC_SHELL } from "../shared/rentasLeonixPublicUi";

/** Page shell — Leonix cream, 1080px max, header-safe top spacing. */
export function RentasLandingShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#FAF6EE] text-[#1F241C]">
      <div
        className={`${RENTAS_PUBLIC_SHELL} pt-[calc(2.75rem+env(safe-area-inset-top))] sm:pt-[calc(3rem+env(safe-area-inset-top))]`}
      >
        {children}
      </div>
    </div>
  );
}
