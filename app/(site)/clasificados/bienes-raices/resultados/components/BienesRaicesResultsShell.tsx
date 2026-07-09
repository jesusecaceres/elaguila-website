import type { ReactNode } from "react";
import { BR_RESULTS_PAGE_BG, BR_RESULTS_SHELL } from "@/app/clasificados/bienes-raices/shared/bienesRaicesLeonixPublicUi";

/** Bienes Raíces results — Rentas-style cream shell with warm background. */
export function BienesRaicesResultsShell({ children }: { children: ReactNode }) {
  return (
    <div className={BR_RESULTS_PAGE_BG}>
      <div className={BR_RESULTS_SHELL}>{children}</div>
    </div>
  );
}
