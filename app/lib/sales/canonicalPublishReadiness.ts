import "server-only";

/**
 * QUICK SALES — CANONICAL PUBLISH READINESS, evaluated against the STORED row.
 *
 * THE DEFECT THIS EXISTS FOR: the cockpit publisher (`/api/admin/sales-preview/publish`) verified
 * the staff actor, the assisted context, the custody link and the cleared manual payment, and then
 * flipped the row's status through a generic per-category patch. It never asked whether the draft
 * was COMPLETE. A `save_for_client` draft is allowed to be incomplete on purpose (a staff member
 * saves what they have and comes back), so a cleared payment alone was enough to put an
 * unfinished ad in front of the public.
 *
 * WHAT THIS IS: the same readiness functions the four canonical category routes already run —
 * `evaluateServiciosPublishReadiness`, `satisfiesRestauranteMinimumValidPreview`,
 * `validateProposedFinalMediaSet`, the Quick Business semantic media contract
 * (`enforceQuickBusinessPublishMedia`) gated by the same product resolver
 * (`resolveQuickBusinessPublishIdentity`), Autos' required vehicle child, and each category's
 * compare-and-set activation — applied to the persisted row instead of a request body. Every
 * predicate is IMPORTED from the module the category route imports it from; nothing here is a
 * second checklist that could drift from the category's own.
 *
 * WHAT THIS IS NOT: a fifth publish route, an HTTP call into a category route, or a copy of a
 * category's persistence branch. Servicios is read back through `serviciosPublishedToApplicationDraft`,
 * the exact hydrator the intake uses in listing-edit mode, so the state the readiness rule sees
 * here is the state the intake would show the staff member.
 */
import { evaluateServiciosPublishReadiness } from "@/app/clasificados/publicar/servicios/lib/serviciosPublishReadiness";
import { serviciosPublishedToApplicationDraft } from "@/app/clasificados/publicar/servicios/lib/serviciosPublishedToApplicationDraft";
import type { ClasificadosServiciosApplicationState } from "@/app/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes";
import { SERVICIOS_MAX_VIDEO_URLS } from "@/app/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes";
import { getServiciosPublicListingByIdFromDb } from "@/app/clasificados/servicios/lib/serviciosPublicListingsServer";
import { SERVICIOS_LEONIX_LOCKED_STATUSES } from "@/app/clasificados/servicios/lib/serviciosOwnerMutationPolicy";
import { SERVICIOS_LISTING_STATUS_PUBLISHED } from "@/app/clasificados/servicios/lib/serviciosListingLifecycle";
import { normalizeStrictExternalVideoUrl } from "@/app/lib/media/externalVideoUrlValidation";
import type { RestauranteListingDraft } from "@/app/clasificados/restaurantes/application/restauranteDraftTypes";
import { coerceRestauranteImageRefToString, mergeRestauranteDraft } from "@/app/clasificados/restaurantes/application/createEmptyRestauranteDraft";
import {
  auditRestaurantePublishReadiness,
  satisfiesRestauranteMinimumValidPreview,
} from "@/app/clasificados/restaurantes/application/restauranteListingApplicationModel";
import {
  RESTAURANTE_MAX_EXTERNAL_VIDEO_URLS,
  collectRestauranteExternalVideoUrls,
  isValidRestauranteExternalVideoUrl,
  trimRestauranteVideoUrl,
} from "@/app/lib/clasificados/restaurantes/restauranteVideoUrls";
import { buildProposedFinalMediaSet, validateProposedFinalMediaSet } from "@/app/lib/media/listingMediaContract";
import {
  enforceQuickBusinessPublishMedia,
  extractSemanticMediaItems,
  type SemanticMediaItem,
} from "@/app/lib/quickBusiness/quickBusinessMediaSemantics";
import { resolveQuickBusinessPublishIdentity } from "@/app/lib/listingPlans/quickBusinessProductIdentityServer";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { RESTAURANTE_STATUS_TRANSITION_NOT_ALLOWED_ERROR, resolveRestauranteOwnerEditTargetStatus } from "@/app/lib/clasificados/restaurantes/restauranteOwnerEditStatusAuthority";
import type { QuickSalesCategory } from "./quickSalesCategories";
import { mapOwnedRentasListingToPrivadoFormState } from "@/app/clasificados/publicar/rentas/shared/rentasDashboardEditHydration";
import { gateBienesRaicesNegocioPreview, gateRentasPrivadoPreview } from "@/app/clasificados/lib/publish/leonixRequiredForPreviewGates";
import { getAutosPreviewCompletenessIssues } from "@/app/clasificados/autos/shared/lib/autosPreviewCompleteness";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { hydrateQuickDraftFromEnvelope } from "@/app/publicar/empleos/shared/lib/empleosDraftFromEnvelope";
import { gateEmpleosQuickPreview } from "@/app/publicar/empleos/shared/required/empleosRequiredForPreview";
import type { EmpleosPublishEnvelope } from "@/app/publicar/empleos/shared/publish/empleosPublishSnapshots";
import { mergeComidaLocalDraftFromStorage } from "@/app/lib/clasificados/comida-local/comidaLocalDraftPersistence";
import { validateComidaLocalDraftForFuturePublish } from "@/app/lib/clasificados/comida-local/comidaLocalValidation";
import { parseBienesAgenteResidencialPublishedState } from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/parseBienesAgenteResidencialPublishedState";
import { mapAgenteResidencialFormStateToNegocioForPublish } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/mapAgenteResidencialFormStateToNegocioForPublish";

