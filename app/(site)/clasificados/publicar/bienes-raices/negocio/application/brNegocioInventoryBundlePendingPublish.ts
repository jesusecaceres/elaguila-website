/**
 * BR bundle pending-row creation — parent publish + immediate pending child rows (pre-checkout).
 * Mirrors Autos dealer bundle conceptually; children stay pending until payment/webhook.
 */

import type { BrPropertyInventoryRowLike } from "@/app/clasificados/lib/leonixBrPropertyInventoryPolicy";
import { publishLeonixListingFromAgenteResidencialDraft } from "@/app/clasificados/lib/leonixPublishRealEstateFromDraftState";
import type { BrNegocioPublishInventoryContext } from "@/app/clasificados/lib/leonixBrPropertyInventoryPolicy";
import { fetchBrOwnerInventoryListingRows } from "@/app/clasificados/bienes-raices/lib/fetchBrOwnerInventoryListingsBrowser";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { BR_INVENTORY_PACK_MAX_CHILDREN } from "@/app/lib/listingPlans/publishCheckoutCheckpoint";
import type { AgenteIndividualResidencialFormState } from "../agente-individual/schema/agenteIndividualResidencialFormState";
import type { BrNegocioAdditionalInventoryPropertyDraft } from "./brNegocioAdditionalInventoryDraft";
import { mergeAdditionalInventoryProperties } from "./brNegocioAdditionalInventoryDraft";
import {
  buildChildInventoryEditorState,
  childInventorySaveHasErrors,
  validateAgenteChildInventoryForSave,
} from "./brNegocioChildInventoryFormMapping";

export const BR_BUNDLE_PENDING_PUBLISH_SESSION_KEY = "lx-br-bundle-pending-publish-v1" as const;

export type BrBundlePendingPublishChildProof = {
  draftId: string;
  listingId: string;
  leonixAdId: string | null;
  title: string;
};

export type BrBundlePendingPublishSessionProof = {
  parentListingId: string;
  parentGroupId: string;
  children: BrBundlePendingPublishChildProof[];
  createdAt: string;
};

export type BrBundlePendingPublishChildResult = {
  id: string;
  leonixAdId: string | null;
  title: string;
  inventoryRole: "inventory_property";
  draftId: string;
};

export type BrBundlePendingPublishResult = {
  ok: boolean;
  parentListingId: string;
  parentGroupId: string;
  createdChildren: BrBundlePendingPublishChildResult[];
  skipped: number;
  warnings: string[];
  error?: string;
};

const BUNDLE_PARTIAL_WARNING = {
  en: "Your main listing was saved. One or more inventory properties could not be prepared. You can continue with the main listing or contact Leonix.",
  es: "Tu anuncio principal fue guardado. Una o más propiedades de inventario no se pudieron preparar. Puedes continuar con el anuncio principal o contactar a Leonix.",
} as const;

