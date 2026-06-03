import type { ReactNode } from "react";
import { CategoryStandardResultsPageShell } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardResultsPageShell";

/** Rentas results — listings-first shell (no scenic hero band). */
export function RentasResultsShell({ children }: { children: ReactNode }) {
  return <CategoryStandardResultsPageShell>{children}</CategoryStandardResultsPageShell>;
}