/**
 * QUICK IS ADDITIVE. The four normal category routes are NOT modified for this adapter (they are
 * byte-identical to f29c8ed6 — proven by the verifier). Where a normal route keeps a value as a
 * file-local literal, the SAME value is restated here with its source cited, and the verifier
 * pins the two together so they cannot drift silently:
 *   SERVICIOS_GALLERY_MAX  ← app/api/clasificados/servicios/publish/route.ts   `const SERVICIOS_GALLERY_MAX = 24`
 *   RESTAURANTE_GALLERY_MAX ← app/api/clasificados/restaurantes/publish/route.ts `const RESTAURANTE_GALLERY_MAX = 24`
 */
export const SERVICIOS_GALLERY_MAX = 24;
export const RESTAURANTE_GALLERY_MAX = 24;

/**
 * Gate 7 (Servicios Final Consolidated Lifecycle Execution, 2026-09-18) — SOURCE CONTRACT for the
 * three legal confirmations, quoted from
 * app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx:
 *   "an existing listing's ordinary edit-save does NOT re-collect the three legal confirmations
 *    captured once at the original application/checkout — only a fresh application (never
 *    listing-bound) requires them"
 *   canPublishFromPreview = publishReadiness.ok && (listingBoundPreview || (all three confirms))
 * The cockpit publishes an EXISTING stored row, i.e. the listing-bound case, so exactly these
 * three readiness ids are exempt. Nothing is forced true; the ids are the ones
 * serviciosPublishReadiness.ts pushes ("confirm_accurate" / "confirm_photos" / "confirm_rules").
 */
export const SERVICIOS_LISTING_BOUND_EXEMPT_READINESS_IDS: ReadonlySet<string> = new Set(["confirm_accurate", "confirm_photos", "confirm_rules"]);

export type CanonicalPublishRefusal = {
  ok: false;
  /** HTTP status the cockpit answers with — the same one the category route answers with. */
  status: number;
  /** Stable machine code, audited as the refusal outcome. */
  error: string;
  /** The exact body the category route would send (missing fields, media issues, ...). */
  body: Record<string, unknown>;
};

export type CanonicalPublishAssessment =
  | {
      ok: true;
      category: QuickSalesCategory;
      listingId: string;
      /** Autos: the inventory vehicle child that publishes with its parent. Null elsewhere. */
      childListingId: string | null;
    }
  | CanonicalPublishRefusal;

function refuse(status: number, error: string, extra: Record<string, unknown> = {}): CanonicalPublishRefusal {
  return { ok: false, status, error, body: { ok: false, error, ...extra } };
}

