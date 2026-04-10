"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { EnVentaDetailFieldCopyMap, EnVentaDetailFieldUi } from "@/app/lib/clasificados/enVentaDetailFieldUiTypes";

export type { EnVentaDetailFieldCopyMap, EnVentaDetailFieldUi };

const EnVentaDetailFieldCopyContext = createContext<EnVentaDetailFieldCopyMap | null>(null);

export function EnVentaDetailFieldCopyProvider({
  value,
  children,
}: {
  value: EnVentaDetailFieldCopyMap;
  children: ReactNode;
}) {
  return (
    <EnVentaDetailFieldCopyContext.Provider value={value}>{children}</EnVentaDetailFieldCopyContext.Provider>
  );
}

/** Resolved copy for one `DETAIL_FIELDS["en-venta"]` key, or `undefined` if provider missing. */
export function useEnVentaDetailField(key: string): EnVentaDetailFieldUi | undefined {
  const ctx = useContext(EnVentaDetailFieldCopyContext);
  if (!ctx) return undefined;
  return ctx[key];
}
