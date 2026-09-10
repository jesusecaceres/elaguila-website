/**
 * Published Bienes negocio parent listing → Agente application draft (dashboard edit hydration).
 * Gate GLOBAL-MONETIZED-CATEGORY-STACK-01-BIENES-PROOF
 */

import { fetchBrOwnerInventoryListingRows } from "@/app/clasificados/bienes-raices/lib/fetchBrOwnerInventoryListingsBrowser";
import { parseLeonixListingContract } from "@/app/clasificados/lib/leonixRealEstateListingContract";
import {
  getBrInventoryGroupId,
  getBrInventoryParentListingId,
  getBrInventoryRole,
  isBrInventoryProperty,
} from "@/app/clasificados/lib/leonixBrPropertyInventoryPolicy";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { listingsQueryWithSelectShrink } from "@/app/(site)/clasificados/lib/listingsSelectShrink";
import { stripLeonixPublishedDescriptionBody } from "@/app/clasificados/lib/leonixListingGalleryMarker";
import {
  createEmptyBrNegocioAdditionalInventoryPropertyDraft,
  normalizeChildInventoryDraft,
  type BrNegocioAdditionalInventoryPropertyDraft,
} from "../../../application/brNegocioAdditionalInventoryDraft";
import type { AgenteIndividualResidencialFormState } from "../../schema/agenteIndividualResidencialFormState";
import { parseBienesAgenteResidencialPublishedState } from "./parseBienesAgenteResidencialPublishedState";

const OWNER_LISTING_SELECT =
  // Package A closure — `updated_at` added so callers can anchor the local edit workspace to
  // the row version it was hydrated from (draftWorkspaceContract Rule 3). The select-shrink
  // wrapper drops it gracefully on older DBs (sourceUpdatedAt then resolves null → the
  // contract degrades to today's local-wins behavior).
  // Gate BIENES-NEGOCIO-1 — `contact_phone`, `contact_email` and `zip` added so the shared
  // published-row parser's fallback chains resolve for older listings whose `business_meta` is
  // thin. Without them the parser would legitimately read empty and the save would null the very
  // columns this gate exists to protect. (Same addition the sealed `733408dd` made.)
  "id, owner_id, title, description, city, price, zip, images, detail_pairs, listing_json, contact_json, contact_phone, contact_email, seller_type, business_name, business_meta, br_inventory_group_id, br_inventory_parent_listing_id, inventory_role, leonix_ad_id, status, is_published, updated_at";

export type BienesDashboardHydrationResult =
  | { ok: true; state: AgenteIndividualResidencialFormState; sourceUpdatedAt: string | null }
  | { ok: false; userMessage: string };

function trim(v: unknown): string {
  return v == null ? "" : typeof v === "string" ? v.trim() : String(v).trim();
}

function durableHttpUrls(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    let url = "";
    if (typeof item === "string") url = item.trim();
    else if (item && typeof item === "object") {
      const o = item as Record<string, unknown>;
      url = trim(o.url ?? o.src ?? o.path);
    }
    if (!url.startsWith("http://") && !url.startsWith("https://")) continue;
    if (!out.includes(url)) out.push(url);
  }
  return out;
}

function pairValue(detailPairs: unknown, label: string): string {
  if (!Array.isArray(detailPairs)) return "";
  for (const p of detailPairs) {
    if (!p || typeof p !== "object") continue;
    const o = p as { label?: string; value?: string };
    if (trim(o.label).toLowerCase() === label.toLowerCase()) return trim(o.value);
  }
  return "";
}