// ---------------------------------------------------------------------------------------------
// SERVICIOS — the Quick media facts the category route and the cockpit both derive from state.
// ---------------------------------------------------------------------------------------------

/**
 * Servicios keeps identity media in its own non-gallery `logoUrl` field, so a cover or gallery
 * item is subject media by construction; external video lives in `state.videos` and never carries
 * a `video/*` MIME. Shared so the route and the cockpit cannot count the same state two ways.
 */
export function serviciosQuickMediaFacts(state: ClasificadosServiciosApplicationState): {
  items: SemanticMediaItem[];
  externalVideoCount: number;
} {
  const items: SemanticMediaItem[] = [
    ...(state.coverUrl ? [{ role: null, mime: null }] : []),
    ...state.gallery.map((g) => ({ role: (g as { role?: string }).role ?? null, mime: null })),
  ];
  const externalVideoCount = Array.isArray(state.videos)
    ? state.videos.filter((v) => typeof v?.url === "string" && v.url.trim().length > 0).length
    : 0;
  return { items, externalVideoCount };
}

async function assessServicios(
  listingId: string,
  lang: "es" | "en",
  assistedPackageKey?: string | null,
): Promise<CanonicalPublishAssessment> {
  const row = await getServiciosPublicListingByIdFromDb(listingId, { visibility: "all" });
  if (!row?.id) return refuse(404, "listing_not_found");
  const status = String(row.listing_status ?? "").trim().toLowerCase();
  if (SERVICIOS_LEONIX_LOCKED_STATUSES.has(status)) return refuse(409, "listing_locked_by_leonix");
  if (status === SERVICIOS_LISTING_STATUS_PUBLISHED) return refuse(409, "already_published", { listingId });

  // The intake's own listing-edit hydration, then the intake's own readiness rule.
  const { state } = serviciosPublishedToApplicationDraft({
    id: row.id,
    slug: row.slug,
    leonix_ad_id: row.leonix_ad_id ?? null,
    business_name: row.business_name,
    city: row.city,
    listing_status: row.listing_status,
    profile_json: row.profile_json,
    leonix_verified: row.leonix_verified,
  });
  // The hydrator resets the three legal confirmations to false (a stored row cannot carry them);
  // per the Gate 7 listing-bound contract cited above they are exempt for an existing row. Every
  // CONTENT predicate (type, name, city, contact, about, services, media) is judged unchanged.
  const readiness = evaluateServiciosPublishReadiness(state, lang);
  const missing = readiness.missing.filter((m) => !SERVICIOS_LISTING_BOUND_EXEMPT_READINESS_IDS.has(m.id));
  if (missing.length) return refuse(422, "not_ready", { missing });

  const finalMedia = buildProposedFinalMediaSet({
    existing: state.gallery.map((g) => g.url),
    externalVideoUrls: state.videos.map((v) => v.url),
  });
  const mediaValidation = validateProposedFinalMediaSet(finalMedia, {
    minImages: 0,
    maxImages: SERVICIOS_GALLERY_MAX,
    logoAllowed: false,
    maxExternalVideos: SERVICIOS_MAX_VIDEO_URLS,
    normalizeExternalVideoUrl: normalizeStrictExternalVideoUrl,
  });
  if (!mediaValidation.ok) return refuse(422, "media_invalid", { issues: mediaValidation.issues });

  // PRODUCT IDENTITY comes from server truth: a staff assisted package key (Quick vs Full
  // entitlement on this custody), then the row's stored owner for entitlement/ledger reads.
  // `serverCustodyQuick` is the fail-safe fallback when the cookie names no package — it never
  // overrides a stamped Full key. An owner-null Full custody row is therefore Full, not Quick.
  const product = await resolveQuickBusinessPublishIdentity({
    category: "servicios",
    ownerUserId: row.owner_user_id ?? "",
    listingId: row.id,
    assistedPackageKey: assistedPackageKey ?? null,
    serverCustodyQuick: !assistedPackageKey,
  });
  if (product.enforceQuickContract) {
    const facts = serviciosQuickMediaFacts(state);
    const semantic = enforceQuickBusinessPublishMedia({ category: "servicios", ...facts });
    if (semantic && !semantic.ok) return { ok: false, status: semantic.status, error: semantic.body.error, body: semantic.body };
  }
  return { ok: true, category: "servicios", listingId: row.id, childListingId: null };
}