function normalizeTitleKey(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

function isPublishableChildDraft(
  draft: BrNegocioAdditionalInventoryPropertyDraft,
  parentDraft: AgenteIndividualResidencialFormState,
  lang: "es" | "en",
): boolean {
  const state = buildChildInventoryEditorState(parentDraft, draft, lang);
  const errors = validateAgenteChildInventoryForSave(state, lang);
  return !childInventorySaveHasErrors(errors);
}

function publishableChildDrafts(
  raw: BrNegocioAdditionalInventoryPropertyDraft[],
  parentDraft: AgenteIndividualResidencialFormState,
  lang: "es" | "en",
): BrNegocioAdditionalInventoryPropertyDraft[] {
  const merged = mergeAdditionalInventoryProperties(raw).slice(0, BR_INVENTORY_PACK_MAX_CHILDREN);
  return merged.filter((d) => isPublishableChildDraft(d, parentDraft, lang));
}

export function readBrBundlePendingPublishProof(parentListingId: string): BrBundlePendingPublishSessionProof | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(BR_BUNDLE_PENDING_PUBLISH_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BrBundlePendingPublishSessionProof;
    if (parsed.parentListingId !== parentListingId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeBrBundlePendingPublishProof(proof: BrBundlePendingPublishSessionProof): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(BR_BUNDLE_PENDING_PUBLISH_SESSION_KEY, JSON.stringify(proof));
  } catch {
    /* ignore */
  }
}

async function resolveParentGroupId(parentListingId: string, fallbackGroupId?: string | null): Promise<string> {
  const fallback = fallbackGroupId?.trim() || parentListingId;
  try {
    const sb = createSupabaseBrowserClient();
    const { data } = await sb
      .from("listings")
      .select("br_inventory_group_id")
      .eq("id", parentListingId)
      .maybeSingle();
    const group = (data as { br_inventory_group_id?: string | null } | null)?.br_inventory_group_id?.trim();
    return group || fallback;
  } catch {
    return fallback;
  }
}

async function fetchExistingChildTitleKeys(
  ownerId: string,
  parentListingId: string,
): Promise<Set<string>> {
  const rows = await fetchBrOwnerInventoryListingRows(ownerId);
  const keys = new Set<string>();
  for (const row of rows) {
    if (row.inventory_role !== "inventory_property") continue;
    if (row.br_inventory_parent_listing_id?.trim() !== parentListingId) continue;
    const title = (row as BrPropertyInventoryRowLike & { title?: string | null }).title ?? "";
    if (title.trim()) keys.add(normalizeTitleKey(title));
  }
  return keys;
}

async function fetchLeonixAdId(listingId: string): Promise<string | null> {
  try {
    const sb = createSupabaseBrowserClient();
    const { data } = await sb.from("listings").select("leonix_ad_id").eq("id", listingId).maybeSingle();
    return (data as { leonix_ad_id?: string | null } | null)?.leonix_ad_id?.trim() || null;
  } catch {
    return null;
  }
}

/**
 * After parent pending publish, create pending child listing rows grouped under parent.
 * Does not activate rows or call Stripe/webhooks.
 */
export async function publishBrAgenteInventoryBundlePendingRows(input: {
  parentListingId: string;
  parentGroupId?: string | null;
  parentDraft: AgenteIndividualResidencialFormState;
  childDrafts: BrNegocioAdditionalInventoryPropertyDraft[];
  lang: "es" | "en";
  ownerUserId?: string | null;
}): Promise<BrBundlePendingPublishResult> {
  const parentListingId = input.parentListingId.trim();
  const warnings: string[] = [];
  const createdChildren: BrBundlePendingPublishChildResult[] = [];

  if (!parentListingId) {
    return {
      ok: false,
      parentListingId: "",
      parentGroupId: "",
      createdChildren: [],
      skipped: 0,
      warnings,
      error: input.lang === "es" ? "Falta el ID del anuncio principal." : "Parent listing id is missing.",
    };
  }

  const parentGroupId = await resolveParentGroupId(parentListingId, input.parentGroupId);
  const publishable = publishableChildDrafts(input.childDrafts, input.parentDraft, input.lang);
  const skipped = Math.max(0, input.childDrafts.length - publishable.length);

  if (!publishable.length) {
    return {
      ok: true,
      parentListingId,
      parentGroupId,
      createdChildren,
      skipped,
      warnings,
    };
  }

  const sessionProof = readBrBundlePendingPublishProof(parentListingId);
  const sessionDraftIds = new Set(sessionProof?.children.map((c) => c.draftId) ?? []);

  let ownerId = input.ownerUserId?.trim() || "";
  if (!ownerId) {
    try {
      const sb = createSupabaseBrowserClient();
      const { data: auth } = await sb.auth.getUser();
      ownerId = auth.user?.id?.trim() ?? "";
    } catch {
      ownerId = "";
    }
  }

  const existingTitleKeys = ownerId ? await fetchExistingChildTitleKeys(ownerId, parentListingId) : new Set<string>();

  for (const childDraft of publishable) {
    if (sessionDraftIds.has(childDraft.id)) {
      const hit = sessionProof?.children.find((c) => c.draftId === childDraft.id);
      if (hit) {
        createdChildren.push({
          id: hit.listingId,
          leonixAdId: hit.leonixAdId,
          title: hit.title,
          inventoryRole: "inventory_property",
          draftId: childDraft.id,
        });
        continue;
      }
    }

    const childState = buildChildInventoryEditorState(input.parentDraft, childDraft, input.lang);
    const titleKey = normalizeTitleKey(childState.titulo);
    if (titleKey && existingTitleKeys.has(titleKey)) {
      warnings.push(
        input.lang === "es"
          ? `La propiedad «${childState.titulo.trim()}» ya existe en el inventario pendiente; se omitió duplicado.`
          : `Property «${childState.titulo.trim()}» already exists in pending inventory; skipped duplicate.`,
      );
      continue;
    }

    const inventory: BrNegocioPublishInventoryContext = {
      mode: "add",
      parentListingId,
      brInventoryGroupId: parentGroupId,
    };

    const result = await publishLeonixListingFromAgenteResidencialDraft(childState, input.lang, inventory, {
      activationMode: "pending_payment",
    });

    if (!result.ok) {
      warnings.push(
        input.lang === "es"
          ? `No se pudo preparar «${childState.titulo.trim()}»: ${result.error}`
          : `Could not prepare «${childState.titulo.trim()}»: ${result.error}`,
      );
      continue;
    }

    const childListingId = result.listingId.trim();
    if (!childListingId || childListingId === parentListingId) {
      warnings.push(
        input.lang === "es"
          ? `La propiedad «${childState.titulo.trim()}» no recibió un UUID de listado independiente.`
          : `Property «${childState.titulo.trim()}» did not receive an independent listing UUID.`,
      );
      continue;
    }

    const leonixAdId = await fetchLeonixAdId(childListingId);
    createdChildren.push({
      id: childListingId,
      leonixAdId,
      title: childState.titulo.trim() || childDraft.title.trim(),
      inventoryRole: "inventory_property",
      draftId: childDraft.id,
    });
    if (titleKey) existingTitleKeys.add(titleKey);
    if (result.warnings.length) warnings.push(...result.warnings);
  }

  const expected = publishable.length;
  const createdCount = createdChildren.length;
  const partialFailure = createdCount < expected;

  if (partialFailure) {
    warnings.push(BUNDLE_PARTIAL_WARNING[input.lang]);
  }

  if (createdChildren.length) {
    writeBrBundlePendingPublishProof({
      parentListingId,
      parentGroupId,
      children: createdChildren.map((c) => ({
        draftId: c.draftId,
        listingId: c.id,
        leonixAdId: c.leonixAdId,
        title: c.title,
      })),
      createdAt: new Date().toISOString(),
    });
  }

  return {
    ok: !partialFailure,
    parentListingId,
    parentGroupId,
    createdChildren,
    skipped,
    warnings,
    error: partialFailure ? BUNDLE_PARTIAL_WARNING[input.lang] : undefined,
  };
}
