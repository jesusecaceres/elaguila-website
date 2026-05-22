"use client";

import { useEffect, useState } from "react";
import type { AutosPublicListing } from "@/app/clasificados/autos/data/autosPublicSampleTypes";
import { autosLiveVehiclePath } from "@/app/clasificados/autos/filters/autosBrowseFilterContract";
import { AutosDealerInventoryVehicleCard } from "@/app/clasificados/autos/negocios/components/AutosDealerInventoryVehicleCard";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import { sortDealerInventoryPublicListings } from "@/app/lib/clasificados/autos/autosDealerInventoryDisplay";

type Lang = AutosNegociosLang;

export function AutosDealerInventoryPageClient({
  groupId,
  lang,
}: {
  groupId: string;
  lang: Lang;
}) {
  const [dealerName, setDealerName] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [state, setState] = useState<string | null>(null);
  const [listings, setListings] = useState<AutosPublicListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const r = await fetch(
        `/api/clasificados/autos/public/dealer/${encodeURIComponent(groupId)}?lang=${lang}`,
        { cache: "no-store" },
      );
      const j = (await r.json()) as {
        ok?: boolean;
        dealerName?: string | null;
        city?: string | null;
        state?: string | null;
        listings?: AutosPublicListing[];
      };
      if (cancelled) return;
      if (r.ok && j.ok) {
        setDealerName(j.dealerName ?? null);
        setCity(j.city ?? null);
        setState(j.state ?? null);
        setListings(Array.isArray(j.listings) ? j.listings : []);
      } else {
        setListings([]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [groupId, lang]);

  const t =
    lang === "es"
      ? {
          title: "Inventario del dealer",
          subtitle: "Vehículos activos de este inventario.",
          loading: "Cargando inventario…",
          empty: "No hay vehículos activos en este inventario.",
          view: "Ver vehículo",
          active: "vehículos activos",
        }
      : {
          title: "Dealer inventory",
          subtitle: "Active vehicles from this inventory.",
          loading: "Loading inventory…",
          empty: "There are no active vehicles in this inventory.",
          view: "View vehicle",
          active: "active vehicles",
        };

  const location = [city, state].filter(Boolean).join(", ");
  const activeCount = listings.length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 text-[color:var(--lx-text)]">
      <header className="rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-5 shadow-[0_8px_32px_-8px_rgba(42,36,22,0.08)] sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{dealerName ?? t.title}</h1>
        <p className="mt-2 text-sm text-[color:var(--lx-muted)]">
          {location ? `${location} · ` : ""}
          {t.subtitle}
        </p>
        {!loading && activeCount > 0 ? (
          <p className="mt-3 text-sm font-bold text-[color:var(--lx-text)]">
            {activeCount} {t.active}
          </p>
        ) : null}
      </header>
      {loading ? (
        <p className="mt-8 text-sm text-[color:var(--lx-muted)]">{t.loading}</p>
      ) : listings.length === 0 ? (
        <p className="mt-8 text-sm text-[color:var(--lx-muted)]">{t.empty}</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {sortDealerInventoryPublicListings(listings).map((car) => {
            const href = `${autosLiveVehiclePath(car.id)}?lang=${lang}`;
            const img = car.primaryImageUrl ?? "";
            const titleLine = car.vehicleTitle?.trim() || `${car.year} ${car.make} ${car.model}`;
            const parts = titleLine.split(/\s+/);
            const year = car.year ?? Number(parts[0]);
            const make = car.make || parts[1] || "";
            const model = car.model || parts.slice(2).join(" ") || "";
            return (
              <AutosDealerInventoryVehicleCard
                key={car.id}
                lang={lang}
                ctaLabel={t.view}
                car={{
                  id: car.id,
                  imageUrl: img,
                  year: Number.isFinite(year) ? year : car.year,
                  make,
                  model,
                  trim: car.trim,
                  price: car.price,
                  mileage: car.mileage,
                  city: car.city,
                  state: car.state,
                  href,
                }}
              />
            );
          })}
        </div>
      )}
    </main>
  );
}
