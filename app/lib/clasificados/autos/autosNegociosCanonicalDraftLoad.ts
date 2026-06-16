import {
  loadAutosNegociosDraftResolved,
  type AutosNegociosDraftV1,
} from "@/app/(site)/clasificados/autos/negocios/lib/autosNegociosDraftStorage";
import {
  migrateLegacyAutosNegociosDraftJsonToNamespace,
  resolveAutosNegociosDraftNamespace,
} from "@/app/(site)/clasificados/autos/negocios/lib/autosNegociosDraftNamespace";
import { peekAutosDraftNamespaceHint } from "@/app/clasificados/autos/shared/lib/autosDraftPreviewNamespaceHint";

/**
 * Single canonical Autos Negocios active-draft loader for preview + editor resume.
 * Matches preview namespace hint order so edit-back restores the same payload preview displayed.
 */
export async function loadAutosNegociosCanonicalActiveDraft(): Promise<AutosNegociosDraftV1 | null> {
  const hint = peekAutosDraftNamespaceHint("negocios");
  const resolved = await resolveAutosNegociosDraftNamespace();
  migrateLegacyAutosNegociosDraftJsonToNamespace(resolved);

  if (hint) {
    migrateLegacyAutosNegociosDraftJsonToNamespace(hint);
    const fromHint = await loadAutosNegociosDraftResolved(hint);
    if (fromHint) return fromHint;
  }

  migrateLegacyAutosNegociosDraftJsonToNamespace(resolved);
  return loadAutosNegociosDraftResolved(resolved);
}
