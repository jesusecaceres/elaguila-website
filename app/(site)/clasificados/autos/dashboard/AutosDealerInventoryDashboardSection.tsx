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
  autosDealerInventoryUpgradeContactHref,
  autosDealerInventoryUpgradeCtaLabel,
  autosDealerInventoryUpgradePitch,
} from "@/app/lib/clasificados/autos/autosDealerInventoryCopy";
import { autosDealerInventoryValueBullets } from "@/app/lib/clasificados/autos/autosDealerInventoryValueCopy";
import type { AutosClassifiedsListingStatus } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";

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

export function AutosDealerInventoryDashboardSection({ lang }: { lang: Lang }) {
  const [rows, setRows] = useState<AutosClassifiedsDashboardRow[]>([]);
  const [dealerInventory, setDealerInventory] = useState<AutosDealerInventoryCount | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
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
      setRows(j.listings.filter((x) => x.lane === "negocios"));
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
    for (const row of rows) {
      const groupKey = row.dealer_inventory_group_id?.trim() || "owner:default";
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
          title: "Inventario Autos Negocio",
          subtitle: "Cada vehículo es su propio anuncio activo. Agrupa y gestiona tu inventario del dealer.",
          loading: "Cargando inventario…",
          empty: "Aún no tienes vehículos Negocio en el flujo de pago Leonix.",
          activeCount: "activos",
          remaining: "espacios restantes",
          addVehicle: "Agregar vehículo al inventario",
          manage: "Gestionar inventario",
          main: "Principal",
          inventory: "Inventario",
          edit: "Editar",
          viewLive: "Ver público",
          unpublish: "Retirar",
          publish: "Publicar",
        }
      : {
          title: "Autos Negocio inventory",
          subtitle: "Each vehicle is its own live listing. Group and manage your dealer inventory.",
          loading: "Loading inventory…",
          empty: "You do not have any Negocio vehicles in the Leonix paid flow yet.",
          activeCount: "active",
          remaining: "slots remaining",
          addVehicle: "Add vehicle to inventory",
          manage: "Manage inventory",
          main: "Main",
          inventory: "Inventory",
          edit: "Edit",
          viewLive: "View live",
          unpublish: "Unpublish",
          publish: "Publish",
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
          href={withLangParam("/publicar/autos/negocios", lang)}
          className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#2A2620] px-4 text-sm font-bold text-[#FAF7F2]"
        >
          {lang === "es" ? "Publicar en Autos Negocio" : "Publish Autos Business"}
        </Link>
      </div>
    );
  }

  const limit = dealerInventory?.limit ?? 10;
  const activeCount = dealerInventory?.activeCount ?? 0;
  const remaining = dealerInventory?.remainingSlots ?? Math.max(0, limit - activeCount);
  const atLimit = dealerInventory ? !dealerInventory.canAddActiveVehicle : false;

  return (
    <div className="mt-6 rounded-2xl border border-[#C9B46A]/35 bg-gradient-to-br from-[#FFFCF7] to-[#FAF7F2] p-5 shadow-[0_10px_32px_-12px_rgba(42,36,22,0.1)]">
      <h2 className="text-lg font-bold text-[#1E1810]">{t.title}</h2>
      <p className="mt-1 text-sm text-[#5C5346]/95">{t.subtitle}</p>
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
        {activeCount} / {limit} {t.activeCount}
        <span className="mx-2 text-[#7A7164]">·</span>
        {remaining} {t.remaining}
      </p>
      {atLimit ? (
        <div className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
          <p>{autosDealerInventoryLimitMessage(lang)}</p>
          <a
            href={autosDealerInventoryUpgradeContactHref(lang)}
            className="mt-3 inline-flex min-h-[40px] items-center justify-center rounded-lg border border-amber-300 bg-white px-3 text-xs font-bold text-amber-950"
          >
            {autosDealerInventoryUpgradeCtaLabel(lang)}
          </a>
        </div>
      ) : (
        <p className="mt-3 text-xs text-[#5C5346]">{autosDealerInventoryUpgradePitch(lang)}</p>
      )}

      <div className="mt-6 flex flex-col gap-6">
        {groups.map((group) => {
          const parentId =
            group.mainListingId ??
            group.rows.find((r) => r.inventory_role === "main")?.id ??
            group.rows[0]?.id;
          if (!parentId) return null;
          const groupId = group.groupKey.startsWith("owner:") ? null : group.groupKey;
          const addCtx = {
            parentListingId: parentId,
            returnToListingId: parentId,
            dealerInventoryGroupId: groupId,
          };
          const groupCounts = summarizeDealerInventory(group.activeCount, limit);
          const manageHref = groupId
            ? dealerInventoryGroupPublicPath(groupId, lang)
            : `/dashboard/mis-anuncios?lang=${lang}&cat=autos`;
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
                  const editHref = withLangParam("/publicar/autos/negocios", row.lang);
                  const confirmHref = withLangParam(`${editHref}/confirm`, row.lang);
                  const liveHref = `${autosLiveVehiclePath(row.id)}?lang=${row.lang}`;
                  const roleLabel =
                    row.inventory_role === "main"
                      ? t.main
                      : row.inventory_role === "inventory_vehicle"
                        ? t.inventory
                        : null;
                  const busy = busyId === row.id;
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
                          <Link href={editHref} className="rounded-lg border border-[#E8DFD0] px-2.5 py-1.5 text-[11px] font-bold">
                            {t.edit}
                          </Link>
                          {row.status === "draft" || row.status === "pending_payment" || row.status === "payment_failed" ? (
                            <Link href={confirmHref} className="rounded-lg bg-[#2A2620] px-2.5 py-1.5 text-[11px] font-bold text-[#FAF7F2]">
                              {t.publish}
                            </Link>
                          ) : null}
                          {row.status === "active" ? (
                            <>
                              <Link href={liveHref} className="rounded-lg border border-[#C9B46A]/45 px-2.5 py-1.5 text-[11px] font-bold">
                                {t.viewLive}
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
                          ) : null}
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
