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
  const { draft, draftListingId, packageTier, lang } = parsed.value;
  const supabase = getAdminSupabase();
  const now = new Date().toISOString();

  const { data: existing, error: exErr } = await supabase
    .from("comida_local_public_listings")
    .select("id, slug, leonix_ad_id, status, package_tier, payment_status, owner_user_id")
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
      const row = draftToComidaLocalPublicListingInsert(draft, existing.slug, {
        ownerUserId: ownerUserId ?? (existing.owner_user_id as string | null) ?? null,
        draftListingId,
        packageTier,
        status: (existing.status as "published") ?? "published",
        paymentStatus:
          (typeof existing.payment_status === "string" && existing.payment_status) ||
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

      const { error: updErr } = await supabase
        .from("comida_local_public_listings")
        .update(updatePayload)
        .eq("draft_listing_id", draftListingId);

      if (updErr) {
        return NextResponse.json({ ok: false, error: "update_failed", detail: updErr.message }, { status: 500 });
      }

      const leonixId = String(updatePayload.leonix_ad_id ?? existing.leonix_ad_id ?? "");
      const publicPath = `/clasificados/comida-local/${encodeURIComponent(existing.slug)}`;

      return NextResponse.json({
        ok: true,
        persisted: true,
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
      });
    }

    const slugOut = await allocateUniqueSlug(supabase, slugBase);
    const insertRow = draftToComidaLocalPublicListingInsert(draft, slugOut, {
      ownerUserId,
      draftListingId,
      packageTier,
      status: "published",
      paymentStatus: COMIDA_LOCAL_PAYMENT_STATUS_L5B,
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
          published_at: now,
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
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "publish_exception", detail: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}
