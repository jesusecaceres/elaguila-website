/**
 * Derived “notification-style” items from real tables (no notifications table required).
 * Safe to extend when a persisted notifications feed exists.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { listingRepublishVisibilityWindowEndIso } from "@/app/(site)/dashboard/lib/dashboardListingMeta";
import { fetchDashboardAnalyticsSummary } from "@/app/(site)/dashboard/lib/fetchDashboardAnalyticsApi";
import { DASHBOARD_INTERNAL_INBOX_READY } from "@/app/(site)/dashboard/lib/dashboardProductTruth";
import {
  fetchOwnerRestaurantListings,
  fetchOwnerAutosClassifiedsListings,
  fetchOwnerServiciosListings,
} from "@/app/(site)/dashboard/lib/dashboardInventory";
import {
  fetchDashboardListingPackageEntitlementBadges,
  dashboardSubscriptionStateForKey,
  type DashboardEntitlementLookupItem,
} from "@/app/(site)/dashboard/lib/dashboardPackageEntitlementBadges";
import { resolveCommercialStateBadges } from "@/app/lib/listingPlans/commercialStateBadges";

export type DerivedFeedKind =
  | "expire_visibility"
  | "expire_listing"
  | "draft"
  | "profile_city"
  | "inbox"
  | "low_views"
  | "moderation"
  | "payment_attention";

export type DerivedFeedItem = {
  id: string;
  kind: DerivedFeedKind;
  title: string;
  detail?: string;
  href: string;
  /** Higher sorts first */
  priority: number;
};

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function inSoonWindow(iso: string | null | undefined, now: Date, soon: Date): boolean {
  if (iso == null) return false;
  const t = new Date(typeof iso === "string" ? iso : String(iso)).getTime();
  if (!Number.isFinite(t)) return false;
  return t > now.getTime() && t <= soon.getTime();
}

type ListingFeedRow = {
  id: string;
  title?: string | null;
  status?: string | null;
  is_published?: boolean | null;
  republished_at?: string | null;
  expires_at?: string | null;
  category?: string | null;
};