function mapChildListingRowToDraft(row: {
  id: string;
  title?: string | null;
  description?: string | null;
  city?: string | null;
  price?: number | string | null;
  images?: unknown;
  detail_pairs?: unknown;
}): BrNegocioAdditionalInventoryPropertyDraft {
  const draft = createEmptyBrNegocioAdditionalInventoryPropertyDraft(`br-db-child-${row.id}`);
  const photos = durableHttpUrls(row.images);
  const priceNum = Number(row.price);
  const priceStr = Number.isFinite(priceNum) && priceNum > 0 ? String(Math.round(priceNum)) : "";
  const contract = parseLeonixListingContract(row.detail_pairs);
  return normalizeChildInventoryDraft({
    ...draft,
    title: trim(row.title),
    price: priceStr,
    city: trim(row.city),
    description: stripLeonixPublishedDescriptionBody(trim(row.description)),
    photoUrls: photos,
    primaryPhotoIndex: 0,
    mainPhotoUrl: photos[0] ?? "",
    propertyType:
      contract.categoriaPropiedad === "comercial"
        ? "comercial"
        : contract.categoriaPropiedad === "terreno_lote"
          ? "terreno"
          : "casa",
    bedrooms: pairValue(row.detail_pairs, "Recámaras") || pairValue(row.detail_pairs, "Bedrooms"),
    bathrooms: pairValue(row.detail_pairs, "Baños") || pairValue(row.detail_pairs, "Bathrooms"),
    interiorSqft: pairValue(row.detail_pairs, "Sq ft") || pairValue(row.detail_pairs, "Interior"),
    lotSqft: pairValue(row.detail_pairs, "Lote") || pairValue(row.detail_pairs, "Lot"),
  });
}

/**
 * Gate BIENES-NEGOCIO-1 (P0) — this mapper used to be a SECOND, much thinner reimplementation of
 * "read a published row back into form state". It restored 9 things out of ~150 form fields and
 * left every other field at its EMPTY-DRAFT default, which made an ordinary owner edit destructive:
 * `buildEditablePatch` writes `business_name` and `business_meta` unconditionally, and with an
 * empty identity block `negocioContactAndBusinessName` falls through to
 * `businessName: titulo, phone: null, email: null` — so saving replaced the brokerage/office/team
 * name with the property title and NULLED `contact_phone` and `contact_email` on the published row.
 * Address, HOA/community/pet/rental/parking rules, highlights, agent licence and every phone were
 * likewise emptied.
 *
 * It now delegates to `parseBienesAgenteResidencialPublishedState` — the SAME parser the public
 * detail shell uses — and merges only the fields that are genuinely Bienes-inventory-specific
 * (child properties + pack confirmation) on top. This is the sealed `733408dd` architecture applied
 * to this branch's own runtime; see that module's header for the deltas that were deliberately not
 * ported.
 */
export function bienesPublishedRowToAgenteApplicationDraft(input: {
  row: Record<string, unknown>;
  childRows?: readonly Record<string, unknown>[];
}): AgenteIndividualResidencialFormState {
  const row = input.row;
  const priceNum = Number(row.price);
  const photos = durableHttpUrls(row.images);

  // The shared parser speaks the public shell's row shape; adapt this DB row to it without
  // reinterpreting anything. `price` is a number column here and a formatted label there — the
  // parser's `numberString()` reads either.
  const shared = parseBienesAgenteResidencialPublishedState({
    listing: {
      id: trim(row.id),
      title: { es: trim(row.title), en: trim(row.title) },
      priceLabel: {
        es: Number.isFinite(priceNum) && priceNum > 0 ? String(Math.round(priceNum)) : "",
        en: Number.isFinite(priceNum) && priceNum > 0 ? String(Math.round(priceNum)) : "",
      },
      city: trim(row.city),
      blurb: { es: trim(row.description), en: trim(row.description) },
      images: photos,
      business_name: trim(row.business_name) || null,
      business_meta: typeof row.business_meta === "string" ? row.business_meta : (row.business_meta as string | null) ?? null,
      contact_phone: trim(row.contact_phone) || null,
      contact_email: trim(row.contact_email) || null,
      detailPairs: row.detail_pairs,
      owner_id: trim(row.owner_id) || null,
      leonix_ad_id: trim(row.leonix_ad_id) || null,
      br_inventory_group_id: trim(row.br_inventory_group_id) || null,
      br_inventory_parent_listing_id: trim(row.br_inventory_parent_listing_id) || null,
      inventory_role: trim(row.inventory_role) || null,
      zip: trim(row.zip) || null,
    },
    // The parent IS this row for a `main` listing; the parser's parentIdentity fallback chain
    // then resolves business identity from the row's own columns when `business_meta` is thin.
    parentIdentity: {
      id: trim(row.id),
      business_name: trim(row.business_name) || null,
      business_meta: typeof row.business_meta === "string" ? row.business_meta : (row.business_meta as string | null) ?? null,
      contact_phone: trim(row.contact_phone) || null,
      contact_email: trim(row.contact_email) || null,
    },
    lang: "es",
  });

  // Globalization Package B (Gate B4) — the hard-coded `.slice(0, 4)` hydration cap is GONE:
  // every owned child row hydrates into the editor. Visibility ≠ activation: how many
  // children may be ACTIVE is the payment service's entitlement truth
  // (brListingPaymentService.ts), enforced server-side — hiding rows 5+ from their owner was
  // never a capacity rule, it silently orphaned real listings (ledger defect D1).
  const children = (input.childRows ?? [])
    .filter((r) => isBrInventoryProperty(r as Parameters<typeof isBrInventoryProperty>[0]))
    .map((r) => mapChildListingRowToDraft(r as Parameters<typeof mapChildListingRowToDraft>[0]));

  const packEnabled = children.length > 0;

  return {
    ...shared,
    // Bienes-inventory-specific truth the shared parser has no concept of.
    inventoryPackAccepted: false,
    additionalInventoryProperties: children,
    confirmInventoryPackPricing: packEnabled,
  };
}

