import type { ReactNode } from "react";
import { RENTAS_RESULTS_PAGE_BG, RENTAS_RESULTS_SHELL } from "@/app/clasificados/rentas/shared/rentasLeonixPublicUi";

/** Rentas results — listings-first shell (no scenic hero band). */
export function RentasResultsShell({ children }: { children: ReactNode }) {
  return (
    <div className={RENTAS_RESULTS_PAGE_BG}>
      <div className={`${RENTAS_RESULTS_SHELL} relative`}>{children}</div>
    </div>
  );
}
