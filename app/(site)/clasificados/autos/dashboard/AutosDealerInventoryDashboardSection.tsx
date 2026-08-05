"use client";

import Link from "next/link";
import { AutosNegociosInventoryValueDrawerTrigger } from "./AutosNegociosInventoryValueDrawerTrigger";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import type { AutosClassifiedsDashboardRow } from "@/app/lib/clasificados/autos/autosClassifiedsListingService";
import type { AutosDealerInventoryCount } from "@/app/lib/clasificados/autos/autosDealerInventoryPolicy";
import {
  autosListingStatusLabelEn,
  autosListingStatusLabelEs,
} from "@/app/lib/clasificados/autos/autosClassifiedsVisibility";
import { withLangParam } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import { autosLiveVehiclePath } from "@/app/clasificados/autos/filters/autosBrowseFilterContract";
import { dealerInventoryGroupPublicPath } from "@/app/lib/clasificados/autos/autosDealerInventoryAddFlow";
import { autosDealerInventoryAddVehicleCta } from "@/app/lib/clasificados/autos/autosDealerInventoryValueCopy";
import { summarizeDealerInventory } from "@/app/lib/clasificados/autos/autosDealerInventoryPolicy";
import {
  autosDealerInventoryLimitMessage,
  autosDealerInventoryUpgradePitch,
} from "@/app/lib/clasificados/autos/autosDealerInventoryCopy";
import {
  autosDealerInventoryValueBullets,
} from "@/app/lib/clasificados/autos/autosDealerInventoryValueCopy";
import {
  autosDealerInventoryEditHref,
  autosDealerInventoryPackAddonUpgradeLabel,
  autosDealerInventoryPackEditLabel,
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
    } else {
      setRows([]);
      setDealerInventory(null);
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
      if (!existing) {
        byKey.set(groupKey, {
          groupKey,
          dealerName,
          mainListingId: row.inventory_role === "main" ? row.id : row.dealer_inventory_parent_listing_id,
          rows: [row],
          activeCount: row.status === "active" ? 1 : 0,
        });
      } else {
        existing.rows.push(row);
        if (row.status === "active") existing.activeCount += 1;
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
      <div className="mt-6 rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7]/90 p-6 text-sm text-[#5C5346]">{t.loading}</div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-[#C9B46A]/45 bg-[#FFFCF7]/80 p-5 text-sm text-[#5C5346]">
        <p className="font-bold text-[#1E1810]">{t.empty}</p>
        <Link
          href={withLangParam("/publicar/autos", lang)}
          className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#2A2620] px-4 text-sm font-bold text-[#FAF7F2]"
        >
          {t.publishAutos}
        </Link>
      </div>
    );
  }

  const hasNegociosRows = rows.some((row) => row.lane === "negocios");
  const limit = dealerInventory?.limit ?? 10;
  const activeCount = dealerInventory?.activeCount ?? 0;
  const remaining = dealerInventory?.remainingSlots ?? Math.max(0, limit - activeCount);
  const atLimit = dealerInventory ? !dealerInventory.canAddActiveVehicle : false;

  return (
    <div className="mt-6 rounded-2xl border border-[#C9B46A]/35 bg-gradient-to-br from-[#FFFCF7] to-[#FAF7F2] p-5 shadow-[0_10px_32px_-12px_rgba(42,36,22,0.1)]">
      <h2 className="text-lg font-bold text-[#1E1810]">{t.title}</h2>
      <p className="mt-1 text-sm text-[#5C5346]/95">{t.subtitle}</p>
      {hasNegociosRows ? (
        <>
          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {autosDealerInventoryValueBullets(lang).map((line) => (
              <li key={line} className="flex gap-2 text-xs font-medium text-[#5C5346]">
                <span className="text-[#C9B46A]" aria-hidden>
                  ✓
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm font-semibold text-[#1E1810]">
            {autosDealerInventoryActiveCountLine(lang, activeCount, limit)}
          </p>
          <p className="mt-1 text-xs font-medium text-[#5C5346]">
            {autosDealerInventoryRemainingSlotsLine(lang, remaining)}
          </p>
        </>
      ) : null}
      {hasNegociosRows && atLimit ? (
        <div className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
          <p>{autosDealerInventoryLimitMessage(lang)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {REVENUE_OS_AUTOS_DEALER_INVENTORY_PACK_SUPPORTED && groups[0]?.mainListingId ? (
              <button
                type="button"
                className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-[#2A2620] px-3 text-xs font-bold text-[#FAF7F2]"
                onClick={() =>
                  void redirectAutosDealerInventoryPackCheckout({
                    listingId: groups[0]!.mainListingId!,
                    lang,
                  })
                }
              >
                {autosDealerInventoryPackAddonUpgradeLabel(lang)}
              </button>
            ) : null}
          </div>
        </div>
      ) : hasNegociosRows ? (
        <p className="mt-3 text-xs text-[#5C5346]">{autosDealerInventoryUpgradePitch(lang)}</p>
      ) : null}

      <section className="mt-6 rounded-xl border border-[#E8DFD0]/90 bg-white/90 p-4">
        <h3 className="font-bold text-[#1E1810]">{t.allListings}</h3>
        <ul className="mt-4 flex flex-col gap-3">
          {rows.map((row) => {
            const liveHref = `${autosLiveVehiclePath(row.id)}?lang=${row.lang}`;
            const busy = busyId === row.id;
            return (
              <li key={row.id} className="rounded-lg border border-[#E8DFD0]/80 bg-[#FFFCF7]/80 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-[#1E1810]">{row.title}</p>
                    <p className="mt-0.5 text-xs text-[#5C5346]">
                      {row.lane === "negocios" ? t.negocios : t.privado} · {formatUsd(row.priceUsd, lang)} · {statusLabel(row.status, lang)}
                      {row.leonix_ad_id ? ` · ${row.leonix_ad_id}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {row.status === "active" ? (
                      <>
                        <Link href={liveHref} className="rounded-lg border border-[#C9B46A]/45 px-2.5 py-1.5 text-[11px] font-bold">
                          {t.viewLive}
                        </Link>
                        <Link
                          href={autosPaidListingAnalyticsHref({
                            listingId: row.id,
                            lang,
                            leonixAdId: row.leonix_ad_id,
                          })}
                          className="rounded-lg border border-[#E8DFD0] bg-white/70 px-2.5 py-1.5 text-[11px] font-bold text-[#2C2416]"
                        >
                          {t.viewAnalytics}
                        </Link>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void unpublish(row.id)}
                          className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-bold text-red-900 disabled:opacity-50"
                        >
                          {t.unpublish}
                        </button>
                      </>
                    ) : row.status === "removed" ? (
                      /* Package A Gate 5 — the missing resume half of the owner pause cycle:
                         strictly removed→active via the owner-verified restore API. */
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void restore(row.id)}
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-900 disabled:opacity-50"
                      >
                        {t.restore}
                      </button>
                    ) : (
                      <span className="rounded-lg border border-[#E8DFD0] bg-white/70 px-2.5 py-1.5 text-[11px] font-bold text-[#5C5346]">
                        {t.manageListing}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mt-6 flex flex-col gap-6">
        {groups.map((group) => {
          const parentId =
            group.mainListingId ??
            group.rows.find((r) => r.inventory_role === "main")?.id ??
            group.rows[0]?.id;
          if (!parentId) return null;
          // Synthetic dashboard-local keys (never a real stored dealer_inventory_group_id) must
          // never leak into the public group page or the Add Vehicle context's explicit group id.
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
          const manageHref = groupId
            ? dealerInventoryGroupPublicPath(groupId, lang)
            : `/dashboard/mis-anuncios?lang=${lang}&cat=autos`;
          const parentRow = group.rows.find((r) => r.id === parentId);
          const parentCanonical = parentRow
            ? canonicalAutosNegocioActions(parentRow, false, ownerUserId, lang)
            : new Map<string, DashboardAction>();
          return (
            <section key={group.groupKey} className="rounded-xl border border-[#E8DFD0]/90 bg-white/90 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-bold text-[#1E1810]">{group.dealerName}</h3>
                  <p className="mt-0.5 text-xs text-[#5C5346]">
                    {group.activeCount} / {limit} {t.activeCount}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!atLimit ? (
                    <AutosNegociosInventoryValueDrawerTrigger
                      lang={lang}
                      addCtx={addCtx}
                      counts={groupCounts}
                      label={autosDealerInventoryAddVehicleCta(lang)}
                      className="!min-h-[40px] !rounded-lg !px-3 !text-xs"
                    />
                  ) : null}
                  {parentId ? (
                    <Link
                      href={
                        parentCanonical.get("edit")?.href ??
                        autosDealerListingEditHref({ lang, listingId: parentId })
                      }
                      className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-[#E8DFD0] bg-[#FFFCF7] px-3 text-xs font-bold text-[#2C2416]"
                    >
                      {lang === "es" ? "Editar anuncio" : "Edit listing"}
                    </Link>
                  ) : null}
                  {parentId ? (
                    <Link
                      href={
                        parentCanonical.get("preview")?.href ??
                        autosDealerListingPreviewHref({
                          lang,
                          listingId: parentId,
                          leonixAdId: parentRow?.leonix_ad_id ?? null,
                        })
                      }
                      className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-[#E8DFD0] bg-white/70 px-3 text-xs font-bold text-[#2C2416]"
                    >
                      {t.viewPreview}
                    </Link>
                  ) : null}
                  {parentId && parentRow?.status === "active" ? (
                    <Link
                      href={
                        parentCanonical.get("analytics")?.href ??
                        autosPaidListingAnalyticsHref({
                          listingId: parentId,
                          lang,
                          leonixAdId: parentRow?.leonix_ad_id ?? null,
                        })
                      }
                      className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-[#E8DFD0] bg-white/70 px-3 text-xs font-bold text-[#2C2416]"
                    >
                      {t.viewAnalytics}
                    </Link>
                  ) : null}
                  {parentId ? (
                    <Link
                      href={
                        parentCanonical.get("manageInventory")?.href ??
                        autosDealerInventoryEditHref({ lang, listingId: parentId })
                      }
                      className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-[#C9B46A]/45 bg-[#FBF7EF] px-3 text-xs font-bold text-[#5C4E2E]"
                    >
                      {autosDealerInventoryPackEditLabel(lang)}
                    </Link>
                  ) : null}
                  <Link
                    href={manageHref}
                    className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-[#E8DFD0] bg-[#FFFCF7] px-3 text-xs font-bold text-[#2C2416]"
                  >
                    {t.manage}
                  </Link>
                </div>
              </div>
              <ul className="mt-4 flex flex-col gap-3">
                {group.rows.map((row) => {
                  const liveHref = `${autosLiveVehiclePath(row.id)}?lang=${row.lang}`;
                  const isChildRow = row.inventory_role === "inventory_vehicle";
                  const roleLabel =
                    row.inventory_role === "main"
                      ? t.main
                      : isChildRow
                        ? t.inventory
                        : null;
                  const busy = busyId === row.id;
                  const rowCanonical = canonicalAutosNegocioActions(row, isChildRow, ownerUserId, lang);
                  return (
                    <li key={row.id} className="rounded-lg border border-[#E8DFD0]/80 bg-[#FFFCF7]/80 p-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="font-semibold text-[#1E1810]">{row.title}</p>
                          <p className="mt-0.5 text-xs text-[#5C5346]">
                            {formatUsd(row.priceUsd, lang)} · {statusLabel(row.status, lang)}
                            {roleLabel ? ` · ${roleLabel}` : ""}
                            {row.leonix_ad_id ? ` · ${row.leonix_ad_id}` : ""}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {/* Package B (Gate B5) — DIRECT child edit action (ledger defect
                              D3): deep-links into the parent's inventory-edit context with
                              editVehicleId, opening THIS vehicle's own drawer editor.
                              Available in every status (drawer edits propagate to the child's
                              own row via the Gate B5 server sync). */}
                          {isChildRow && parentId ? (
                            <Link
                              href={`${autosDealerInventoryEditHref({ lang, listingId: parentId })}&editVehicleId=${encodeURIComponent(row.id)}`}
                              className="rounded-lg border border-[#C9B46A]/60 bg-[#FBF7EF] px-2.5 py-1.5 text-[11px] font-bold text-[#5C4E2E]"
                            >
                              {t.editVehicle}
                            </Link>
                          ) : null}
                          {row.status === "active" ? (
                            <>
                              <Link
                                href={rowCanonical.get("viewPublic")?.href ?? liveHref}
                                className="rounded-lg border border-[#C9B46A]/45 px-2.5 py-1.5 text-[11px] font-bold"
                              >
                                {t.viewLive}
                              </Link>
                              <Link
                                href={
                                  rowCanonical.get("preview")?.href ??
                                  autosDealerListingPreviewHref({
                                    lang,
                                    listingId: row.id,
                                    leonixAdId: row.leonix_ad_id,
                                  })
                                }
                                className="rounded-lg border border-[#E8DFD0] bg-white/70 px-2.5 py-1.5 text-[11px] font-bold text-[#2C2416]"
                              >
                                {t.viewPreview}
                              </Link>
                              <Link
                                href={
                                  rowCanonical.get("analytics")?.href ??
                                  autosPaidListingAnalyticsHref({
                                    listingId: row.id,
                                    lang,
                                    leonixAdId: row.leonix_ad_id,
                                  })
                                }
                                className="rounded-lg border border-[#E8DFD0] bg-white/70 px-2.5 py-1.5 text-[11px] font-bold text-[#2C2416]"
                              >
                                {t.viewAnalytics}
                              </Link>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void unpublish(row.id)}
                                className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-bold text-red-900 disabled:opacity-50"
                              >
                                {t.unpublish}
                              </button>
                            </>
                          ) : row.status === "removed" ? (
                            /* Package A Gate 5 — owner resume (removed→active). */
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void restore(row.id)}
                              className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-900 disabled:opacity-50"
                            >
                              {t.restore}
                            </button>
                          ) : (
                            <span className="rounded-lg border border-[#E8DFD0] bg-white/70 px-2.5 py-1.5 text-[11px] font-bold text-[#5C5346]">
                              {t.manageListing}
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
