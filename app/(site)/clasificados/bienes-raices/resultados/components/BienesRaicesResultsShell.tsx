import type { ReactNode } from "react";
import { CategoryStandardResultsPageShell } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardResultsPageShell";

/** Bienes Raíces results — listings-first Leonix cream shell (CAT-STD-ALL). */
export function BienesRaicesResultsShell({ children }: { children: ReactNode }) {
  return <CategoryStandardResultsPageShell maxWidthClass="max-w-[1080px]">{children}</CategoryStandardResultsPageShell>;
}