// ---------------------------------------------------------------------------------------------
// RESTAURANTES
// ---------------------------------------------------------------------------------------------

/** Hero + gallery URLs and external video links, exactly as the category route assembles them. */
export function restauranteQuickMediaFacts(draft: RestauranteListingDraft): {
  heroUrl: string | undefined;
  galleryUrls: string[];
  externalVideoUrls: string[];
} {
  const heroUrl = coerceRestauranteImageRefToString(draft.heroImage);
  const galleryUrls = (draft.galleryImages ?? [])
    .map((ref) => coerceRestauranteImageRefToString(ref))
    .filter((u): u is string => Boolean(u));
  return { heroUrl, galleryUrls, externalVideoUrls: collectRestauranteExternalVideoUrls(draft) };
}

async function assessRestaurantes(
  listingId: string,
  assistedPackageKey?: string | null,
): Promise<CanonicalPublishAssessment> {
  const db = getAdminSupabase();
  const { data, error } = await db
    .from("restaurantes_public_listings")
    .select("id, status, owner_user_id, listing_json")
    .eq("id", listingId)
    .maybeSingle();
  if (error || !data) return refuse(404, "listing_not_found");
  const row = data as unknown as { id: string; status: string | null; owner_user_id: string | null; listing_json: unknown };
  // THE CANONICAL STATUS AUTHORITY (app/lib/clasificados/restaurantes/restauranteOwnerEditStatusAuthority.ts):
  // a non-privileged writer may only hold a row at its own KNOWN status; an unknown/legacy status
  // fails closed. Only two paths may move a row toward `published` — Revenue OS fulfillment and
  // the staff admin route — and this cockpit is the staff path for the ONE status the assisted
  // save leaves a row in (`pending_payment`, RESTAURANTE_PENDING_CHECKOUT_STATUS). `archived` and
  // `suspended` are held where they are, exactly as the authority would hold them.
  const decision = resolveRestauranteOwnerEditTargetStatus(row.status);
  if (!decision.ok) return refuse(409, decision.error);
  if (decision.targetStatus === "published") return refuse(409, "already_published", { listingId });
  if (decision.targetStatus !== "pending_payment") return refuse(409, RESTAURANTE_STATUS_TRANSITION_NOT_ALLOWED_ERROR);

  const draft = mergeRestauranteDraft(row.listing_json);
  if (!satisfiesRestauranteMinimumValidPreview(draft)) {
    const audit = auditRestaurantePublishReadiness(draft, "transport");
    return refuse(422, "not_ready", {
      detail: `Campos mínimos faltantes: ${audit.missingFields.join(", ")}`,
      missingFields: audit.missingFields,
    });
  }
  const facts = restauranteQuickMediaFacts(draft);
  const finalMedia = buildProposedFinalMediaSet({
    existing: [...(facts.heroUrl ? [facts.heroUrl] : []), ...facts.galleryUrls],
    externalVideoUrls: facts.externalVideoUrls,
  });
  const mediaValidation = validateProposedFinalMediaSet(finalMedia, {
    minImages: 0,
    maxImages: RESTAURANTE_GALLERY_MAX,
    logoAllowed: false,
    maxExternalVideos: RESTAURANTE_MAX_EXTERNAL_VIDEO_URLS,
    normalizeExternalVideoUrl: (url) => (isValidRestauranteExternalVideoUrl(url) ? trimRestauranteVideoUrl(url) : null),
  });
  if (!mediaValidation.ok) return refuse(422, "media_invalid", { issues: mediaValidation.issues });

  const product = await resolveQuickBusinessPublishIdentity({
    category: "restaurantes",
    ownerUserId: row.owner_user_id ?? "",
    listingId: row.id,
    assistedPackageKey: assistedPackageKey ?? null,
    serverCustodyQuick: !assistedPackageKey,
  });
  if (product.enforceQuickContract) {
    const semantic = enforceQuickBusinessPublishMedia({
      category: "restaurantes",
      externalVideoCount: facts.externalVideoUrls.filter((u) => typeof u === "string" && u.trim().length > 0).length,
      items: [...(facts.heroUrl ? [{ role: null, mime: null }] : []), ...facts.galleryUrls.map(() => ({ role: null, mime: null }))],
    });
    if (semantic && !semantic.ok) return { ok: false, status: semantic.status, error: semantic.body.error, body: semantic.body };
  }
  return { ok: true, category: "restaurantes", listingId: row.id, childListingId: null };
}

