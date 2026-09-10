import { NextResponse, type NextRequest } from "next/server";
import { getBearerUserId } from "@/app/api/clasificados/_lib/bearerUser";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { assertCommercialCapacityForWrite } from "@/app/lib/listingPlans/commercialWriteGuard";
import {
  buildProposedFinalMediaSet,
  warnDroppedUnpersistableMedia,
} from "@/app/lib/media/listingMediaContract";
import {
  BR_CHILD_IDENTITY_ERRORS,
  brChildIdentityOwnerMessage,
  brChildListingIdFromDraftId,
  isBienesChildIdentitySubstitution,
  resolveBrChildIdentity,
  type BrChildIdentityRowLike,
} from "@/app/lib/clasificados/bienes-raices/brChildIdentityGuard";
import {
  buildPublishParamsFromAgenteResidencialDraft,
} from "@/app/clasificados/lib/leonixPublishRealEstateFromDraftState";
import type { AgenteIndividualResidencialFormState } from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteIndividualResidencialFormState";
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
  /** Gate BIENES-NEGOCIO-1 — read only, so the identity-substitution guard can compare the stored
   * property location against the incoming one. `buildEditablePatch` still writes these as ordinary
   * content; they are never treated as a mutable identity key. */
  city?: string | null;
  state?: string | null;
  zip?: string | null;
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
}): Promise<{ ok: true; images: string[]; droppedUnpersistableMedia?: string[] } | { ok: false; message: string }> {
  const ordered = input.imageSources.map(trim).filter(Boolean);
  if (!ordered.length) {
    const existing = imagesArray(input.existingImages);
    return existing.length
      ? { ok: true, images: existing, droppedUnpersistableMedia: [] }
      : { ok: false, message: "At least one photo is required." };
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
  if (!out.length) return { ok: false, message: "No public photos could be saved." };

  // Gate BIENES-NEGOCIO-1 — the shared media contract has always reported which of the owner's
  // selected URLs could not be persisted (blob:/data:/malformed); this route computed nothing and
  // reported nothing, so a gallery that silently shrank was never surfaced. Same adoption already
  // made for Servicios, Restaurantes and Comida Local. No new media engine: the shared builder and
  // the shared warn helper do the work.
  const finalMedia = buildProposedFinalMediaSet({ existing: ordered });
  warnDroppedUnpersistableMedia("bienes-negocio-listing-edit", finalMedia);

  return { ok: true, images: out, droppedUnpersistableMedia: [...finalMedia.droppedUnpersistable] };
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

// Gate BIENES-NEGOCIO-1 — the local `br-db-child-` parser moved into
// `brChildIdentityGuard.brChildListingIdFromDraftId` so the convention lives beside the rules that
// depend on it. One parser, one guard.

async function updateOneListing(input: {
  supabase: ReturnType<typeof getAdminSupabase>;
  existing: ListingRow;
  ownerId: string;
  params: PublishLeonixRealEstateListingCoreParams;
  lang: "es" | "en";
  parentListingId?: string | null;
}): Promise<{ ok: true; id: string; droppedUnpersistableMedia: string[] } | { ok: false; message: string }> {
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
  return { ok: true, id: data.id, droppedUnpersistableMedia: media.droppedUnpersistableMedia ?? [] };
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
    .select("id, owner_id, category, seller_type, status, is_published, published_at, expires_at, leonix_ad_id, detail_pairs, images, city, state, zip, br_inventory_group_id, br_inventory_parent_listing_id, inventory_role")
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

  // Package C Build 1 (decision 11) — commercial write guard, delta-0 semantics: ordinary
  // edits to the parent and EXISTING children stay allowed through grace and suspension
  // (content preserved, owner can always maintain data); this call verifies parent role/
  // ownership commercially and reconciles a lapsed grace inline. New-child creation is
  // already refused by this route (skippedNewChildren) — capacity-increasing BR activation
  // is enforced at checkout/fulfillment, never unlockable via ordinary edit.
  {
    const guard = await assertCommercialCapacityForWrite({
      category: "bienes-raices",
      parentListingId: listingId,
      ownerUserId: bearerUserId,
      operation: "child_edit",
      capacityDelta: 0,
    });
    if (!guard.allowed && guard.code !== "guard_unavailable") {
      return NextResponse.json(
        { ok: false, code: guard.code, message: guard.message, messageEs: guard.messageEs },
        { status: guard.code === "parent_not_owned" ? 403 : 409 },
      );
    }
  }

  const draft = body.draft as AgenteIndividualResidencialFormState;
  const parentBuilt = buildPublishParamsFromAgenteResidencialDraft(draft, lang, { mode: "main" });
  if (!parentBuilt.ok) {
    return NextResponse.json({ ok: false, code: "invalid_parent_draft", message: parentBuilt.error }, { status: 422 });
  }

  // Gate BIENES-NEGOCIO-1 — the parent row is itself a property, so the same substitution guard
  // applies to it. Checked BEFORE the write, so a rejected edit changes nothing at all.
  if (
    isBienesChildIdentitySubstitution(
      { city: trim((parent as unknown as Record<string, unknown>).city), state: trim((parent as unknown as Record<string, unknown>).state), zip: trim((parent as unknown as Record<string, unknown>).zip) },
      { city: parentBuilt.params.city, state: parentBuilt.params.state ?? "", zip: parentBuilt.params.zip ?? "" },
    )
  ) {
    return NextResponse.json(
      {
        ok: false,
        code: BR_CHILD_IDENTITY_ERRORS.SUBSTITUTION,
        scope: "parent",
        message: brChildIdentityOwnerMessage(BR_CHILD_IDENTITY_ERRORS.SUBSTITUTION, "en"),
        messageEs: brChildIdentityOwnerMessage(BR_CHILD_IDENTITY_ERRORS.SUBSTITUTION, "es"),
      },
      { status: 409 },
    );
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
  const droppedMedia: string[] = [...parentUpdate.droppedUnpersistableMedia];

  const groupId = trim(parent.br_inventory_group_id) || listingId;
  const { data: childRows, error: childReadError } = await supabase
    .from("listings")
    .select("id, owner_id, category, seller_type, status, is_published, published_at, expires_at, leonix_ad_id, detail_pairs, images, city, state, zip, br_inventory_group_id, br_inventory_parent_listing_id, inventory_role")
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
  // Gate BIENES-NEGOCIO-1 — every child row already written in THIS request, so two drafts can
  // never claim the same row (the "one child draft silently mutates a different child" shape).
  const claimedChildIds = new Set<string>();

  for (const childDraft of draft.additionalInventoryProperties ?? []) {
    const childId = brChildListingIdFromDraftId(childDraft.id);
    if (!childId) {
      // A draft with no canonical `br-db-child-` id has no row yet. This route deliberately does
      // NOT create one — creation belongs to the Add Property flow, which allocates a real row,
      // a Leonix Ad ID and its own capacity check. Reported so the client can tell the owner
      // instead of silently doing nothing (see the response `skippedNewChildren`).
      skippedNewChildren.push(trim(childDraft.title) || trim(childDraft.id) || "new child");
      continue;
    }

    // Gate BIENES-NEGOCIO-1 — resolve to exactly one real row or FAIL CLOSED. Previously an
    // unresolvable id was silently `continue`d, so an owner could believe a property saved when
    // nothing was written.
    const resolution = resolveBrChildIdentity({
      childListingId: childId,
      childrenById: childById as ReadonlyMap<string, BrChildIdentityRowLike>,
      expectedParentListingId: listingId,
      expectedOwnerId: bearerUserId,
      alreadyClaimed: claimedChildIds,
    });
    if (!resolution.ok) {
      return NextResponse.json(
        {
          ok: false,
          code: resolution.error,
          scope: "child",
          message: brChildIdentityOwnerMessage(resolution.error, "en"),
          messageEs: brChildIdentityOwnerMessage(resolution.error, "es"),
        },
        { status: 409 },
      );
    }
    const existingChild = resolution.row as ListingRow;

    const childState = buildChildInventoryEditorState(draft, childDraft, lang);
    const childBuilt = buildPublishParamsFromAgenteResidencialDraft(childState, lang, {
      mode: "add",
      parentListingId: listingId,
      brInventoryGroupId: groupId,
    });
    if (!childBuilt.ok) {
      return NextResponse.json({ ok: false, code: "invalid_child_draft", message: childBuilt.error }, { status: 422 });
    }

    // Substitution guard — checked BEFORE the write so a rejected child changes nothing.
    if (
      isBienesChildIdentitySubstitution(
        { city: existingChild.city, state: existingChild.state, zip: existingChild.zip },
        { city: childBuilt.params.city, state: childBuilt.params.state ?? "", zip: childBuilt.params.zip ?? "" },
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          code: BR_CHILD_IDENTITY_ERRORS.SUBSTITUTION,
          scope: "child",
          message: brChildIdentityOwnerMessage(BR_CHILD_IDENTITY_ERRORS.SUBSTITUTION, "en"),
          messageEs: brChildIdentityOwnerMessage(BR_CHILD_IDENTITY_ERRORS.SUBSTITUTION, "es"),
        },
        { status: 409 },
      );
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
    claimedChildIds.add(childId);
    childUpdates.push(childUpdate.id);
    droppedMedia.push(...childUpdate.droppedUnpersistableMedia);
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
    // Gate BIENES-NEGOCIO-1 — owner-facing, non-blocking: photos the shared media contract could
    // not persist. Present only when non-empty.
    ...(droppedMedia.length ? { droppedUnpersistableMedia: [...new Set(droppedMedia)] } : {}),
    proof: proof ?? [],
  });
}
