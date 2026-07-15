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
import {
  createEmptyAgenteIndividualResidencialState,
  type AgenteIndividualResidencialFormState,
} from "../../schema/agenteIndividualResidencialFormState";
import { persistAgenteResApplicationDraftQuiet } from "./previewDraft";

const OWNER_LISTING_SELECT =
  "id, owner_id, title, description, city, price, images, detail_pairs, listing_json, contact_json, seller_type, business_name, business_meta, br_inventory_group_id, br_inventory_parent_listing_id, inventory_role, leonix_ad_id, status, is_published";

export type BienesDashboardHydrationResult = { ok: true } | { ok: false; userMessage: string };

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

function listingJsonBrInventoryPackEnabled(listingJson: unknown): boolean {
  if (!listingJson || typeof listingJson !== "object") return false;
  const o = listingJson as Record<string, unknown>;
  return o.inventoryPackEnabled === true || o.inventoryUpgradeEnabled === true;
}

export function bienesPublishedRowToAgenteApplicationDraft(input: {
  row: Record<string, unknown>;
  childRows?: readonly Record<string, unknown>[];
}): AgenteIndividualResidencialFormState {
  const row = input.row;
  const contract = parseLeonixListingContract(row.detail_pairs);
  const base = createEmptyAgenteIndividualResidencialState();
  const photos = durableHttpUrls(row.images);
  const priceNum = Number(row.price);
  const categoria =
    contract.categoriaPropiedad === "comercial" || contract.categoriaPropiedad === "terreno_lote"
      ? contract.categoriaPropiedad
      : "residencial";

  const children = (input.childRows ?? [])
    .filter((r) => isBrInventoryProperty(r as Parameters<typeof isBrInventoryProperty>[0]))
    .slice(0, 4)
    .map((r) => mapChildListingRowToDraft(r as Parameters<typeof mapChildListingRowToDraft>[0]));

  const packEnabled = children.length > 0;

  return {
    ...base,
    categoriaPropiedad: categoria,
    titulo: trim(row.title),
    descripcionPrincipal: stripLeonixPublishedDescriptionBody(trim(row.description)),
    precio: Number.isFinite(priceNum) && priceNum > 0 ? String(Math.round(priceNum)) : "",
    ciudad: trim(row.city),
    fotosDataUrls: photos,
    fotoPortadaIndex: 0,
    inventoryPackAccepted: false,
    additionalInventoryProperties: children,
    confirmListingAccurate: true,
    confirmPhotosRepresentItem: photos.length > 0,
    confirmCommunityRules: true,
    confirmPaymentAfterPreview: true,
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
    persistAgenteResApplicationDraftQuiet(hydrated, { applicationInstanceId: input.applicationInstanceId ?? null });
    return { ok: true };
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
