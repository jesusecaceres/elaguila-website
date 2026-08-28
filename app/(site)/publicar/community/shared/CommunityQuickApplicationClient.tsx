"use client";

import ComunidadQuickApplication from "@/app/(site)/publicar/comunidad/quick/ComunidadQuickApplication";
import ClasesQuickApplication from "@/app/(site)/publicar/clases/quick/ClasesQuickApplication";

import type { CommunityKind } from "./constants/communitySessionKeys";

/**
 * Gate 0 (community category isolation) — this file is now a narrow routing
 * boundary only. All Comunidad and Clases editor composition (form sections,
 * taxonomy usage, cost/schedule/link logic) lives in each category's own
 * ComunidadQuickApplication.tsx / ClasesQuickApplication.tsx. Kept in place
 * (rather than deleted) for backward compatibility with any existing
 * references to this path; new call sites should import the category-owned
 * components directly instead of going through this dispatcher.
 */
export default function CommunityQuickApplicationClient({ kind }: { kind: CommunityKind }) {
  if (kind === "clases") {
    return <ClasesQuickApplication />;
  }
  return <ComunidadQuickApplication />;
}