// ---------------------------------------------------------------------------------------------
// AUTOS DEALER — a dealer parent publishes only with its first vehicle child.
// ---------------------------------------------------------------------------------------------

/**
 * The inventory child already prepared under this dealer parent, if any. SAME query as the Autos
 * assisted route's own `findExistingAssistedVehicleChildId` (app/api/clasificados/autos/
 * assisted-publish/route.ts, unchanged): oldest-first so a draft that somehow acquired more than
 * one child keeps converging on the same row.
 */
export async function findExistingAssistedVehicleChildId(parentListingId: string): Promise<string | null> {
  if (!parentListingId) return null;
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("autos_classifieds_listings")
      .select("id")
      .eq("dealer_inventory_parent_listing_id", parentListingId)
      .eq("inventory_role", "inventory_vehicle")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) return null;
    const id = (data as { id?: string } | null)?.id;
    return id ? String(id) : null;
  } catch {
    return null;
  }
}

const AUTOS_PRE_PUBLISH_STATES = ["draft", "pending_payment", "payment_failed"] as const;

export type AutosActivationRefusal =
  | "autos_activate_failed"
  | "autos_status_transition_not_allowed"
  | "autos_vehicle_activate_failed"
  | "autos_vehicle_status_transition_not_allowed";

/**
 * QUICK-ONLY activation of a dealer parent WITH its required vehicle child. The semantics are the
 * Autos assisted route's own (app/api/clasificados/autos/assisted-publish/route.ts, unchanged):
 * `{status:"active", published_at, updated_at}` written by compare-and-set from exactly
 * ["draft","pending_payment","payment_failed"] on BOTH rows. Two things the cockpit adds on top,
 * because here the child is REQUIRED (assessAutos refused without it):
 *   - the child write is checked: an error or a zero-row match is a refusal, never success;
 *   - the child is activated FIRST, so a refusal can never leave a live parent over a dark child.
 */
export async function activateAutosDealerListing(input: {
  mainListingId: string;
  vehicleListingId: string;
}): Promise<{ ok: true } | { ok: false; status: 409 | 500; error: AutosActivationRefusal }> {
  const supabase = getAdminSupabase();
  const nowIso = new Date().toISOString();
  const patch = { status: "active", published_at: nowIso, updated_at: nowIso };
  const { data: child, error: childError } = await supabase
    .from("autos_classifieds_listings")
    .update(patch)
    .eq("id", input.vehicleListingId)
    .in("status", [...AUTOS_PRE_PUBLISH_STATES])
    .select("id")
    .maybeSingle();
  if (childError) return { ok: false, status: 500, error: "autos_vehicle_activate_failed" };
  if (!(child as { id?: string } | null)?.id) return { ok: false, status: 409, error: "autos_vehicle_status_transition_not_allowed" };
  const { data: activated, error: activateError } = await supabase
    .from("autos_classifieds_listings")
    .update(patch)
    .eq("id", input.mainListingId)
    .in("status", [...AUTOS_PRE_PUBLISH_STATES])
    .select("id")
    .maybeSingle();
  if (activateError) return { ok: false, status: 500, error: "autos_activate_failed" };
  if (!(activated as { id?: string } | null)?.id) return { ok: false, status: 409, error: "autos_status_transition_not_allowed" };
  return { ok: true };
}

