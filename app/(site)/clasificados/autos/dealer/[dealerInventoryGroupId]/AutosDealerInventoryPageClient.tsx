"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { AutosPublicListing } from "@/app/clasificados/autos/data/autosPublicSampleTypes";
import { autosLiveVehiclePath } from "@/app/clasificados/autos/filters/autosBrowseFilterContract";
import { withLangParam } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";

type Lang = "es" | "en";

function formatUsd(n: number | undefined, lang: Lang) {
  if (n == null || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(lang === "es" ? "es-US" : "en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

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
        }
      : {
          title: "Dealer inventory",
          subtitle: "Active vehicles from this inventory.",
          loading: "Loading inventory…",
          empty: "There are no active vehicles in this inventory.",
          view: "View vehicle",
        };

  const location = [city, state].filter(Boolean).join(", ");

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 text-[color:var(--lx-text)]">
      <h1 className="text-2xl font-bold tracking-tight">{dealerName ?? t.title}</h1>
      <p className="mt-1 text-sm text-[color:var(--lx-muted)]">
        {location ? `${location} · ` : ""}
        {t.subtitle}
      </p>
      {loading ? (
        <p className="mt-8 text-sm text-[color:var(--lx-muted)]">{t.loading}</p>
      ) : listings.length === 0 ? (
        <p className="mt-8 text-sm text-[color:var(--lx-muted)]">{t.empty}</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((car) => {
            const href = withLangParam(autosLiveVehiclePath(car.id), lang);
            const img = car.primaryImageUrl || "/images/placeholder-car.jpg";
            return (
              <article
                key={car.id}
                className="overflow-hidden rounded-[14px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] shadow-sm"
              >
                <div className="relative aspect-[16/10] bg-[color:var(--lx-section)]">
                  <Image src={img} alt="" fill className="object-cover" sizes="(min-width: 1024px) 33vw, 50vw" />
                </div>
                <div className="p-4">
                  <h2 className="text-sm font-bold text-[color:var(--lx-text)]">
                    {car.year} {car.make} {car.model}
                    {car.trim ? ` ${car.trim}` : ""}
                  </h2>
                  <p className="mt-2 text-lg font-bold">{formatUsd(car.price, lang)}</p>
                  <Link
                    href={href}
                    className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-[12px] border border-[color:var(--lx-nav-border)] text-sm font-semibold"
                  >
                    {t.view}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
