"use client";

import Link from "next/link";
import type { ComidaLocalDashboardListingVm } from "./mapComidaLocalDashboardListing";

type Lang = "es" | "en";

type Props = {
  lang: Lang;
  items: ComidaLocalDashboardListingVm[];
  showEmpty?: boolean;
};

export function ComidaLocalDashboardListings({ lang, items, showEmpty = false }: Props) {
  const q = `lang=${lang}`;

  if (items.length === 0 && showEmpty) {
    return (
      <section className="mt-8 rounded-2xl border border-[#D4C4A8]/80 bg-[#FFFCF7] p-6 shadow-sm">
        <h2 className="text-xl font-bold text-[#1E1814]">Comida Local</h2>
        <p className="mt-2 text-sm text-[#1E1814]/70">
          {lang === "es"
            ? "Todavía no tienes publicaciones de Comida Local."
            : "You do not have any Comida Local listings yet."}
        </p>
        <p className="mt-1 text-xs text-[#1E1814]/55">
          {lang === "es"
            ? "Tus puestos, pop-ups o vendedores locales publicados."
            : "Your published food stands, pop-ups, and local vendors."}
        </p>
        <Link
          href={`/publicar/comida-local?${q}`}
          className="mt-4 inline-flex rounded-xl border border-[#7A1E2C] bg-[#7A1E2C] px-4 py-2 text-sm font-semibold text-[#FFFCF7] hover:bg-[#6a1a26]"
        >
          {lang === "es" ? "Publicar Comida Local" : "Publish Comida Local"}
        </Link>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-[#1E1814]">Comida Local ({items.length})</h2>
        <p className="mt-1 text-sm text-[#1E1814]/70">
          {lang === "es"
            ? "Tus puestos, pop-ups o vendedores locales publicados."
            : "Your published food stands, pop-ups, and local vendors."}
        </p>
      </div>

      <div className="grid gap-4">
        {items.map((item) => (
          <article
            key={item.id}
            className="flex flex-col gap-4 overflow-hidden rounded-2xl border border-[#D4C4A8]/85 bg-[#FFFCF7] p-4 shadow-sm sm:flex-row"
          >
            <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl border border-[#D4C4A8]/70 bg-[#FDF8F0] sm:h-24 sm:w-32">
              {item.mainPhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.mainPhotoUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-[#1E1814]/40">
                  {lang === "es" ? "Sin foto" : "No photo"}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-[#7A1E2C]/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#7A1E2C]">
                  {item.categoryLabel}
                </span>
                <span className="rounded-md border border-[#D4C4A8] px-2 py-0.5 text-[11px] font-semibold text-[#1E1814]/75">
                  {item.statusLabel}
                </span>
                <span className="rounded-md border border-[#D4C4A8]/80 px-2 py-0.5 text-[11px] text-[#1E1814]/65">
                  {item.packageLabel}
                </span>
              </div>

              <h3 className="mt-2 text-lg font-bold text-[#1E1814]">{item.title}</h3>
              <p className="mt-0.5 text-sm text-[#1E1814]/65">
                {[item.foodTypeLabel, item.cityLabel].filter(Boolean).join(" · ")}
              </p>

              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                {item.leonixAdId ? (
                  <div className="rounded-lg border border-[#D4C4A8]/60 bg-[#FDF8F0] px-3 py-2">
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-[#1E1814]/50">
                      {lang === "es" ? "ID Leonix" : "Leonix ID"}
                    </dt>
                    <dd className="mt-0.5 font-mono text-xs font-semibold text-[#1E1814]">
                      {item.leonixAdId}
                    </dd>
                  </div>
                ) : null}
                <div className="rounded-lg border border-[#D4C4A8]/60 bg-[#FDF8F0] px-3 py-2">
                  <dt className="text-[10px] font-bold uppercase tracking-wide text-[#1E1814]/50">
                    {lang === "es" ? "Publicado" : "Published"}
                  </dt>
                  <dd className="mt-0.5 font-semibold text-[#1E1814]">{item.publishedAtLabel}</dd>
                </div>
                <div className="rounded-lg border border-[#D4C4A8]/60 bg-[#FDF8F0] px-3 py-2">
                  <dt className="text-[10px] font-bold uppercase tracking-wide text-[#1E1814]/50">
                    {lang === "es" ? "Pago" : "Payment"}
                  </dt>
                  <dd className="mt-0.5 text-xs font-semibold text-[#1E1814]">
                    {item.paymentStatusLabel}
                  </dd>
                </div>
                {item.primaryContactLabel ? (
                  <div className="rounded-lg border border-[#D4C4A8]/60 bg-[#FDF8F0] px-3 py-2">
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-[#1E1814]/50">
                      {lang === "es" ? "Contacto" : "Contact"}
                    </dt>
                    <dd className="mt-0.5 text-xs font-semibold text-[#1E1814]">
                      {item.primaryContactLabel}
                    </dd>
                  </div>
                ) : null}
              </dl>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`${item.publicPath}?${q}`}
                  className="inline-flex rounded-xl border border-[#7A1E2C] bg-[#7A1E2C] px-4 py-2 text-sm font-semibold text-[#FFFCF7] hover:bg-[#6a1a26]"
                >
                  {lang === "es" ? "Ver ficha" : "View listing"}
                </Link>
                <Link
                  href={`/publicar/comida-local?${q}`}
                  className="inline-flex rounded-xl border border-[#D4C4A8] bg-white px-4 py-2 text-sm font-medium text-[#1E1814] hover:border-[#7A1E2C]/35"
                >
                  {lang === "es" ? "Formulario" : "Form"}
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
