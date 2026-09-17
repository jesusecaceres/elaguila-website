import { randomUUID } from "crypto";
import { NextResponse, type NextRequest } from "next/server";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { allocateNextComidaLocalLeonixAdId } from "@/app/lib/clasificados/comida-local/comidaLocalLeonixAdId";
import { comidaLocalOwnerIdFromBearer } from "@/app/lib/clasificados/comida-local/comidaLocalPublishServerAuth";
import { draftToComidaLocalPublicListingInsert } from "@/app/lib/clasificados/comida-local/comidaLocalPublicListingMapper";
import {
  COMIDA_LOCAL_PUBLISH_CATEGORY,
  COMIDA_LOCAL_PAYMENT_STATUS_L5B,
} from "@/app/lib/clasificados/comida-local/comidaLocalPublishTypes";
import { parseComidaLocalPublishRequest } from "@/app/lib/clasificados/comida-local/comidaLocalPublishValidation";
import { buildComidaLocalSlugBase } from "@/app/lib/clasificados/comida-local/comidaLocalSlug";
import {
  COMIDA_LOCAL_STATUS_TRANSITION_NOT_ALLOWED_ERROR,
  resolveComidaLocalOwnerEditTargetStatus,
} from "@/app/lib/clasificados/comida-local/comidaLocalOwnerEditStatusAuthority";
import {
  normalizeComidaLocalLocationUpdatedAt,
  readComidaLocalTemporaryLocationPayload,
  resolveComidaLocalTemporaryLocationStamp,
} from "@/app/lib/clasificados/comida-local/comidaLocalTemporaryLocation";

export const runtime = "nodejs";

function isUniqueViolation(err: { code?: string; message?: string } | null | undefined): boolean {
  return err?.code === "23505" || /duplicate key|unique constraint/i.test(err?.message ?? "");
}

function detectHeavyMedia(value: unknown, path = ""): { found: boolean; details: string[] } {
  const details: string[] = [];
  if (value instanceof File || (typeof Blob !== "undefined" && value instanceof Blob)) {
    details.push(`File/Blob at ${path}`);
    return { found: true, details };
  }
  if (typeof value === "string") {
    const t = value;
    if (t.startsWith("data:image/") || t.startsWith("data:video/") || t.startsWith("blob:")) {
      details.push(`Heavy URL at ${path}`);
      return { found: true, details };
    }
    if (t.length > 2048) {
      details.push(`Oversized string at ${path}`);
      return { found: true, details };
    }
    return { found: false, details };
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < Math.min(value.length, 50); i++) {
      const r = detectHeavyMedia(value[i], `${path}[${i}]`);
      if (r.found) details.push(...r.details);
    }
    return { found: details.length > 0, details };
  }
  if (typeof value === "object" && value !== null) {
    for (const key of Object.keys(value as object).slice(0, 100)) {
      const r = detectHeavyMedia((value as Record<string, unknown>)[key], path ? `${path}.${key}` : key);
      if (r.found) details.push(...r.details);
    }
    return { found: details.length > 0, details };
  }
  return { found: false, details };
}