export async function fetchDerivedDashboardFeed(
  sb: SupabaseClient,
  userId: string,
  lang: "es" | "en",
  accessToken?: string | null,
): Promise<DerivedFeedItem[]> {
  const items: DerivedFeedItem[] = [];
  const now = new Date();
  const soon = addDays(now, 7);
  const isEs = lang === "es";

  let homeCity: string | null = null;
  try {
    const { data: prof } = await sb.from("profiles").select("home_city").eq("id", userId).maybeSingle();
    homeCity = (prof as { home_city?: string | null } | null)?.home_city?.trim() || null;
  } catch {
    /* ignore */
  }

  if (!homeCity) {
    items.push({
      id: "profile-city",
      kind: "profile_city",
      title: isEs ? "Completa tu ciudad en el perfil" : "Add your city in Profile",
      detail: isEs ? "Ayuda a compradores y mejora recomendaciones locales." : "Helps buyers and local recommendations.",
      href: `/dashboard/perfil?lang=${lang}`,
      priority: 55,
    });
  }

  let listings: ListingFeedRow[] = [];
  try {
    const res = await sb
      .from("listings")
      .select("id, title, status, is_published, republished_at, expires_at, category")
      .eq("owner_id", userId);
    if (!res.error && res.data) listings = res.data as ListingFeedRow[];
  } catch {
    listings = [];
  }

  let unreadInbox = 0;
  try {
    const u = await sb
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("receiver_id", userId)
      .is("read_at", null);
    if (!u.error && typeof u.count === "number") unreadInbox = u.count;
  } catch {
    /* ignore */
  }

  if (DASHBOARD_INTERNAL_INBOX_READY && unreadInbox > 0) {
    items.push({
      id: "inbox-unread",
      kind: "inbox",
      title: isEs ? `Mensajes sin leer (${unreadInbox})` : `Unread messages (${unreadInbox})`,
      detail: isEs ? "Responde pronto para mejor conversión." : "Reply soon for better conversion.",
      href: `/dashboard/mensajes?lang=${lang}`,
      priority: 80,
    });
  }

  const drafts = listings.filter(
    (r) => r.is_published === false || String(r.status ?? "").toLowerCase() === "draft"
  );
  if (drafts.length > 0) {
    items.push({
      id: "drafts-summary",
      kind: "draft",
      title: isEs ? `Borradores sin publicar (${drafts.length})` : `Unpublished drafts (${drafts.length})`,
      detail: isEs ? "Publica o continúa editando cuando quieras." : "Publish or continue editing anytime.",
      href: `/dashboard/drafts?lang=${lang}`,
      priority: 65,
    });
  }

  for (const L of listings) {
    const st = String(L.status ?? "active").toLowerCase();
    if (st === "pending" || st === "flagged") {
      items.push({
        id: `mod-${L.id}`,
        kind: "moderation",
        title: isEs ? `Moderación: ${(L.title ?? "").trim() || "Anuncio"}` : `Moderation: ${(L.title ?? "").trim() || "Listing"}`,
        detail: isEs ? "Revisa el estado en Mis anuncios." : "Check status in My ads.",
        href: `/dashboard/mis-anuncios/${L.id}?lang=${lang}`,
        priority: 75,
      });
    }
    const visEnd = listingRepublishVisibilityWindowEndIso(L.republished_at);
    if (inSoonWindow(visEnd, now, soon) && st === "active") {
      items.push({
        id: `exp-vis-${L.id}`,
        kind: "expire_visibility",
        title: isEs
          ? `Visibilidad próxima a vencer: ${(L.title ?? "").trim() || "Anuncio"}`
          : `Visibility ending soon: ${(L.title ?? "").trim() || "Listing"}`,
        href: `/dashboard/mis-anuncios/${L.id}?lang=${lang}`,
        priority: 70,
      });
    }
    if (inSoonWindow(L.expires_at ?? null, now, soon) && st === "active") {
      items.push({
        id: `exp-list-${L.id}`,
        kind: "expire_listing",
        title: isEs
          ? `Expiración próxima: ${(L.title ?? "").trim() || "Anuncio"}`
          : `Expiring soon: ${(L.title ?? "").trim() || "Listing"}`,
        href: `/dashboard/mis-anuncios/${L.id}?lang=${lang}`,
        priority: 72,
      });
    }
  }

  const activeIds = listings
    .filter((r) => String(r.status ?? "").toLowerCase() === "active" && r.is_published !== false)
    .map((r) => r.id);

  if (activeIds.length > 0 && activeIds.length <= 40 && accessToken?.trim()) {
    const summary = await fetchDashboardAnalyticsSummary(accessToken.trim());
    if (summary && !summary.listingAnalyticsUnavailable) {
      for (const id of activeIds) {
        const v = summary.byListing[id]?.views ?? 0;
        if (v === 0) {
          const row = listings.find((x) => x.id === id);
          const title = (row?.title ?? "").trim() || (isEs ? "Anuncio" : "Listing");
          items.push({
            id: `low-${id}`,
            kind: "low_views",
            title: isEs ? `Sin vistas aún: ${title}` : `No views yet: ${title}`,
            detail: isEs ? "Comparte el enlace o mejora fotos y título." : "Share the link or improve photos and title.",
            href: `/dashboard/mis-anuncios/${id}?lang=${lang}`,
            priority: 50,
          });
        }
      }
    }
  }

  // Package E Build E2, Gate 7 — real payment/grace/cancellation alerts, sourced from the SAME
  // canonical entitlement route + resolveCommercialStateBadges() every dashboard card already
  // uses (no second implementation, no notifications table). Scoped to the categories with real
  // monthly subscriptions today (Bienes Raíces Negocio, Restaurantes, Servicios, Autos Dealer
  // parents); one batched lookup, not per-listing calls.
  if (accessToken?.trim()) {
    try {
      const brNegocioItems: DashboardEntitlementLookupItem[] = listings
        .filter((r) => (r.category ?? "").toLowerCase() === "bienes-raices")
        .map((r) => ({ key: r.id, category: "bienes-raices", listingSource: "listings", listingId: r.id }));

      const [restaurantRows, serviciosRows, autosRows] = await Promise.all([
        fetchOwnerRestaurantListings(sb, userId),
        fetchOwnerServiciosListings(accessToken),
        fetchOwnerAutosClassifiedsListings(sb, userId),
      ]);

      const restaurantItems: DashboardEntitlementLookupItem[] = restaurantRows.map((r) => ({
        key: r.id,
        category: "restaurantes",
        listingSource: "restaurantes_public_listings",
        listingId: r.id,
        leonixAdId: r.leonix_ad_id ?? null,
      }));
      const serviciosItems: DashboardEntitlementLookupItem[] = serviciosRows.map((r) => {
        const id = (r.id ?? r.slug) as string;
        return { key: id, category: "servicios", listingSource: "servicios_public_listings", listingId: id, slug: r.slug ?? null };
      });
      const autosDealerParentItems: DashboardEntitlementLookupItem[] = autosRows
        .filter((r) => r.lane === "negocios" && r.inventory_role === "main")
        .map((r) => ({ key: r.id, category: "autos", listingSource: "autos_classifieds_listings", listingId: r.id, leonixAdId: r.leonix_ad_id ?? null }));

      const allItems = [...brNegocioItems, ...restaurantItems, ...serviciosItems, ...autosDealerParentItems];
      if (allItems.length > 0) {
        const { subscriptionStates } = await fetchDashboardListingPackageEntitlementBadges(allItems, accessToken);
        for (const item of allItems) {
          const subState = dashboardSubscriptionStateForKey(subscriptionStates, [item.key]);
          if (!subState) continue;
          const badges = resolveCommercialStateBadges({
            subscriptionStatus: subState.status,
            cancelAtPeriodEnd: subState.cancelAtPeriodEnd,
            graceEndsAt: subState.graceEndsAt,
            suspensionReason: subState.suspensionReason,
            recoveredAt: subState.recoveredAt,
          });
          const attention = badges.find((b) =>
            ["grace", "suspended_nonpayment", "disputed", "cancels_at_period_end", "canceled"].includes(b.key),
          );
          if (!attention) continue;
          items.push({
            id: `payment-${item.key}`,
            kind: "payment_attention",
            title: isEs ? attention.labelEs : attention.labelEn,
            detail: isEs ? "Revisa el estado de tu paquete comercial." : "Check your commercial package status.",
            href: `/dashboard/mis-anuncios?lang=${lang}&cat=${item.category}`,
            priority: attention.key === "suspended_nonpayment" || attention.key === "disputed" ? 90 : 78,
          });
        }
      }
    } catch {
      /* best-effort — never block the rest of the feed on a commercial-state lookup failure */
    }
  }

  items.sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));

  const seen = new Set<string>();
  const deduped: DerivedFeedItem[] = [];
  for (const it of items) {
    if (seen.has(it.id)) continue;
    seen.add(it.id);
    deduped.push(it);
  }
  return deduped.slice(0, 24);
}
