import { NextResponse, type NextRequest } from "next/server";
import { getBearerUserId } from "@/app/api/clasificados/_lib/bearerUser";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import {
  buildPublishParamsFromAgenteResidencialDraft,
} from "@/app/clasificados/lib/leonixPublishRealEstateFromDraftState";
import type { AgenteIndividualResidencialFormState } from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteIndividualResidencialFormState";
import type { BrNegocioAdditionalInventoryPropertyDraft } from "@/app/clasificados/publicar/bienes-raices/negocio/application/brNegocioAdditionalInventoryDraft";
import { buildChildInventoryEditorState } from "@/app/clasificados/publicar/bienes-raices/negocio/application/brNegocioChildInventoryFormMapping";
import { parseLeonixListingContract } from "@/app/clasificados/lib/leonixRealEstateListingContract";
import {
  leonixHttpsGalleryUrlEligibleForDirectPersist,
  type PublishLeonixRealEstateListingCoreParams,
} from "@/app/clasificados/lib/leonixPublishRealEstateListingCore";
import {
  prepareLeonixListingDescriptionForPublish,
  prepareLeonixListingTitleForPublish,
  toLeonixListingsDescriptionForDb,
} from "@/app/clasificados/lib/leonixPublishPublicDescription";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Body = {
  listingId?: string | null;
  leonixAdId?: string | null;
  lang?: "es" | "en" | null;
  draft?: unknown;
};

type ListingRow = {
  id: string;
  owner_id?: string | null;
  category?: string | null;
  seller_type?: string | null;
  status?: string | null;
  is_published?: boolean | null;
  published_at?: string | null;
  expires_at?: string | null;
  leonix_ad_id?: string | null;
  detail_pairs?: unknown;
  images?: unknown;
  br_inventory_group_id?: string | null;
  br_inventory_parent_listing_id?: string | null;
  inventory_role?: string | null;
};

function trim(raw: unknown): string {
  return typeof raw === "string" ? raw.trim() : raw == null ? "" : String(raw).trim();
}

function mergeDetailPairs(existing: unknown, next: Array<{ label: string; value: string }>): Array<{ label: string; value: string }> {
  const out: Array<{ label: string; value: string }> = [];
  const nextByLabel = new Map(next.map((p) => [p.label, p]));
  const seen = new Set<string>();
  if (Array.isArray(existing)) {
    for (const item of existing) {
      if (!item || typeof item !== "object") continue;
      const label = trim((item as Record<string, unknown>).label);
      const value = trim((item as Record<string, unknown>).value);
      if (!label) continue;
      const replacement = nextByLabel.get(label);
      if (replacement) {
        out.push(replacement);
        seen.add(label);
      } else if (value) {
        out.push({ label, value });
      }
    }
  }
  for (const p of next) {
    if (!seen.has(p.label)) out.push(p);
  }
  return out;
}

function imagesArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") {
        const obj = item as Record<string, unknown>;
        return trim(obj.url ?? obj.src ?? obj.path);
      }
      return "";
    })
    .filter(Boolean);
}

function dataUrlToBlob(src: string): { bytes: Buffer; contentType: string } {
  const comma = src.indexOf(",");
  if (comma === -1) throw new Error("invalid_data_url");
  const header = src.slice(0, comma);
  const payload = src.slice(comma + 1);
  const contentType = /^data:([^;,]+)/i.exec(header)?.[1]?.trim() || "application/octet-stream";
  const bytes = /;base64/i.test(header)
    ? Buffer.from(payload, "base64")
    : Buffer.from(decodeURIComponent(payload), "utf8");
  return { bytes, contentType };
}

async function sourceToUpload(src: string): Promise<{ bytes: Buffer; contentType: string }> {
  const s = src.trim();
  if (s.startsWith("data:")) return dataUrlToBlob(s);
  if (s.startsWith("blob:")) throw new Error("blob_url_not_persistable");
  const res = await fetch(s);
  if (!res.ok) throw new Error("image_fetch_failed");
  const contentType = res.headers.get("content-type") || "image/jpeg";
  const bytes = Buffer.from(await res.arrayBuffer());
  return { bytes, contentType };
}

