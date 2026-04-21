import "server-only";

import { revalidatePath } from "next/cache";

/** Invalidate merged results, landing inventory hooks, and a specific offer detail. */
export function revalidateViajesStagedPublicSurfaces(slug?: string | null): void {
  revalidatePath("/clasificados/viajes/resultados");
  revalidatePath("/clasificados/viajes");
  const s = slug?.trim();
  if (s) revalidatePath(`/clasificados/viajes/oferta/${s}`);
}
