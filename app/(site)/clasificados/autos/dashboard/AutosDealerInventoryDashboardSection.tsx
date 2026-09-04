"use client";

import Link from "next/link";
import { AutosNegociosInventoryValueDrawerTrigger } from "./AutosNegociosInventoryValueDrawerTrigger";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import type { AutosClassifiedsDashboardRow } from "@/app/lib/clasificados/autos/autosClassifiedsListingService";
import { summarizeDealerInventory, type AutosDealerInventoryCount } from "@/app/lib/clasificados/autos/autosDealerInventoryPolicy";
import {
  autosListingStatusLabelEn,
  autosListingStatusLabelEs,
} from "@/app/lib/clasificados/autos/autosClassifiedsVisibility";
import { withLangParam } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import { autosLiveVehiclePath } from "@/app/clasificados/autos/filters/autosBrowseFilterContract";
import { autosDealerInventoryAddVehicleCta } from "@/app/lib/clasificados/autos/autosDealerInventoryValueCopy";
import {
  autosDealerInventoryLimitMessage,
  autosDealerInventoryUpgradePitch,
} from "@/app/lib/clasificados/autos/autosDealerInventoryCopy";
import {
  autosDealerInventoryEditHref,
  autosDealerInventoryPackAddonUpgradeLabel,
  autosDealerListingEditHref,
  redirectAutosDealerInventoryPackCheckout,
  REVENUE_OS_AUTOS_DEALER_INVENTORY_PACK_SUPPORTED,
} from "@/app/(site)/dashboard/lib/autosDashboardInventoryAddonCheckout";
import {
  autosDealerInventoryActiveCountLine,
  autosDealerInventoryRemainingSlotsLine,
} from "@/app/lib/clasificados/autos/autosDealerInventoryDisplay";
import { autosPaidListingAnalyticsHref } from "@/app/lib/clasificados/autos/autosPaidListingAnalyticsHref";
import type { AutosClassifiedsListingStatus } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";
import { autosDealerListingPreviewHref } from "@/app/(site)/dashboard/lib/autosDashboardInventoryAddonCheckout";
import { buildListingIdentity, resolveDashboardActions, type DashboardAction } from "@/app/lib/listingIdentity";
import {
  fetchDashboardListingPackageEntitlementBadges,
  dashboardSubscriptionStateForKey,
  type DashboardSubscriptionStateEntry,
} from "@/app/(site)/dashboard/lib/dashboardPackageEntitlementBadges";
import { resolveCommercialStateBadges, commercialStateBadgesToLifecycleNote } from "@/app/lib/listingPlans/commercialStateBadges";
import { OwnerEntityWorkspace } from "@/app/(site)/dashboard/components/OwnerEntityWorkspace";
import { DashboardListingActionBar, type ActionItem } from "@/app/(site)/dashboard/components/DashboardListingActionBar";
import { getOwnerEntityCapabilities, isLiveCapability } from "@/app/(site)/dashboard/lib/ownerEntityCapabilityRegistry";
import { resolveListingUiStatus, listingUiStatusLabel, listingUiStatusChipClass } from "@/app/(site)/dashboard/lib/listingDisplayStatus";
import {
  editListingLabel,
  publicViewLabel,
  previewLabel,
  analyticsLabel,
  resumeListingLabel,
  manageInventoryLabel,
} from "@/app/(site)/dashboard/lib/dashboardMisAnunciosCategoryTools";
import { ownerToolsTitle, ownerInventoryModuleTitle } from "@/app/(site)/dashboard/lib/dashboardI18n";

type Lang = "es" | "en";

