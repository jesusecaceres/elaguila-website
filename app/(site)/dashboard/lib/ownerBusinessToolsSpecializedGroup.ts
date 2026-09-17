/**
 * Shared Specialized-Tools Gate — the one place that turns
 * `OwnerEntityCapabilities.specialized.businessTools` into a real, renderable
 * `OwnerEntitySpecializedGroup` for `OwnerEntityWorkspace`.
 *
 * Before this file, `specialized.businessTools` was declared "specialized" in
 * `ownerEntityCapabilityRegistry.ts` for servicios/restaurantes/autos-negocios/
 * bienes-raices-negocio but had zero real consumers — a BUILT_NOT_WIRED capability. This is the
 * smallest adapter that wires it: one canonical destination (`/dashboard/business-tools`, the
 * same route the sidebar's "Negocio" nav item already links to — never a second route), one
 * canonical label (matching `dashboardShellCopy(lang).businessTools` exactly, so the owner sees
 * the same name in the sidebar and in the workspace), reused by every category caller instead of
 * each one inventing its own copy/href.
 */
import type { ActionItem } from "../components/DashboardListingActionBar";
import type { OwnerEntitySpecializedGroup } from "../components/OwnerEntityWorkspace";
import { isLiveCapability, type CapabilityState } from "./ownerEntityCapabilityRegistry";

type Lang = "es" | "en";

const BUSINESS_TOOLS_LABEL: Record<Lang, string> = {
  es: "Herramientas de negocio",
  en: "Business tools",
};

export function ownerBusinessToolsHref(lang: Lang): string {
  return `/dashboard/business-tools?lang=${lang}`;
}

/** Returns a ready-to-use specialized group when the category's registry truth says Business
 * Tools is real for this listing/category — `null` when it is unsupported/unproven, so a caller
 * never has to duplicate the `isLiveCapability` check itself. */
export function ownerBusinessToolsSpecializedGroup(
  businessToolsCapability: CapabilityState,
  lang: Lang,
): OwnerEntitySpecializedGroup | null {
  if (!isLiveCapability(businessToolsCapability)) return null;
  const label = BUSINESS_TOOLS_LABEL[lang];
  const action: ActionItem = { href: ownerBusinessToolsHref(lang), label, tone: "premium" };
  return { title: label, actions: [action] };
}