async function assessAutos(listingId: string): Promise<CanonicalPublishAssessment> {
  const db = getAdminSupabase();
  const { data, error } = await db
    .from("autos_classifieds_listings")
    .select("id, status, listing_payload")
    .eq("id", listingId)
    .maybeSingle();
  if (error || !data) return refuse(404, "listing_not_found");
  const row = data as unknown as { id: string; status: string | null };
  const status = String(row.status ?? "").trim().toLowerCase();
  if (status === "active") return refuse(409, "already_published", { listingId });

  const childId = await findExistingAssistedVehicleChildId(row.id);
  if (!childId) return refuse(400, "vehicle_listing_required_for_publish");
  const { data: child } = await db.from("autos_classifieds_listings").select("id, listing_payload").eq("id", childId).maybeSingle();
  const payload = (child as { listing_payload?: unknown } | null)?.listing_payload;
  // Gate QB-MEDIA-02/03 — the same canonical entry point the Autos route calls: at least one real
  // VEHICLE photo, read from the vehicle child because the vehicle is what the listing is about.
  const semantic = enforceQuickBusinessPublishMedia({ category: "autos-dealer", items: extractSemanticMediaItems(payload) });
  if (semantic && !semantic.ok) return { ok: false, status: semantic.status, error: semantic.body.error, body: semantic.body };
  const parentPayload = (data as { listing_payload?: unknown }).listing_payload as AutoDealerListing | null;
  const childListing = payload as AutoDealerListing | null;
  if (parentPayload) {
    const parentIssues = getAutosPreviewCompletenessIssues("negocios", parentPayload).filter((k) => k === "dealerIdentity");
    if (parentIssues.length) return refuse(422, "not_ready", { missing: parentIssues });
  }
  if (childListing) {
    const vehicleIssues = getAutosPreviewCompletenessIssues("privado", childListing).filter((k) => k !== "media");
    if (vehicleIssues.length) return refuse(422, "not_ready", { missing: vehicleIssues });
  }
  return { ok: true, category: "autos", listingId: row.id, childListingId: childId };
}

// ---------------------------------------------------------------------------------------------
// BIENES RAÍCES NEGOCIO
// ---------------------------------------------------------------------------------------------