async function resolvePublicImages(input: {
  supabase: ReturnType<typeof getAdminSupabase>;
  ownerId: string;
  listingId: string;
  imageSources: readonly string[];
  existingImages: unknown;
}): Promise<{ ok: true; images: string[] } | { ok: false; message: string }> {
  const ordered = input.imageSources.map(trim).filter(Boolean);
  if (!ordered.length) {
    const existing = imagesArray(input.existingImages);
    return existing.length ? { ok: true, images: existing } : { ok: false, message: "At least one photo is required." };
  }

  const out: string[] = [];
  const basePath = `${input.ownerId}/${input.listingId}/photos`;
  for (let i = 0; i < ordered.length; i++) {
    const src = ordered[i]!;
    if (leonixHttpsGalleryUrlEligibleForDirectPersist(src)) {
      out.push(src);
      continue;
    }
    try {
      const upload = await sourceToUpload(src);
      if (!upload.contentType.startsWith("image/")) {
        return { ok: false, message: "Only image media can be saved to the public gallery." };
      }
      const ext = upload.contentType.includes("png") ? "png" : upload.contentType.includes("webp") ? "webp" : "jpg";
      const path = `${basePath}/${String(i + 1).padStart(2, "0")}.${ext}`;
      const up = await input.supabase.storage
        .from("listing-images")
        .upload(path, upload.bytes, { upsert: true, contentType: upload.contentType || "image/jpeg" });
      if (up.error) return { ok: false, message: up.error.message };
      const url = input.supabase.storage.from("listing-images").getPublicUrl(path).data.publicUrl;
      if (url) out.push(url);
    } catch (e) {
      return {
        ok: false,
        message: e instanceof Error ? e.message : "Could not process one or more photos.",
      };
    }
  }
  return out.length ? { ok: true, images: out } : { ok: false, message: "No public photos could be saved." };
}

function buildEditablePatch(input: {
  existing: ListingRow;
  params: PublishLeonixRealEstateListingCoreParams;
  images: string[];
  lang: "es" | "en";
}): { ok: true; patch: Record<string, unknown> } | { ok: false; message: string } {
  const title = prepareLeonixListingTitleForPublish(input.params.title, input.lang);
  if (!title.ok) return { ok: false, message: title.error };
  const desc = prepareLeonixListingDescriptionForPublish(input.params.description, input.lang);
  if (!desc.ok) return { ok: false, message: desc.error };
  return {
    ok: true,
    patch: {
      title: title.titleForDb,
      description: toLeonixListingsDescriptionForDb(desc.sanitized),
      city: input.params.city,
      state: input.params.state ?? null,
      zip: input.params.zip ?? null,
      price: input.params.price,
      business_name: input.params.businessName ?? null,
      business_meta: input.params.businessMetaJson ?? null,
      detail_pairs: mergeDetailPairs(input.existing.detail_pairs, input.params.detailPairs),
      contact_phone: input.params.contactPhoneDigits,
      contact_email: input.params.contactEmail,
      images: input.images,
      updated_at: new Date().toISOString(),
    },
  };
}

function existingChildListingIdFromDraft(draft: BrNegocioAdditionalInventoryPropertyDraft): string | null {
  const id = trim(draft.id);
  return id.startsWith("br-db-child-") ? id.slice("br-db-child-".length).trim() || null : null;
}

async function updateOneListing(input: {
  supabase: ReturnType<typeof getAdminSupabase>;
  existing: ListingRow;
  ownerId: string;
  params: PublishLeonixRealEstateListingCoreParams;
  lang: "es" | "en";
  parentListingId?: string | null;
}): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  const media = await resolvePublicImages({
    supabase: input.supabase,
    ownerId: input.ownerId,
    listingId: input.existing.id,
    imageSources: input.params.imageSources,
    existingImages: input.existing.images,
  });
  if (!media.ok) return { ok: false, message: media.message };
  const builtPatch = buildEditablePatch({
    existing: input.existing,
    params: input.params,
    images: media.images,
    lang: input.lang,
  });
  if (!builtPatch.ok) return { ok: false, message: builtPatch.message };

  let q = input.supabase
    .from("listings")
    .update(builtPatch.patch)
    .eq("id", input.existing.id)
    .eq("owner_id", input.ownerId)
    .eq("category", "bienes-raices");
  if (input.parentListingId) {
    q = q.eq("br_inventory_parent_listing_id", input.parentListingId);
  }
  const { data, error } = await q
    .select("id, leonix_ad_id, status, is_published, published_at, expires_at")
    .maybeSingle();
  if (error || !data?.id) return { ok: false, message: error?.message ?? "Update did not apply." };
  return { ok: true, id: data.id };
}