function formatUsd(n: number | null, lang: Lang) {
  if (n == null || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(lang === "es" ? "es-US" : "en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function statusLabel(status: string, lang: Lang): string {
  const s = status as AutosClassifiedsListingStatus;
  return lang === "es" ? autosListingStatusLabelEs(s) : autosListingStatusLabelEn(s);
}

type InventoryGroup = {
  groupKey: string;
  dealerName: string;
  mainListingId: string | null;
  rows: AutosClassifiedsDashboardRow[];
  activeCount: number;
};

/**
 * Gate F.2.1 — deterministic, dashboard-only grouping key. `dealer_inventory_group_id` is
 * grouping metadata, not canonical identity (F.2A certification): the durable authority is
 * always a row's own `id` (parent) or its `dealer_inventory_parent_listing_id` (child). Never
 * falls back to an owner-wide or global literal — two distinct, still-ungrouped parent rows for
 * the same owner must never collapse into one dashboard bucket (each gets its own `parent:` key
 * derived from its own canonical uuid), and a malformed child row with neither a group id nor a
 * parent reference stays isolated under its own row id rather than guessing an owner-wide or
 * arbitrary attachment. `"parent:"`/`"orphan:"`-prefixed keys are synthetic (dashboard-local only)
 * and are never a real stored `dealer_inventory_group_id` value — see the `startsWith` check where
 * `group.groupKey` is turned into a real group id for the public group page / Add Vehicle context.
 */
function resolveAutosDealerInventoryGroupKey(row: AutosClassifiedsDashboardRow): string {
  const groupId = row.dealer_inventory_group_id?.trim();
  if (groupId) return groupId;
  if (row.inventory_role === "inventory_vehicle") {
    const parentId = row.dealer_inventory_parent_listing_id?.trim();
    if (parentId) return `parent:${parentId}`;
    return `orphan:${row.id}`;
  }
  return `parent:${row.id}`;
}

/**
 * Gate D.3 — canonical dashboard actions for one Autos Negocio dealer row (parent or vehicle
 * child), sourced from `resolveDashboardActions`. `sourceId` is always this row's OWN uuid
 * (never substituted with the parent's). Verified against the live builders before wiring:
 * `viewPublic` (`autosLiveVehiclePath`) and `analytics` (`autosPaidListingAnalyticsHref`) are
 * byte-identical to the registry's output; `edit`/`preview`/`manageInventory` add the row's real
 * `leonixAdId` as an optional query param the live call sites in this component simply don't
 * pass today — an addition of correct data, not a missing-required-field gap (unlike the
 * Bienes/Servicios parity gaps found in Gate D.1/D.2). Child Edit/Manage-inventory are never
 * consumed by any caller below — the resolver's own `editSupported`/`parent`-only gating already
 * excludes them for `autos_negocios` children, matching the locked product rule that no
 * per-child dashboard Edit entry point exists yet.
 */
function canonicalAutosNegocioActions(
  row: AutosClassifiedsDashboardRow,
  isChild: boolean,
  ownerUserId: string | null,
  lang: Lang,
): Map<string, DashboardAction> {
  if (!ownerUserId) return new Map();

  const identityResult = buildListingIdentity({
    sourceTable: "autos_classifieds_listings",
    sourceId: row.id,
    category: "autos",
    pipeline: "autos_negocios",
    leonixAdId: row.leonix_ad_id ?? "",
    ownerUserId,
    publicUrl: `${autosLiveVehiclePath(row.id)}?lang=${row.lang}`,
    parentSourceId: row.dealer_inventory_parent_listing_id ?? null,
    inventoryGroupId: row.dealer_inventory_group_id ?? null,
    inventoryRole: isChild ? "inventory_vehicle" : "main",
  });
  if (!identityResult.ok) return new Map();

  const actions = resolveDashboardActions({
    identity: identityResult.identity,
    lifecycle: { status: row.status },
    entitlement: {},
    role: isChild ? "inventory_vehicle" : "main",
    ownerVerified: true,
    lang,
  });

  return new Map(actions.map((action) => [action.key, action]));
}

export function AutosDealerInventoryDashboardSection({ lang }: { lang: Lang }) {
  const [rows, setRows] = useState<AutosClassifiedsDashboardRow[]>([]);
  const [dealerInventory, setDealerInventory] = useState<AutosDealerInventoryCount | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  /** Gate D.3 — page-level authenticated owner id, sourced from the same session fetch already
   * used for the API bearer token (no duplicate auth call, no new Supabase client). */
  const [ownerUserId, setOwnerUserId] = useState<string | null>(null);
  /** Package E Build E2, Gate 1/3 — parent-listing subscription state, keyed exactly like
   * `mis-anuncios/page.tsx`'s own fetch (same route, same shape). This component manages its own
   * data independently of that page, so it fetches once here, scoped only to Negocios PARENT rows
   * (never per-vehicle-child — children never carry an independent subscription), not a new
   * resolver or a per-row call. */
  const [subscriptionStates, setSubscriptionStates] = useState<Record<string, DashboardSubscriptionStateEntry>>({});

  const load = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    setOwnerUserId(data.session?.user?.id ?? null);
    if (!token) {
      setRows([]);
      setDealerInventory(null);
      setLoading(false);
      return;
    }
    const r = await fetch("/api/clasificados/autos/listings", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const j = (await r.json()) as {
      ok?: boolean;
      listings?: AutosClassifiedsDashboardRow[];
      dealerInventory?: AutosDealerInventoryCount;
    };
    if (r.ok && j.ok && Array.isArray(j.listings)) {
      setRows(j.listings);
      setDealerInventory(j.dealerInventory ?? null);
      const parentRows = j.listings.filter((row) => row.lane === "negocios" && row.inventory_role === "main");
      if (parentRows.length > 0) {
        const items = parentRows.map((row) => ({
          key: row.id,
          category: "autos",
          listingSource: "autos_classifieds_listings",
          listingId: row.id,
          slug: null,
          leonixAdId: row.leonix_ad_id ?? null,
        }));
        const { subscriptionStates: subs } = await fetchDashboardListingPackageEntitlementBadges(items, token);
        setSubscriptionStates(subs);
      } else {
        setSubscriptionStates({});
      }
    } else {
      setRows([]);
      setDealerInventory(null);
      setSubscriptionStates({});
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const groups = useMemo((): InventoryGroup[] => {
    const byKey = new Map<string, InventoryGroup>();
    for (const row of rows.filter((x) => x.lane === "negocios")) {
      const groupKey = resolveAutosDealerInventoryGroupKey(row);
      const existing = byKey.get(groupKey);
      const dealerName = row.sellerName.trim() || (lang === "es" ? "Dealer" : "Dealer");
      // Gate 6C.2 — the dealer parent (`inventory_role='main'`) is the commercial/grouping
      // anchor, never a vehicle; only `inventory_role='inventory_vehicle'` rows count toward
      // the displayed active-inventory tally, matching the corrected RPC/preflight semantics.
      const countsTowardCapacity = row.inventory_role === "inventory_vehicle";
      if (!existing) {
        byKey.set(groupKey, {
          groupKey,
          dealerName,
          mainListingId: row.inventory_role === "main" ? row.id : row.dealer_inventory_parent_listing_id,
          rows: [row],
          activeCount: row.status === "active" && countsTowardCapacity ? 1 : 0,
        });
      } else {
        existing.rows.push(row);
        if (row.status === "active" && countsTowardCapacity) existing.activeCount += 1;
        if (row.inventory_role === "main") existing.mainListingId = row.id;
        if (!existing.dealerName && row.sellerName.trim()) existing.dealerName = row.sellerName.trim();
      }
    }
    return [...byKey.values()].sort((a, b) => b.rows.length - a.rows.length);
  }, [rows, lang]);

  const t =
    lang === "es"
      ? {
          title: "Anuncios Autos",
          subtitle: "Tus publicaciones pagadas de Autos. Privado y Negocios se mantienen separados en el detalle público.",
          loading: "Cargando inventario…",
          empty: "Aún no tienes anuncios de Autos en el flujo de pago Leonix.",
          activeCount: "activos",
          remaining: "espacios restantes",
          addVehicle: "Agregar vehículo al inventario",
          manage: "Gestionar inventario",
          main: "Principal",
          inventory: "Inventario",
          manageListing: "Gestión disponible desde vista pública / admin",
          viewLive: "Ver público",
          viewAnalytics: "Ver analíticas",
          viewPreview: "Vista previa",
          unpublish: "Retirar",
          restore: "Reactivar",
          editVehicle: "Editar",
          publish: "Publicar",
          publishAutos: "Publicar en Autos",
          allListings: "Tus anuncios Autos",
          privado: "Privado",
          negocios: "Negocios",
          moreOptions: "Más opciones",
          moreOptionsClose: "Cerrar",
          price: "Precio",
          mileage: "Kilometraje",
          city: "Ciudad",
          updated: "Actualizado",
          eyebrowPrivado: "Auto privado",
          eyebrowDealer: "Autos dealer",
        }
      : {
          title: "Autos listings",
          subtitle: "Your paid Autos listings. Private and Dealer stay separate on the public detail page.",
          loading: "Loading inventory…",
          empty: "You do not have any Autos listings in the Leonix paid flow yet.",
          activeCount: "active",
          remaining: "slots remaining",
          addVehicle: "Add vehicle to inventory",
          manage: "Manage inventory",
          main: "Main",
          inventory: "Inventory",
          manageListing: "Manage from public view / admin",
          viewLive: "View live",
          viewAnalytics: "View analytics",
          viewPreview: "Preview",
          unpublish: "Unpublish",
          restore: "Reactivate",
          editVehicle: "Edit",
          publish: "Publish",
          publishAutos: "Publish in Autos",
          allListings: "Your Autos listings",
          privado: "Private",
          negocios: "Dealer",
          moreOptions: "More options",
          moreOptionsClose: "Close",
          price: "Price",
          mileage: "Mileage",
          city: "City",
          updated: "Updated",
          eyebrowPrivado: "Private auto",
          eyebrowDealer: "Auto dealer",
        };

  async function unpublish(id: string) {
    if (!confirm(lang === "es" ? "¿Retirar este vehículo del público?" : "Remove this vehicle from public view?")) return;
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;
    setBusyId(id);
    await fetch(`/api/clasificados/autos/listings/${id}/unpublish`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    setBusyId(null);
    void load();
  }

  /** Package A Gate 5 — owner resume: strictly removed→active via the owner-verified restore
   * API (the missing second half of the pause cycle; admin-suspended rows stay untouched). */
  async function restore(id: string) {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;
    setBusyId(id);
    await fetch(`/api/clasificados/autos/listings/${id}/restore`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    setBusyId(null);
    void load();
  }

  if (loading) {
    return (
      <div className="mt-6 rounded-3xl border border-[#D6C7AD]/85 bg-[#FFFDF7] p-6 text-sm text-[#5C5346]">{t.loading}</div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="mt-6 rounded-3xl border border-dashed border-[#D6C7AD]/85 bg-[#FFFDF7] p-5 text-sm text-[#5C5346]">
        <p className="font-semibold text-[#1F241C]">{t.empty}</p>
        <Link
          href={withLangParam("/publicar/autos", lang)}
          className="mt-4 inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[#7A1E2C]/15 bg-[#7A1E2C] px-4 text-sm font-semibold text-[#FFFCF7]"
        >
          {t.publishAutos}
        </Link>
      </div>
    );
  }

  const privadoCaps = getOwnerEntityCapabilities("autos-privado");
  const dealerCaps = getOwnerEntityCapabilities("autos-negocios");
  const privadoRows = rows.filter((row) => row.lane === "privado");
  const limit = dealerInventory?.limit ?? 10;
  const remaining = dealerInventory?.remainingSlots ?? Math.max(0, limit - (dealerInventory?.activeCount ?? 0));
  const atLimit = dealerInventory ? !dealerInventory.canAddActiveVehicle : false;

  function vehicleDetailItems(row: AutosClassifiedsDashboardRow) {
    return [
      row.priceUsd != null ? { label: t.price, value: formatUsd(row.priceUsd, lang) } : null,
      row.mileage != null ? { label: t.mileage, value: new Intl.NumberFormat(lang === "es" ? "es-US" : "en-US").format(row.mileage) } : null,
      row.city ? { label: t.city, value: row.city } : null,
      row.updated_at ? { label: t.updated, value: new Date(row.updated_at).toLocaleString(lang === "es" ? "es-US" : "en-US") } : null,
    ].filter((x): x is { label: string; value: string } => x !== null);
  }

  function autosPrivadoEditHref(id: string) {
    return `/publicar/autos/privado?edit=1&source=dashboard&listingId=${encodeURIComponent(id)}&returnPanel=autos&lang=${lang}`;
  }
  function autosPrivadoPreviewHref(id: string) {
    return `/clasificados/autos/privado/preview?edit=1&source=dashboard&listingId=${encodeURIComponent(id)}&returnPanel=autos&lang=${lang}`;
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      {privadoRows.map((row) => {
        const uiStatus = resolveListingUiStatus({ status: row.status });
        const busy = busyId === row.id;
        const liveHref = `${autosLiveVehiclePath(row.id)}?lang=${row.lang}`;
        const quickActions: ActionItem[] = [];
        if (row.status === "active" && isLiveCapability(privadoCaps.identity.publicView)) {
          quickActions.push({ href: liveHref, label: publicViewLabel(lang), tone: "secondary" });
        }
        if (isLiveCapability(privadoCaps.identity.preview)) {
          quickActions.push({ href: autosPrivadoPreviewHref(row.id), label: previewLabel(lang), tone: "secondary" });
        }
        if (row.status === "active" && isLiveCapability(privadoCaps.identity.analytics)) {
          quickActions.push({
            href: autosPaidListingAnalyticsHref({ listingId: row.id, lang, leonixAdId: row.leonix_ad_id }),
            label: analyticsLabel(lang),
            tone: "secondary",
          });
        }
        const lifecycleActions: ActionItem[] = [];
        if (row.status === "active" && isLiveCapability(privadoCaps.lifecycle.archive)) {
          lifecycleActions.push({ label: t.unpublish, onClick: () => void unpublish(row.id), disabled: busy, tone: "danger" });
        }
        if (row.status === "removed" && isLiveCapability(privadoCaps.lifecycle.reactivate)) {
          lifecycleActions.push({
            label: resumeListingLabel(lang),
            onClick: () => void restore(row.id),
            disabled: busy,
            tone: "positive",
          });
        }
        return (
          <OwnerEntityWorkspace
            key={row.id}
            lang={lang}
            header={{
              eyebrow: t.eyebrowPrivado,
              title: row.title,
              statusLabel: listingUiStatusLabel(uiStatus, lang),
              statusChipClass: listingUiStatusChipClass(uiStatus),
              leonixId: row.leonix_ad_id,
            }}
            detailItems={vehicleDetailItems(row)}
            primaryAction={{ href: autosPrivadoEditHref(row.id), label: editListingLabel(lang) }}
            quickActions={quickActions}
            lifecycleActions={lifecycleActions}
            mobileSheetLabels={{ trigger: t.moreOptions, title: t.moreOptions, close: t.moreOptionsClose }}
          />
        );
      })}

      {groups.map((group) => {
        const parentId =
          group.mainListingId ??
          group.rows.find((r) => r.inventory_role === "main")?.id ??
          group.rows[0]?.id;
        if (!parentId) return null;
        const groupId =
          group.groupKey.startsWith("parent:") || group.groupKey.startsWith("orphan:")
            ? null
            : group.groupKey;
        const addCtx = {
          parentListingId: parentId,
          returnToListingId: parentId,
          dealerInventoryGroupId: groupId,
        };
        const groupCounts = summarizeDealerInventory(group.activeCount, limit);
        const parentRow = group.rows.find((r) => r.id === parentId);
        const parentCanonical = parentRow
          ? canonicalAutosNegocioActions(parentRow, false, ownerUserId, lang)
          : new Map<string, DashboardAction>();
        const childRows = group.rows.filter((r) => r.inventory_role === "inventory_vehicle" || r.id !== parentId);
        const uiStatus = resolveListingUiStatus({ status: parentRow?.status });
        const busy = busyId === parentId;
        const subState = dashboardSubscriptionStateForKey(subscriptionStates, [parentId]);
        const note = subState
          ? commercialStateBadgesToLifecycleNote(
              resolveCommercialStateBadges({
                subscriptionStatus: subState.status,
                cancelAtPeriodEnd: subState.cancelAtPeriodEnd,
                graceEndsAt: subState.graceEndsAt,
                suspensionReason: subState.suspensionReason,
                recoveredAt: subState.recoveredAt,
              }),
              lang,
            )
          : null;

        const parentDetail = [
          ...(parentRow ? vehicleDetailItems(parentRow) : []),
          { label: lang === "es" ? "Inventario activo" : "Active inventory", value: autosDealerInventoryActiveCountLine(lang, group.activeCount, limit) },
          remaining >= 0 ? { label: lang === "es" ? "Espacios restantes" : "Remaining slots", value: autosDealerInventoryRemainingSlotsLine(lang, remaining) } : null,
        ].filter((x): x is { label: string; value: string } => x !== null);

        const quickActions: ActionItem[] = [];
        if (parentRow?.status === "active" && isLiveCapability(dealerCaps.identity.publicView)) {
          quickActions.push({
            href: parentCanonical.get("viewPublic")?.href ?? `${autosLiveVehiclePath(parentId)}?lang=${parentRow.lang}`,
            label: publicViewLabel(lang),
            tone: "secondary",
          });
        }
        if (isLiveCapability(dealerCaps.identity.preview)) {
          quickActions.push({
            href:
              parentCanonical.get("preview")?.href ??
              autosDealerListingPreviewHref({ lang, listingId: parentId, leonixAdId: parentRow?.leonix_ad_id ?? null }),
            label: previewLabel(lang),
            tone: "secondary",
          });
        }
        if (parentRow?.status === "active" && isLiveCapability(dealerCaps.identity.analytics)) {
          quickActions.push({
            href:
              parentCanonical.get("analytics")?.href ??
              autosPaidListingAnalyticsHref({ listingId: parentId, lang, leonixAdId: parentRow?.leonix_ad_id ?? null }),
            label: analyticsLabel(lang),
            tone: "secondary",
          });
        }

        const lifecycleActions: ActionItem[] = [];
        if (parentRow?.status === "active" && isLiveCapability(dealerCaps.lifecycle.archive)) {
          lifecycleActions.push({ label: t.unpublish, onClick: () => void unpublish(parentId), disabled: busy, tone: "danger" });
        }
        if (parentRow?.status === "removed" && isLiveCapability(dealerCaps.lifecycle.reactivate)) {
          lifecycleActions.push({
            label: resumeListingLabel(lang),
            onClick: () => void restore(parentId),
            disabled: busy,
            tone: "positive",
          });
        }

        const specializedActions: ActionItem[] = [];
        if (isLiveCapability(dealerCaps.specialized.inventory)) {
          specializedActions.push({
            href: parentCanonical.get("manageInventory")?.href ?? autosDealerInventoryEditHref({ lang, listingId: parentId }),
            label: manageInventoryLabel(lang),
            tone: "premium",
          });
        }
        if (atLimit && REVENUE_OS_AUTOS_DEALER_INVENTORY_PACK_SUPPORTED) {
          specializedActions.push({
            label: autosDealerInventoryPackAddonUpgradeLabel(lang),
            onClick: () => void redirectAutosDealerInventoryPackCheckout({ listingId: parentId, lang }),
            tone: "premium",
          });
        }

        return (
          <OwnerEntityWorkspace
            key={group.groupKey}
            lang={lang}
            header={{
              eyebrow: t.eyebrowDealer,
              title: group.dealerName,
              subtitle: parentRow?.title,
              statusLabel: listingUiStatusLabel(uiStatus, lang),
              statusChipClass: listingUiStatusChipClass(uiStatus),
              leonixId: parentRow?.leonix_ad_id,
              badges: [t.negocios],
            }}
            note={note ? { text: note.text, tone: note.tone } : atLimit ? { text: autosDealerInventoryLimitMessage(lang), tone: "warning" } : null}
            detailItems={parentDetail}
            primaryAction={{
              href: parentCanonical.get("edit")?.href ?? autosDealerListingEditHref({ lang, listingId: parentId }),
              label: editListingLabel(lang),
            }}
            quickActions={quickActions}
            lifecycleActions={lifecycleActions}
            specialized={{
              title: ownerToolsTitle(lang),
              actions: specializedActions,
              children: (
                <div className="flex flex-col gap-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8A6B1F]">{ownerInventoryModuleTitle(lang)}</p>
                  {!atLimit ? (
                    <AutosNegociosInventoryValueDrawerTrigger
                      lang={lang}
                      addCtx={addCtx}
                      counts={groupCounts}
                      label={autosDealerInventoryAddVehicleCta(lang)}
                      className="!min-h-[40px] !rounded-xl !px-4 !text-sm"
                    />
                  ) : null}
                  {childRows.length === 0 ? (
                    <p className="text-xs text-[#9A9084]">
                      {lang === "es" ? "Aún no hay vehículos de inventario en este dealer." : "No inventory vehicles on this dealer yet."}
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-3">
                      {childRows.map((row) => {
                        const isChildRow = row.inventory_role === "inventory_vehicle";
                        const rowBusy = busyId === row.id;
                        const rowCanonical = canonicalAutosNegocioActions(row, isChildRow, ownerUserId, lang);
                        const childActions: ActionItem[] = [];
                        if (isChildRow) {
                          childActions.push({
                            href: `${autosDealerInventoryEditHref({ lang, listingId: parentId })}&editVehicleId=${encodeURIComponent(row.id)}`,
                            label: t.editVehicle,
                            tone: "primary",
                          });
                        }
                        if (row.status === "active") {
                          childActions.push({
                            href: rowCanonical.get("viewPublic")?.href ?? `${autosLiveVehiclePath(row.id)}?lang=${row.lang}`,
                            label: publicViewLabel(lang),
                            tone: "secondary",
                          });
                          childActions.push({
                            href:
                              rowCanonical.get("preview")?.href ??
                              autosDealerListingPreviewHref({ lang, listingId: row.id, leonixAdId: row.leonix_ad_id }),
                            label: previewLabel(lang),
                            tone: "secondary",
                          });
                          childActions.push({
                            href:
                              rowCanonical.get("analytics")?.href ??
                              autosPaidListingAnalyticsHref({ listingId: row.id, lang, leonixAdId: row.leonix_ad_id }),
                            label: analyticsLabel(lang),
                            tone: "secondary",
                          });
                          childActions.push({
                            label: t.unpublish,
                            onClick: () => void unpublish(row.id),
                            disabled: rowBusy,
                            tone: "danger",
                          });
                        } else if (row.status === "removed") {
                          childActions.push({
                            label: resumeListingLabel(lang),
                            onClick: () => void restore(row.id),
                            disabled: rowBusy,
                            tone: "positive",
                          });
                        }
                        return (
                          <li key={row.id} className="rounded-xl border border-[#D6C7AD]/70 bg-[#FBF7EF]/70 p-3">
                            <p className="font-semibold text-[#1F241C]">{row.title}</p>
                            <p className="mt-0.5 text-xs text-[#5C5346]">
                              {[formatUsd(row.priceUsd, lang), statusLabel(row.status, lang), t.inventory, row.leonix_ad_id]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                            <div className="mt-2">
                              <DashboardListingActionBar actions={childActions} />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ),
            }}
            mobileSheetLabels={{ trigger: t.moreOptions, title: t.moreOptions, close: t.moreOptionsClose }}
            footerHint={!atLimit ? autosDealerInventoryUpgradePitch(lang) : null}
          />
        );
      })}
    </div>
  );
}
