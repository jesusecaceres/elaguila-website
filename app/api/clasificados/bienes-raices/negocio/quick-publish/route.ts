/**
 * Gate QB-BOUNDARY-02 — THE ATOMIC QUICK BIENES NEGOCIO PUBLISH ENDPOINT.
 *
 * WHAT THIS REPLACES
 * ------------------
 * Quick Bienes Negocio used to publish in two steps the browser took independently:
 *
 *      1. POST `/api/clasificados/bienes-raices/negocio/publish-media-gate` → a yes/no
 *      2. browser INSERT into `listings` through the RLS-governed Supabase browser client
 *
 * Step 2 did not depend on step 1 in any way a server could observe: the gate's answer was advice
 * the browser could simply decline to ask for. That route is deleted and this one replaces it —
 * ONE authenticated request that verifies, validates and writes, with no seam left between the
 * decision and the row.
 *
 * THIS FILE IS A SHELL. The operation — identity, product, media, fields, idempotency, write,
 * linkage, and the ORDER of all of it — lives in
 * `app/lib/clasificados/bienes-raices/quickBienesPublishOperation.ts` behind explicit ports, so
 * the behavioral verifier can drive the very same code with in-memory fakes. What is here is only
 * the wiring of the real ports.
 *
 * WHAT THIS ENDPOINT CANNOT DO
 *   - publish as another owner: `owner_id` is the bearer subject; no body field names an owner,
 *     and the update port is scoped by owner as well as by id;
 *   - publish a FULL or FSBO listing: `category` and `seller_type` are server constants, and a
 *     customer whose own entitlement or checkout ledger says FULL is refused outright;
 *   - arrive pre-published: `status` and `is_published` are server constants, so activation still
 *     belongs to the existing lifecycle RPC after payment;
 *   - grow an inventory: `inventory_role` is forced to `main`, matching the one property the
 *     Quick package includes;
 *   - duplicate on retry: a retry collapses onto the caller's OWN pending row, and a failed
 *     lookup refuses rather than inserting.
 *
 * NOT AN UNRESTRICTED SERVICE-ROLE ENDPOINT. The admin client is reachable only through the five
 * narrow ports below — two tables, one owner, one category, one seller type, one status, one
 * fixed column set. There is no generic query port. Every unknown refuses instead of writing.
 *
 * HONEST RESIDUAL. This closes the APPLICATION path: there is no longer any code path in the
 * product by which a Quick Bienes row is written from a browser. A client that ignores the
 * application entirely and speaks to PostgREST directly is still bounded only by `listings` RLS;
 * closing that last door needs a database-side policy, i.e. a migration, which this mission is not
 * authorized to apply. It is recorded in the technical evidence rather than papered over.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getBearerUserId } from "@/app/api/clasificados/_lib/bearerUser";
import { linkSelfServiceListingToBusiness } from "@/app/lib/business/canonicalListingLink";
import {
  QUICK_BIENES_CATEGORY,
  quickBienesRefusal,
} from "@/app/lib/clasificados/bienes-raices/quickBienesPublishContract";
import {
  executeQuickBienesPublish,
  type QuickBienesPublishPorts,
} from "@/app/lib/clasificados/bienes-raices/quickBienesPublishOperation";
import { resolveQuickBusinessPublishIdentity } from "@/app/lib/listingPlans/quickBusinessProductIdentityServer";
import { quickBasePackageKeyForCategory } from "@/app/lib/listingPlans/quickBusinessProductIdentity";
import { enforceQuickBusinessPublishMedia } from "@/app/lib/quickBusiness/quickBusinessMediaSemantics";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function buildQuickBienesPublishPorts(request: NextRequest): QuickBienesPublishPorts {
  return {
    resolveOwnerUserId: () => getBearerUserId(request),
    isDatabaseConfigured: () => isSupabaseAdminConfigured(),

    // The product is server truth: a verified assisted context, a live entitlement row, the
    // server-minted checkout ledger, or this route's own custody leg. `serverCustodyQuick` is
    // what makes a FIRST publish resolvable (no entitlement and no ledger row exists yet) and is
    // unreachable from a request body — only this wiring sets it.
    resolveProduct: async ({ ownerUserId, declaredPackageKey }) => {
      const identity = await resolveQuickBusinessPublishIdentity({
        category: QUICK_BIENES_CATEGORY,
        ownerUserId,
        declaredPackageKey,
        serverCustodyQuick: true,
      });
      return { product: identity.product, source: identity.source };
    },

    // The same canonical entry point every other Quick seam calls, so the contract cannot drift
    // between paths. Only a role descriptor is ever seen here: no bytes, no URLs.
    validateMedia: (items) => {
      const result = enforceQuickBusinessPublishMedia({ category: "bienes-negocio", items });
      if (!result || result.ok) return null;
      return {
        message: result.body.message,
        messageEs: result.body.messageEs,
        issues: result.body.issues,
      };
    },

    findReusablePendingListing: async (key) => {
      const { data, error } = await getAdminSupabase()
        .from("listings")
        .select("id, listing_json")
        .match(key)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) return { ok: false };
      const id = typeof data?.id === "string" ? data.id : "";
      if (!id) return { ok: true, row: null };
      const listingJson =
        data?.listing_json && typeof data.listing_json === "object" && !Array.isArray(data.listing_json)
          ? (data.listing_json as Record<string, unknown>)
          : null;
      return { ok: true, row: { id, listingJson } };
    },

    insertListing: async (row) => {
      const { data, error } = await getAdminSupabase().from("listings").insert(row).select("id").single();
      if (error || !data?.id) return { ok: false };
      return { ok: true, listingId: String(data.id) };
    },

    // Scoped by owner as well as id, so an update can never reach another owner's row even if a
    // reuse lookup ever returned one.
    updateListing: async ({ listingId, ownerUserId, patch }) => {
      const { error } = await getAdminSupabase()
        .from("listings")
        .update(patch)
        .eq("id", listingId)
        .eq("owner_id", ownerUserId);
      return { ok: !error };
    },

    groupMainListing: async (listingId) => {
      await getAdminSupabase().from("listings").update({ br_inventory_group_id: listingId }).eq("id", listingId);
    },

    // The same `business_listing_links` relationship the three server-published Quick families
    // write. Ownership is re-proven inside it; idempotent; never fatal to the publish.
    linkListingToBusiness: async ({ ownerUserId, listingId }) => {
      const link = await linkSelfServiceListingToBusiness({
        userId: ownerUserId,
        listingSource: "listings",
        listingId,
      });
      return { ok: link.ok === true, businessId: link.ok ? link.businessId : null };
    },

    nowIso: () => new Date().toISOString(),
  };
}

export async function POST(request: NextRequest) {
  let body: { listingRow?: unknown; mediaRoles?: unknown; basePackageKey?: unknown; lang?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      quickBienesRefusal("invalid_body", { en: "Invalid request.", es: "Solicitud inválida." }),
      { status: 400 },
    );
  }

  const result = await executeQuickBienesPublish(
    {
      listingRow: body.listingRow,
      // Passed through as-is: a non-array is refused by the operation as `invalid_body`,
      // never quietly coerced into "no photos".
      mediaRoles: body.mediaRoles as (string | null)[],
      declaredPackageKey: typeof body.basePackageKey === "string" ? body.basePackageKey : null,
      lang: body.lang === "en" ? "en" : "es",
    },
    buildQuickBienesPublishPorts(request),
    { quickPackageKey: quickBasePackageKeyForCategory(QUICK_BIENES_CATEGORY)! },
  );

  if (!result.ok) return NextResponse.json(result.body, { status: result.status });

  const { status, ...payload } = result;
  return NextResponse.json(payload, { status });
}