export async function POST(request: NextRequest) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, code: "supabase_not_configured" }, { status: 503 });
  }
  const bearerUserId = await getBearerUserId(request);
  if (!bearerUserId) {
    return NextResponse.json({ ok: false, code: "auth_required", message: "Authentication required." }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, code: "invalid_json", message: "Invalid JSON body." }, { status: 400 });
  }

  const listingId = trim(body.listingId);
  const lang = body.lang === "en" ? "en" : "es";
  if (!listingId || !body.draft || typeof body.draft !== "object") {
    return NextResponse.json({ ok: false, code: "invalid_request", message: "listingId and draft are required." }, { status: 400 });
  }

  const supabase = getAdminSupabase();
  const { data: existing, error: readError } = await supabase
    .from("listings")
    .select("id, owner_id, category, seller_type, status, is_published, published_at, expires_at, leonix_ad_id, detail_pairs, images, br_inventory_group_id, br_inventory_parent_listing_id, inventory_role")
    .eq("id", listingId)
    .maybeSingle();

  if (readError || !existing?.id) {
    return NextResponse.json({ ok: false, code: "listing_not_found", message: readError?.message ?? "Listing not found." }, { status: 404 });
  }
  const parent = existing as ListingRow;
  if (trim(parent.owner_id) !== bearerUserId) {
    return NextResponse.json({ ok: false, code: "owner_mismatch", message: "Listing does not belong to authenticated user." }, { status: 403 });
  }
  if (trim(parent.category).toLowerCase() !== "bienes-raices") {
    return NextResponse.json({ ok: false, code: "wrong_category", message: "Only Bienes Raíces listings can be edited here." }, { status: 422 });
  }
  const contract = parseLeonixListingContract(parent.detail_pairs);
  if (contract.branch !== "bienes_raices_negocio" && trim(parent.seller_type).toLowerCase() !== "business") {
    return NextResponse.json({ ok: false, code: "lane_mismatch", message: "Bienes negocio lane mismatch." }, { status: 422 });
  }
  if (trim(body.leonixAdId) && trim(parent.leonix_ad_id) && trim(body.leonixAdId) !== trim(parent.leonix_ad_id)) {
    return NextResponse.json({ ok: false, code: "leonix_id_mismatch", message: "Leonix Ad ID mismatch." }, { status: 409 });
  }

  const draft = body.draft as AgenteIndividualResidencialFormState;
  const parentBuilt = buildPublishParamsFromAgenteResidencialDraft(draft, lang, { mode: "main" });
  if (!parentBuilt.ok) {
    return NextResponse.json({ ok: false, code: "invalid_parent_draft", message: parentBuilt.error }, { status: 422 });
  }

  const parentUpdate = await updateOneListing({
    supabase,
    existing: parent,
    ownerId: bearerUserId,
    params: parentBuilt.params,
    lang,
  });
  if (!parentUpdate.ok) {
    return NextResponse.json({ ok: false, code: "parent_update_failed", message: parentUpdate.message }, { status: 500 });
  }

  const groupId = trim(parent.br_inventory_group_id) || listingId;
  const { data: childRows, error: childReadError } = await supabase
    .from("listings")
    .select("id, owner_id, category, seller_type, status, is_published, published_at, expires_at, leonix_ad_id, detail_pairs, images, br_inventory_group_id, br_inventory_parent_listing_id, inventory_role")
    .eq("owner_id", bearerUserId)
    .eq("category", "bienes-raices")
    .eq("br_inventory_group_id", groupId)
    .eq("inventory_role", "inventory_property");
  if (childReadError) {
    return NextResponse.json({ ok: false, code: "child_read_failed", message: childReadError.message }, { status: 500 });
  }
  const childById = new Map((childRows as ListingRow[] | null ?? []).map((row) => [row.id, row]));
  const childUpdates: string[] = [];
  const skippedNewChildren: string[] = [];

  for (const childDraft of draft.additionalInventoryProperties ?? []) {
    const childId = existingChildListingIdFromDraft(childDraft);
    if (!childId) {
      skippedNewChildren.push(trim(childDraft.title) || trim(childDraft.id) || "new child");
      continue;
    }
    const existingChild = childById.get(childId);
    if (!existingChild) continue;
    const childState = buildChildInventoryEditorState(draft, childDraft, lang);
    const childBuilt = buildPublishParamsFromAgenteResidencialDraft(childState, lang, {
      mode: "add",
      parentListingId: listingId,
      brInventoryGroupId: groupId,
    });
    if (!childBuilt.ok) {
      return NextResponse.json({ ok: false, code: "invalid_child_draft", message: childBuilt.error }, { status: 422 });
    }
    const childUpdate = await updateOneListing({
      supabase,
      existing: existingChild,
      ownerId: bearerUserId,
      params: childBuilt.params,
      lang,
      parentListingId: listingId,
    });
    if (!childUpdate.ok) {
      return NextResponse.json({ ok: false, code: "child_update_failed", message: childUpdate.message }, { status: 500 });
    }
    childUpdates.push(childUpdate.id);
  }

  const { data: proof } = await supabase
    .from("listings")
    .select("id, leonix_ad_id, status, is_published, published_at, expires_at")
    .in("id", [listingId, ...childUpdates]);

  return NextResponse.json({
    ok: true,
    parentListingId: listingId,
    updatedChildListingIds: childUpdates,
    skippedNewChildren,
    proof: proof ?? [],
  });
}
