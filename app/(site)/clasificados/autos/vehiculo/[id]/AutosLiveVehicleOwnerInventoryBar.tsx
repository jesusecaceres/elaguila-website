"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { dealerInventoryGroupPublicPath } from "@/app/lib/clasificados/autos/autosDealerInventoryAddFlow";
import { autosDealerInventoryAddVehicleCta } from "@/app/lib/clasificados/autos/autosDealerInventoryValueCopy";
import {
  autosDealerInventoryActiveCountLine,
  autosDealerInventoryRemainingSlotsLine,
} from "@/app/lib/clasificados/autos/autosDealerInventoryDisplay";
import type { AutosDealerInventoryCount } from "@/app/lib/clasificados/autos/autosDealerInventoryPolicy";
import { AutosNegociosInventoryValueDrawerTrigger } from "@/app/clasificados/autos/dashboard/AutosNegociosInventoryValueDrawerTrigger";

type OwnerRow = {
  id: string;
  lane: string;
  status: string;
  dealer_inventory_group_id: string | null;
  dealer_inventory_parent_listing_id: string | null;
  inventory_role: string | null;
};

export function AutosLiveVehicleOwnerInventoryBar({
  listingId,
  lang,
}: {
  listingId: string;
  lang: "es" | "en";
}) {
  const [ownerRows, setOwnerRows] = useState<OwnerRow[] | null>(null);
  const [counts, setCounts] = useState<AutosDealerInventoryCount | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        if (!cancelled) {
          setOwnerRows(null);
          setCounts(null);
        }
        return;
      }
      const r = await fetch("/api/clasificados/autos/listings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = (await r.json()) as {
        ok?: boolean;
        listings?: OwnerRow[];
        dealerInventory?: AutosDealerInventoryCount;
      };
      if (cancelled) return;
      if (r.ok && j.ok && Array.isArray(j.listings)) {
        setOwnerRows(j.listings);
        setCounts(j.dealerInventory ?? null);
      } else {
        setOwnerRows(null);
        setCounts(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const ctx = useMemo(() => {
    if (!ownerRows) return null;
    const row = ownerRows.find((x) => x.id === listingId && x.lane === "negocios");
    if (!row) return null;
    const parentId =
      row.inventory_role === "main"
        ? row.id
        : row.dealer_inventory_parent_listing_id?.trim() || row.id;
    const groupId = row.dealer_inventory_group_id?.trim() || null;
    return {
      parentListingId: parentId,
      returnToListingId: listingId,
      dealerInventoryGroupId: groupId,
    };
  }, [ownerRows, listingId]);

  if (!ctx || !counts) return null;

  const atLimit = !counts.canAddActiveVehicle;
  const manageHref = ctx.dealerInventoryGroupId
    ? dealerInventoryGroupPublicPath(ctx.dealerInventoryGroupId, lang)
    : `/dashboard/mis-anuncios?lang=${lang}&cat=autos`;

  const t =
    lang === "es"
      ? {
          title: "Tu inventario Autos Negocio",
          manage: "Gestionar inventario",
        }
      : {
          title: "Your Autos Negocio inventory",
          manage: "Manage inventory",
        };

  return (
    <div className="mx-auto mb-6 max-w-[1280px] px-4">
      <div className="rounded-[16px] border border-[color:var(--lx-gold-border)]/55 bg-[color:var(--lx-nav-hover)]/90 px-4 py-4 shadow-sm sm:px-5">
        <p className="text-sm font-bold text-[color:var(--lx-text)]">{t.title}</p>
        <p className="mt-1 text-sm font-semibold text-[color:var(--lx-text-2)]">
          {autosDealerInventoryActiveCountLine(lang, counts.activeCount, counts.limit)}
        </p>
        <p className="mt-0.5 text-xs text-[color:var(--lx-muted)]">
          {autosDealerInventoryRemainingSlotsLine(lang, counts.remainingSlots)}
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {!atLimit ? (
            <AutosNegociosInventoryValueDrawerTrigger
              lang={lang}
              addCtx={ctx}
              counts={counts}
              label={autosDealerInventoryAddVehicleCta(lang)}
              className="!min-h-[44px] !rounded-xl !text-sm"
            />
          ) : null}
          <Link
            href={manageHref}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-4 text-sm font-semibold text-[color:var(--lx-text)]"
          >
            {t.manage}
          </Link>
        </div>
      </div>
    </div>
  );
}