export async function hydrateBienesAgenteListingForDashboardEdit(input: {
  listingId: string;
  lang: "es" | "en";
  applicationInstanceId?: string | null;
}): Promise<BienesDashboardHydrationResult> {
  const listingId = input.listingId.trim();
  if (!listingId) {
    return {
      ok: false,
      userMessage:
        input.lang === "es" ? "No se encontró el anuncio de Bienes Raíces." : "Real estate listing not found.",
    };
  }

  try {
    const sb = createSupabaseBrowserClient();
    const { data: auth, error: authError } = await sb.auth.getUser();
    const userId = auth.user?.id?.trim();
    if (authError || !userId) {
      return {
        ok: false,
        userMessage:
          input.lang === "es"
            ? "Inicia sesión para editar tu anuncio de Bienes Raíces."
            : "Sign in to edit your real estate listing.",
      };
    }

    const res = await listingsQueryWithSelectShrink(OWNER_LISTING_SELECT, async (cols) => {
      const q = await sb
        .from("listings")
        .select(cols)
        .eq("id", listingId)
        .eq("owner_id", userId)
        .eq("category", "bienes-raices")
        .maybeSingle();
      return { data: q.data as Record<string, unknown> | null, error: q.error ? { message: q.error.message } : null };
    });

    if (res.error || !res.data) {
      return {
        ok: false,
        userMessage:
          input.lang === "es"
            ? "No se pudo cargar el anuncio para editar."
            : "Could not load the listing for editing.",
      };
    }

    const parentRow = res.data;
    const groupId = getBrInventoryGroupId(parentRow as Parameters<typeof getBrInventoryGroupId>[0]) ?? listingId;
    const allRows = await fetchBrOwnerInventoryListingRows(userId);
    const childRows = allRows
      .filter((r) => {
        const role = getBrInventoryRole(r);
        if (role !== "inventory_property") return false;
        const parentId = getBrInventoryParentListingId(r);
        const rowGroup = getBrInventoryGroupId(r);
        return parentId === listingId || rowGroup === groupId;
      })
      .map((r) => r as unknown as Record<string, unknown>);

    const hydrated = bienesPublishedRowToAgenteApplicationDraft({ row: parentRow, childRows });
    return { ok: true, state: hydrated, sourceUpdatedAt: trim(parentRow.updated_at) || null };
  } catch {
    return {
      ok: false,
      userMessage:
        input.lang === "es"
          ? "No se pudo cargar el anuncio para editar."
          : "Could not load the listing for editing.",
    };
  }
}