async function assessBienes(listingId: string): Promise<CanonicalPublishAssessment> {
  const db = getAdminSupabase();
  const { data, error } = await db
    .from("listings")
    .select("id, status, is_published, images, title, price, city, description, zip, business_name, business_meta, contact_phone, contact_email, owner_id, leonix_ad_id, detail_pairs, listing_json, contact_json, br_inventory_group_id, br_inventory_parent_listing_id, inventory_role")
    .eq("id", listingId)
    .maybeSingle();
  if (error || !data) return refuse(404, "listing_not_found");
  const row = data as unknown as Record<string, unknown> & { id: string; status: string | null; is_published: boolean | null; images: unknown };
  const status = String(row.status ?? "").trim().toLowerCase();
  if (status === "active" && row.is_published === true) return refuse(409, "already_published", { listingId });

  // SOURCE-PROVEN PERSISTED LOCATION: `listings.images` (jsonb array of URL strings).
  const images = Array.isArray(row.images) ? (row.images as unknown[]) : [];
  const items: SemanticMediaItem[] = [];
  const photos: string[] = [];
  for (const entry of images) {
    if (typeof entry === "string") {
      if (entry.trim()) {
        items.push({ role: null, mime: null });
        if (/^https?:\/\//i.test(entry.trim())) photos.push(entry.trim());
      }
      continue;
    }
    if (!entry || typeof entry !== "object") continue;
    const o = entry as Record<string, unknown>;
    const url = typeof o.url === "string" ? o.url : typeof o.src === "string" ? o.src : typeof o.path === "string" ? o.path : "";
    if (url.trim()) {
      items.push({ role: typeof o.role === "string" ? o.role : null, mime: null });
      if (/^https?:\/\//i.test(url.trim())) photos.push(url.trim());
    }
  }
  const semantic = enforceQuickBusinessPublishMedia({ category: "bienes-negocio", items });
  if (semantic && !semantic.ok) return { ok: false, status: semantic.status, error: semantic.body.error, body: semantic.body };

  const priceNum = Number(row.price);
  const agente = parseBienesAgenteResidencialPublishedState({
    listing: {
      id: String(row.id),
      title: { es: String(row.title ?? ""), en: String(row.title ?? "") },
      priceLabel: {
        es: Number.isFinite(priceNum) && priceNum > 0 ? String(Math.round(priceNum)) : "",
        en: Number.isFinite(priceNum) && priceNum > 0 ? String(Math.round(priceNum)) : "",
      },
      city: String(row.city ?? ""),
      blurb: { es: String(row.description ?? ""), en: String(row.description ?? "") },
      images: photos,
      business_name: typeof row.business_name === "string" ? row.business_name : null,
      business_meta: (row.business_meta as string | null) ?? null,
      contact_phone: typeof row.contact_phone === "string" ? row.contact_phone : null,
      contact_email: typeof row.contact_email === "string" ? row.contact_email : null,
      detailPairs: row.detail_pairs,
      owner_id: typeof row.owner_id === "string" ? row.owner_id : null,
      leonix_ad_id: typeof row.leonix_ad_id === "string" ? row.leonix_ad_id : null,
      br_inventory_group_id: typeof row.br_inventory_group_id === "string" ? row.br_inventory_group_id : null,
      br_inventory_parent_listing_id: typeof row.br_inventory_parent_listing_id === "string" ? row.br_inventory_parent_listing_id : null,
      inventory_role: typeof row.inventory_role === "string" ? row.inventory_role : null,
      zip: typeof row.zip === "string" ? row.zip : null,
    },
    parentIdentity: {
      id: String(row.id),
      business_name: typeof row.business_name === "string" ? row.business_name : null,
      business_meta: (row.business_meta as string | null) ?? null,
      contact_phone: typeof row.contact_phone === "string" ? row.contact_phone : null,
      contact_email: typeof row.contact_email === "string" ? row.contact_email : null,
    },
    lang: "es",
  });
  const negocio = mapAgenteResidencialFormStateToNegocioForPublish(agente);
  const gate = gateBienesRaicesNegocioPreview(negocio);
  if (!gate.ok) return refuse(422, "not_ready", { detail: gate.message });
  return { ok: true, category: "bienes-raices", listingId: row.id, childListingId: null };
}

// ---------------------------------------------------------------------------------------------

/**
 * Run the category's own publish-time contract against the stored row. Called by the cockpit
 * AFTER the payment gate answered and BEFORE any status is written.
 */
export async function assessCanonicalPublishReadiness(input: {
  category: QuickSalesCategory;
  listingId: string;
  lang?: "es" | "en";
  assistedPackageKey?: string | null;
}): Promise<CanonicalPublishAssessment> {
  if (!isSupabaseAdminConfigured()) return refuse(503, "db_not_configured");
  const listingId = (input.listingId ?? "").trim();
  if (!listingId) return refuse(409, "no_bound_listing");
  switch (input.category) {
    case "servicios":
      return assessServicios(listingId, input.lang ?? "es", input.assistedPackageKey ?? null);
    case "restaurantes":
      return assessRestaurantes(listingId, input.assistedPackageKey ?? null);
    case "autos":
      return assessAutos(listingId);
    case "bienes-raices":
      return assessBienes(listingId);
    case "rentas":
      return assessRentas(listingId);
    case "empleos":
      return assessEmpleos(listingId);
    case "autos-privado":
      return assessAutosPrivado(listingId);
    case "comida-local":
      return assessComidaLocal(listingId);
  }
}

async function assessRentas(listingId: string): Promise<CanonicalPublishAssessment> {
  const db = getAdminSupabase();
  const { data, error } = await db
    .from("listings")
    .select("id, status, is_published, title, description, city, state, zip, category, price, images, detail_pairs, listing_json, contact_json, contact_phone, contact_email, seller_type, business_name, business_meta")
    .eq("id", listingId)
    .eq("category", "rentas")
    .maybeSingle();
  if (error || !data) return refuse(404, "listing_not_found");
  const row = data as unknown as Record<string, unknown> & { id: string; status: string | null; is_published: boolean | null };
  const status = String(row.status ?? "").trim().toLowerCase();
  if (status === "active" && row.is_published === true) return refuse(409, "already_published", { listingId });
  const state = mapOwnedRentasListingToPrivadoFormState(row);
  const gate = gateRentasPrivadoPreview(state);
  if (!gate.ok) return refuse(422, "not_ready", { detail: gate.message });
  return { ok: true, category: "rentas", listingId: row.id, childListingId: null };
}

async function assessEmpleos(listingId: string): Promise<CanonicalPublishAssessment> {
  const db = getAdminSupabase();
  const { data, error } = await db
    .from("empleos_public_listings")
    .select("id, lifecycle_status, listing_snapshot, lane")
    .eq("id", listingId)
    .maybeSingle();
  if (error || !data) return refuse(404, "listing_not_found");
  const row = data as { id: string; lifecycle_status: string | null; listing_snapshot: { envelope?: EmpleosPublishEnvelope } | null; lane: string | null };
  const status = String(row.lifecycle_status ?? "").trim().toLowerCase();
  if (status === "published") return refuse(409, "already_published", { listingId });
  const envelope = row.listing_snapshot?.envelope;
  if (!envelope) return refuse(422, "not_ready", { detail: "listing_snapshot.envelope missing" });
  const draft = hydrateQuickDraftFromEnvelope(envelope);
  if (!draft) return refuse(422, "not_ready", { detail: "empleos lane is not quick" });
  const gate = gateEmpleosQuickPreview(draft, "es");
  if (!gate.ok) return refuse(422, "not_ready", { missing: gate.issues });
  return { ok: true, category: "empleos", listingId: row.id, childListingId: null };
}

async function assessAutosPrivado(listingId: string): Promise<CanonicalPublishAssessment> {
  const db = getAdminSupabase();
  const { data, error } = await db
    .from("autos_classifieds_listings")
    .select("id, status, lane, listing_payload")
    .eq("id", listingId)
    .maybeSingle();
  if (error || !data) return refuse(404, "listing_not_found");
  const row = data as { id: string; status: string | null; lane: string | null; listing_payload: AutoDealerListing | null };
  const status = String(row.status ?? "").trim().toLowerCase();
  if (status === "active") return refuse(409, "already_published", { listingId });
  if (String(row.lane ?? "") !== "privado") return refuse(409, "lane_mismatch");
  const listing = row.listing_payload;
  if (!listing) return refuse(422, "not_ready", { missing: ["listing_payload"] });
  const missing = getAutosPreviewCompletenessIssues("privado", listing);
  if (missing.length) return refuse(422, "not_ready", { missing });
  return { ok: true, category: "autos-privado", listingId: row.id, childListingId: null };
}

async function assessComidaLocal(listingId: string): Promise<CanonicalPublishAssessment> {
  const db = getAdminSupabase();
  const { data, error } = await db
    .from("comida_local_public_listings")
    .select("id, status, listing_json")
    .eq("id", listingId)
    .maybeSingle();
  if (error || !data) return refuse(404, "listing_not_found");
  const row = data as { id: string; status: string | null; listing_json: unknown };
  const status = String(row.status ?? "").trim().toLowerCase();
  if (status === "published") return refuse(409, "already_published", { listingId });
  const draft = mergeComidaLocalDraftFromStorage(row.listing_json);
  const issues = validateComidaLocalDraftForFuturePublish(draft, true).filter((i) => i.severity === "error");
  if (issues.length) return refuse(422, "not_ready", { missing: issues.map((i) => i.field), detail: issues.map((i) => i.message) });
  return { ok: true, category: "comida-local", listingId: row.id, childListingId: null };
}
