/**
 * Work Package I.10A — Global Analytics and Engagement Foundation self-test.
 *
 * Covers the new pure helpers directly (`isSelfEngagement`, `buildCanonicalAdId` reuse), plus
 * source-level proof for the client components/shells this package touched — these are React
 * client components and Next.js pages that cannot be invoked standalone outside the framework
 * (same convention used throughout this session for route/page files), so wiring coverage here
 * is source-level (call-presence, call-order, and absence of the legacy call being replaced),
 * not simulated rendering.
 *
 * Run from repo root:
 *   npx tsx scripts/gate-i10a-analytics-engagement-truth-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

import { isSelfEngagement } from "../app/lib/analytics/selfEngagementGuard";
import { buildCanonicalAdId } from "../app/lib/analytics/listingAnalyticsIdentity";
import { LISTING_ANALYTICS_EVENT_TYPES } from "../app/lib/listingAnalyticsEventTypes";

const REPO_ROOT = path.resolve(__dirname, "..");

function readSource(rel: string): string {
  return readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

const RECORDER = "app/lib/analytics/client/listingEngagementRecorder.ts";
const LIKE_BUTTON = "app/components/clasificados/analytics/LeonixLikeButton.tsx";
const SAVE_BUTTON = "app/components/clasificados/analytics/LeonixSaveButton.tsx";
const COMMUNITY_ANALYTICS = "app/lib/clasificados/comunidad/comunidadClasesBuscoGlobalAnalytics.ts";
const COMMUNITY_DETAIL = "app/(site)/clasificados/community/CommunityQuickAnuncioDetail.tsx";
const EN_VENTA_LAYOUT = "app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx";
const ANUNCIO_PAGE = "app/(site)/clasificados/anuncio/[id]/page.tsx";
const RENTAS_DETAIL = "app/(site)/clasificados/rentas/listing/[id]/RentasListingDetailClient.tsx";
const RENTAS_PREVIEW = "app/(site)/clasificados/rentas/preview/shared/RentasVisualMatchPreviewView.tsx";
const BR_NEGOCIO_SHELL = "app/(site)/clasificados/bienes-raices/listing/BienesRaicesNegocioLiveDetailShell.tsx";
const BR_PRIVADO_SHELL = "app/(site)/clasificados/bienes-raices/listing/BienesRaicesPrivadoLiveDetailShell.tsx";
const QUICK_JOB_HEADER = "app/(site)/clasificados/empleos/components/quickJob/QuickJobHeaderCard.tsx";
const OWNER_KEYS = "app/lib/ownerEngagementListingKeys.ts";
const VIAJES_PLACEHOLDERS = "app/admin/(dashboard)/clasificados/viajes/_components/AdminViajesAnalyticsPlaceholders.tsx";

async function main() {
  /* ============================================================================================
   * IDENTITY — canonical ad id derivation is reused unchanged (existing G2A helper); UUID
   * required for `listings`/`autos_classifieds_listings`, slug accepted for slug-primary tables.
   * ========================================================================================== */
  {
    assert.equal(
      buildCanonicalAdId({ sourceTable: "listings", sourceId: "row-1", leonixAdId: "LX-1" }),
      "LX-1",
      "leonix_ad_id wins when present",
    );
    assert.equal(
      buildCanonicalAdId({ sourceTable: "listings", sourceId: "row-1", slug: "some-slug" }),
      "listings:row-1",
      "listings is not slug-primary — slug must not substitute for the row id",
    );
    assert.equal(
      buildCanonicalAdId({ sourceTable: "servicios_public_listings", sourceId: "row-1", slug: "some-slug" }),
      "some-slug",
      "slug-primary tables accept slug as canonical id",
    );
  }

  /* ============================================================================================
   * SELF-ENGAGEMENT GUARD — pure predicate truth table.
   * ========================================================================================== */
  {
    assert.equal(isSelfEngagement("user-1", "user-1"), true, "same id must be blocked");
    assert.equal(isSelfEngagement("USER-1", "user-1"), true, "comparison must be case-insensitive");
    assert.equal(isSelfEngagement("user-1", "user-2"), false, "different ids must be allowed");
    assert.equal(isSelfEngagement(null, "user-2"), false, "unknown current user must fail open (nothing to prove)");
    assert.equal(isSelfEngagement("user-1", null), false, "unknown owner must fail open (nothing to prove)");
    assert.equal(isSelfEngagement(null, null), false);
  }

  /* ============================================================================================
   * NEW RECORDER MODULE — typed dispatch layer, fail-closed on unprovable identity, no
   * server-only imports, exports the required view/open/like/save/share/CTA surface.
   * ========================================================================================== */
  {
    const src = readSource(RECORDER);
    assert.ok(!src.includes("app/lib/analytics/server/"), "recorder must not import server-only analytics code");
    assert.ok(src.includes('if (!sourceId || !sourceTable) return;'), "recorder must fail closed when identity is unprovable");
    for (const fn of [
      "trackListingViewOpen",
      "trackListingLikeToggle",
      "trackListingSaveToggle",
      "trackListingSaveToggleAuthed",
      "trackListingShare",
      "trackListingCta",
    ]) {
      assert.ok(src.includes(`export function ${fn}`) || src.includes(`export async function ${fn}`), `recorder must export ${fn}`);
    }
    assert.ok(src.includes("ListingAnalyticsSourceTable"), "identity input must use the canonical source-table type, not a bare string");
    assert.ok(src.includes("ListingAnalyticsCategory"), "identity input must use the canonical category type, not a bare string");
  }

  /* ============================================================================================
   * comunidadClasesBuscoGlobalAnalytics.ts UNTOUCHED — regression guard against the exact
   * architecture mistake corrected before implementation (widening its category type / reusing
   * it as an accidental global recorder).
   * ========================================================================================== */
  {
    const src = readSource(COMMUNITY_ANALYTICS);
    assert.ok(
      src.includes('export type CommunityAnalyticsCategory = "comunidad" | "clases" | "busco";'),
      "the category-family adapter's type union must remain narrow — not widened to string",
    );
  }

  /* ============================================================================================
   * SELF-ENGAGEMENT WIRING — both shared components block Like/Save for the owner; Share is
   * never gated.
   * ========================================================================================== */
  {
    for (const file of [LIKE_BUTTON, SAVE_BUTTON]) {
      const src = readSource(file);
      assert.ok(src.includes("isSelfEngagement("), `${file} must call the self-engagement guard`);
      assert.ok(src.includes("allowEngage ="), `${file} must fold the guard into allowEngage`);
    }
    const shareSrc = readSource("app/components/clasificados/analytics/LeonixShareButton.tsx");
    assert.ok(!shareSrc.includes("isSelfEngagement"), "Share must never be gated by owner self-engagement");
  }

  /* ============================================================================================
   * CALL-SITE MIGRATION — canonical dispatcher wired at each confirmed-safe site; legacy calls
   * at those specific sites are gone.
   * ========================================================================================== */
  {
    const community = readSource(COMMUNITY_DETAIL);
    assert.ok(community.includes("trackCommunityLikeToggle("), "Community detail Like must use the existing typed community adapter");
    assert.ok(community.includes("trackListingSaveToggleAuthed("), "Community detail Save must use the canonical recorder");

    const enVenta = readSource(EN_VENTA_LAYOUT);
    assert.ok(!enVenta.includes('from "@/app/lib/clasificadosAnalytics"'), "En-Venta/BR shell must no longer import the legacy direct-insert module");
    assert.ok(enVenta.includes("trackListingSaveToggleAuthed("), "En-Venta/BR shell Save must use the canonical recorder");
    assert.ok(enVenta.includes("trackListingShare("), "En-Venta/BR shell non-premium Share must use the canonical recorder");
    assert.ok(enVenta.includes('{ sourceTable: "listings", sourceId: listing.id, category: "en-venta" }'), "En-Venta/BR shell Share must carry real listings-table identity");

    const anuncio = readSource(ANUNCIO_PAGE);
    assert.ok(anuncio.includes("trackListingViewOpen("), "Generic detail page view/open must use the canonical recorder");
    assert.ok(anuncio.includes("trackListingSaveToggleAuthed("), "Generic detail page inline Save must use the canonical recorder");
    assert.ok(anuncio.includes("recordShareEvent={(shareMethod, extraMeta) =>"), "Generic detail page Share must supply a canonical override");
    assert.ok(!/trackListingSave\(/.test(anuncio), "Generic detail page must not call the legacy trackListingSave anymore");
    // Package D Build D2, Gate 6C fixed a real truth defect here: the CTA-click contact handler
    // was fabricating "message_sent" for every click type (call/directions/website/etc), not just
    // real chat messages. That fake usage is gone — its clicks now dispatch truthful per-CTA-type
    // events via dispatchConnectionHubCta. Exactly one legitimate trackEvent(..., "message_sent",
    // ...) call remains: the real chat-message-send handler, where a message genuinely was sent.
    const messageSentCount = (anuncio.match(/trackEvent\(listing\.id, "message_sent"/g) ?? []).length;
    assert.equal(messageSentCount, 1, "message_sent must remain only on the real chat-message-send path, never fabricated for CTA clicks");

    const rentasDetail = readSource(RENTAS_DETAIL);
    assert.ok(rentasDetail.includes("trackListingSaveToggleAuthed("), "Rentas detail Save must use the canonical recorder");

    const rentasPreview = readSource(RENTAS_PREVIEW);
    assert.ok(rentasPreview.includes("trackListingLikeToggle("), "Rentas preview Like must use the canonical recorder");

    for (const file of [BR_NEGOCIO_SHELL, BR_PRIVADO_SHELL]) {
      const src = readSource(file);
      assert.ok(!src.includes('from "@/app/lib/clasificadosAnalytics"'), `${file} must no longer import the legacy direct-insert module`);
      assert.ok(src.includes("trackListingSaveToggleAuthed("), `${file} Save must use the canonical recorder`);
      assert.ok(src.includes("isSelfEngagement(user.id, ownerId)"), `${file} inline Save must block the owner (not routed through LeonixSaveButton)`);
      // Ordering: the real DB mutation happens before the analytics call in both branches.
      assert.ok(
        src.indexOf('.delete().eq("user_id", user.id)') < src.indexOf("trackListingSaveToggleAuthed("),
        `${file}: delete-branch DB mutation must precede the analytics call`,
      );
      assert.ok(
        src.lastIndexOf(".insert({ user_id: user.id") < src.lastIndexOf("trackListingSaveToggleAuthed("),
        `${file}: insert-branch DB mutation must precede the analytics call`,
      );
    }
  }

  /* ============================================================================================
   * QUICKJOBHEADERCARD BUG FIX — the recorder-factory return value is actually invoked now,
   * not built and discarded.
   * ========================================================================================== */
  {
    const src = readSource(QUICK_JOB_HEADER);
    assert.ok(
      src.includes("await empleosGlobalLikeRecorder(globalListing)(isLike);"),
      "QuickJobHeaderCard must actually invoke the like recorder with isLike",
    );
    assert.ok(
      src.includes('empleosGlobalShareRecorder(globalListing, "detail_share")(shareMethod, extraMeta);'),
      "QuickJobHeaderCard must actually invoke the share recorder with the share method",
    );
  }

  /* ============================================================================================
   * LEADS VS. CLICKS — a CTA click type is never the same literal as a lead/application type.
   * ========================================================================================== */
  {
    const clicks = new Set(["cta_click", "phone_click", "whatsapp_click", "website_click", "directions_click", "email_click", "message_click", "contact_click", "outbound_click"]);
    const leads = new Set(["lead_created", "apply_started", "apply_submitted"]);
    for (const c of clicks) assert.ok(!leads.has(c), `click type "${c}" must not double as a lead type`);
    for (const t of [...clicks, ...leads]) {
      assert.ok((LISTING_ANALYTICS_EVENT_TYPES as readonly string[]).includes(t), `"${t}" must be a real allowlisted event type`);
    }
  }

  /* ============================================================================================
   * DASHBOARD HONESTY REGRESSION — the one confirmed mock-data surface stays honestly labeled.
   * ========================================================================================== */
  {
    const src = readSource(VIAJES_PLACEHOLDERS);
    assert.ok(src.includes("Mock sample"), "Viajes admin analytics placeholder must keep its honest mock label");
    assert.ok(src.includes("not live data"), "Viajes admin analytics placeholder must keep its honest not-live-data heading");
  }

  /* ============================================================================================
   * COMIDA LOCAL OWNER ROLLUP — the previously fully-omitted table is now included.
   * ========================================================================================== */
  {
    const src = readSource(OWNER_KEYS);
    const occurrences = (src.match(/comida_local_public_listings/g) ?? []).length;
    assert.ok(occurrences >= 2, "comida_local_public_listings must be queried in both rollup functions");
    assert.ok(src.includes('.from("comida_local_public_listings")'), "must be a real query, not just a comment");
  }

  console.log("gate-i10a-analytics-engagement-truth-selftest: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