async function allocateUniqueSlug(
  supabase: ReturnType<typeof getAdminSupabase>,
  base: string
): Promise<string> {
  let candidate = base;
  for (let i = 0; i < 50; i++) {
    const { data } = await supabase
      .from("comida_local_public_listings")
      .select("slug")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
    candidate = i === 0 ? `${base}-2` : `${base}-${i + 2}`;
  }
  return `${base}-${randomUUID().slice(0, 8)}`;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const bodyStr = JSON.stringify(body);
  if (new Blob([bodyStr]).size > 1024 * 1024) {
    return NextResponse.json({ ok: false, error: "payload_too_large" }, { status: 413 });
  }

  const mediaCheck = detectHeavyMedia(body);
  if (mediaCheck.found) {
    return NextResponse.json(
      { ok: false, error: "heavy_media_detected", detail: mediaCheck.details.join("; ") },
      { status: 400 }
    );
  }

  const parsed = parseComidaLocalPublishRequest(body as Record<string, unknown>);
  if (!parsed.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: parsed.error,
        issues: parsed.issues,
        missingFields: parsed.issues?.map((i) => i.field),
      },
      { status: 422 }
    );
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error: "supabase_admin_unconfigured",
        detail: "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 503 }
    );
  }

  const ownerUserId = await comidaLocalOwnerIdFromBearer(req);
  const { draft, draftListingId, packageTier, lang, activationMode, droppedUnpersistableMedia } =
    parsed.value;

  const isPendingPayment = activationMode === "pending_payment";
  if (isPendingPayment && !ownerUserId) {
    return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });
  }
  const supabase = getAdminSupabase();
  const now = new Date().toISOString();

  // `listing_json` is selected because it holds the STORED temporary-location payload and its
  // stamp — the only trustworthy "previous" state for the Find Me Today freshness decision
  // below. The request body is never used for that comparison.
  const { data: existing, error: exErr } = await supabase
    .from("comida_local_public_listings")
    .select("id, slug, leonix_ad_id, status, package_tier, payment_status, owner_user_id, listing_json")
    .eq("draft_listing_id", draftListingId)
    .maybeSingle();

  if (exErr) {
    return NextResponse.json({ ok: false, error: "db_read_failed", detail: exErr.message }, { status: 500 });
  }

  const slugBase = buildComidaLocalSlugBase({
    businessName: draft.businessName,
    cityDisplay: draft.cityDisplay,
    cityCanonical: draft.cityCanonical,
    foodType: draft.foodType,
  });

  try {
    if (existing?.slug) {
      // Ownership: an authenticated request may never edit or republish another
      // user's listing. Mirrors the Restaurantes publish route's proven
      // ownership-mismatch guard (app/api/clasificados/restaurantes/publish/route.ts).
      // Only enforced when the existing row actually recorded an owner — legacy
      // ownerless rows keep their prior (pre-I.13A) behavior of being claimable.
      const existingOwnerUserId =
        typeof existing.owner_user_id === "string" ? existing.owner_user_id : null;
      if (existingOwnerUserId) {
        if (!ownerUserId) {
          return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });
        }
        if (existingOwnerUserId !== ownerUserId) {
          return NextResponse.json({ ok: false, error: "ownership_mismatch" }, { status: 403 });
        }
      }

      // Gate D19 kept the pending-payment checkout-prep save from regressing an already-paid,
      // already-published listing. Gate COMIDA-LOCAL-1 replaces that single comparison with the
      // full authority: an ordinary owner edit of an EXISTING row may only ever target the
      // row's OWN current status. The previous expression fell back to `"published"` when the
      // stored status was NULL/legacy/unrecognized, which promoted such a row to published with
      // no payment and no fulfillment event. `resolveComidaLocalOwnerEditTargetStatus` fails
      // closed instead; `activationMode` is deliberately not consulted by it.
      const statusDecision = resolveComidaLocalOwnerEditTargetStatus(existing.status as string | null);
      if (!statusDecision.ok) {
        return NextResponse.json({ ok: false, error: statusDecision.error }, { status: 409 });
      }
      const targetStatus = statusDecision.targetStatus;
      // Still a pending-payment checkout prep only while the row genuinely has not been paid
      // for; a paused/suspended row keeps its own status rather than being pushed back into
      // pending_payment (which would hide a listing the owner already paid for).
      const useNewPending = isPendingPayment && targetStatus === "pending_payment";

      // Gate COMIDA-LOCAL-1 — Find Me Today stamp, decided SERVER-SIDE against the STORED row.
      // A material change to `locationNote`/`locationUrl` refreshes it; any other edit preserves
      // it verbatim; clearing the temporary location clears it. The client's own
      // `locationUpdatedAt` is never trusted as the new value, so freshness cannot be forged.
      const previousJson =
        existing.listing_json && typeof existing.listing_json === "object"
          ? (existing.listing_json as Record<string, unknown>)
          : null;
      const stampedDraft = {
        ...draft,
        locationUpdatedAt: resolveComidaLocalTemporaryLocationStamp({
          previousPayload: previousJson
            ? readComidaLocalTemporaryLocationPayload(previousJson)
            : null,
          previousStamp: previousJson
            ? normalizeComidaLocalLocationUpdatedAt(previousJson.locationUpdatedAt)
            : "",
          nextPayload: readComidaLocalTemporaryLocationPayload(draft),
          nowIso: now,
        }),
      };

      const row = draftToComidaLocalPublicListingInsert(stampedDraft, existing.slug, {
        ownerUserId: ownerUserId ?? (existing.owner_user_id as string | null) ?? null,
        draftListingId,
        packageTier,
        status: targetStatus,
        paymentStatus: useNewPending
          ? "pending"
          : (typeof existing.payment_status === "string" && existing.payment_status) ||
            COMIDA_LOCAL_PAYMENT_STATUS_L5B,
      });

      const updatePayload: Record<string, unknown> = {
        ...row,
        updated_at: now,
        leonix_ad_id:
          typeof existing.leonix_ad_id === "string" && existing.leonix_ad_id.trim()
            ? existing.leonix_ad_id.trim()
            : await allocateNextComidaLocalLeonixAdId(supabase),
      };

      // Gate COMIDA-LOCAL-1 — compare-and-set on the status we just decided to preserve, and on
      // the canonical `draft_listing_id` that keeps this a SAME-ROW update. If another process
      // (staff moderation, the Revenue OS webhook landing mid-edit, the pause/resume route)
      // changed the status between the read above and this write, the update matches zero rows
      // instead of silently overwriting what that process just set.
      const { data: updatedRows, error: updErr } = await supabase
        .from("comida_local_public_listings")
        .update(updatePayload)
        .eq("draft_listing_id", draftListingId)
        .eq("status", targetStatus)
        .select("id");

      if (updErr) {
        return NextResponse.json({ ok: false, error: "update_failed", detail: updErr.message }, { status: 500 });
      }
      // A silent no-op must be reported, never claimed as success (the I.13A rule the lifecycle
      // route already follows).
      if (!updatedRows?.length) {
        return NextResponse.json(
          { ok: false, error: COMIDA_LOCAL_STATUS_TRANSITION_NOT_ALLOWED_ERROR },
          { status: 409 },
        );
      }

      const leonixId = String(updatePayload.leonix_ad_id ?? existing.leonix_ad_id ?? "");
      const publicPath = `/clasificados/comida-local/${encodeURIComponent(existing.slug)}`;

      return NextResponse.json({
        ok: true,
        persisted: true,
        pendingPayment: useNewPending,
        id: existing.id,
        slug: existing.slug,
        leonix_ad_id: leonixId,
        status: row.status,
        package_tier: row.package_tier,
        payment_status: row.payment_status,
        category: COMIDA_LOCAL_PUBLISH_CATEGORY,
        publicPath,
        draft_listing_id: draftListingId,
        owner_user_id: row.owner_user_id,
        lang,
        ...(droppedUnpersistableMedia.length ? { droppedUnpersistableMedia } : {}),
      });
    }

    // Gate D19 — a brand-new listing (no existing draft_listing_id row) must always go through
    // Revenue OS checkout; direct-publish-for-free is not a valid path once Comida Local is a
    // paid product. Editing an already-published listing goes through the `existing?.slug`
    // branch above instead, which never requires this flag.
    if (!isPendingPayment) {
      return NextResponse.json({ ok: false, error: "payment_required" }, { status: 402 });
    }

    const slugOut = await allocateUniqueSlug(supabase, slugBase);
    // Gate COMIDA-LOCAL-1 — a brand-new row has no stored previous payload, so a non-empty
    // temporary location is stamped now (this save IS its first real owner update). An empty
    // one stays unstamped: there is nothing to expire.
    const insertDraft = {
      ...draft,
      locationUpdatedAt: resolveComidaLocalTemporaryLocationStamp({
        previousPayload: null,
        previousStamp: "",
        nextPayload: readComidaLocalTemporaryLocationPayload(draft),
        nowIso: now,
      }),
    };
    const insertRow = draftToComidaLocalPublicListingInsert(insertDraft, slugOut, {
      ownerUserId,
      draftListingId,
      packageTier,
      status: isPendingPayment ? "pending_payment" : "published",
      paymentStatus: isPendingPayment ? "pending" : COMIDA_LOCAL_PAYMENT_STATUS_L5B,
    });

    let insertedId: string | null = null;
    let leonixOut = "";
    let insertError: { message: string; code?: string } | null = null;

    for (let attempt = 0; attempt < 8; attempt++) {
      let leonix_ad_id: string;
      try {
        leonix_ad_id = await allocateNextComidaLocalLeonixAdId(supabase);
      } catch (e) {
        return NextResponse.json(
          {
            ok: false,
            error: "leonix_ad_id_allocate_failed",
            detail: e instanceof Error ? e.message : "unknown",
          },
          { status: 500 }
        );
      }

      const { data, error } = await supabase
        .from("comida_local_public_listings")
        .insert({
          ...insertRow,
          leonix_ad_id,
          ...(isPendingPayment ? {} : { published_at: now }),
          updated_at: now,
        })
        .select("id, slug, leonix_ad_id, status, package_tier, payment_status")
        .single();

      if (!error && data) {
        insertedId = data.id as string;
        leonixOut = (data.leonix_ad_id as string) ?? leonix_ad_id;
        insertError = null;
        break;
      }
      insertError = error;
      if (!isUniqueViolation(error)) break;
    }

    if (insertError || !insertedId) {
      return NextResponse.json(
        { ok: false, error: "insert_failed", detail: insertError?.message ?? "unknown" },
        { status: 500 }
      );
    }

    const publicPath = `/clasificados/comida-local/${encodeURIComponent(slugOut)}`;

    return NextResponse.json({
      ok: true,
      persisted: true,
      pendingPayment: isPendingPayment,
      id: insertedId,
      slug: slugOut,
      leonix_ad_id: leonixOut,
      status: insertRow.status,
      package_tier: insertRow.package_tier,
      payment_status: insertRow.payment_status,
      category: COMIDA_LOCAL_PUBLISH_CATEGORY,
      publicPath,
      draft_listing_id: draftListingId,
      owner_user_id: ownerUserId,
      lang,
      ...(droppedUnpersistableMedia.length ? { droppedUnpersistableMedia } : {}),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "publish_exception", detail: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}
