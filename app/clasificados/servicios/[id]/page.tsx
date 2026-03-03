"use client";

import Image from "next/image";
import { useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Navbar from "../../../components/Navbar";
import newLogo from "../../../../public/logo.png";

import { SAMPLE_LISTINGS } from "../../../data/classifieds/sampleListings";
import ContactActions from "../../components/ContactActions";

type Lang = "es" | "en";
type ServicesTier = "standard" | "plus" | "premium";

function inferTier(x: any): ServicesTier {
  const v = (typeof x?.servicesTier === "string" ? x.servicesTier : "").toLowerCase().trim();
  if (v === "premium" || v === "plus" || v === "standard") return v as ServicesTier;
  return "standard";
}

export default function ServiciosProfilePage() {
  const params = useParams<{ id: string }>();
  const sp = useSearchParams();
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";

  const listing = useMemo(() => {
    const id = params?.id || "";
    const items = SAMPLE_LISTINGS as readonly any[];
    return items.find((x) => x.id === id && x.category === "servicios") || null;
  }, [params?.id]);

  const tier = inferTier(listing);

  if (!listing) {
    return (
      <main className="min-h-screen bg-[#D9D9D9]">
        <Navbar />
        <div className="mx-auto max-w-5xl px-6 pt-28">
          <div className="rounded-2xl border border-black/10 bg-white p-6">
            <div className="text-lg font-semibold text-[#111111]">
              {lang === "es" ? "Servicio no encontrado" : "Service not found"}
            </div>
            <div className="mt-2 text-sm text-[#5A5A5A]">
              {lang === "es"
                ? "Este perfil no existe o fue removido."
                : "This profile does not exist or was removed."}
            </div>
          </div>
        </div>
      </main>
    );
  }

  const title = listing.title?.[lang] ?? listing.title?.es ?? "Servicio";
  const tags: string[] = Array.isArray(listing.servicesTags) ? listing.servicesTags : [];

  const ctaBox = (
    <div className="rounded-2xl border border-black/10 bg-white p-4">
      <div className="text-sm font-semibold text-[#111111]">
        {lang === "es" ? "Contacto rápido" : "Quick contact"}
      </div>
      <div className="mt-2">
        <ContactActions
          lang={lang}
          phone={listing.phone ?? null}
          text={listing.text ?? null}
          email={listing.email ?? null}
          website={listing.website ?? null}
          mapsUrl={listing.mapsUrl ?? null}
          className="!gap-2"
        />
      </div>
    </div>
  );

  const quoteBox =
    tier === "premium" ? (
      <div className="rounded-2xl border border-black/10 bg-white p-4">
        <div className="text-base font-semibold text-[#111111]">
          {lang === "es" ? "Cotizar & disponibilidad" : "Quote & availability"}
        </div>
        <div className="mt-1 text-xs text-[#5A5A5A]">
          {lang === "es"
            ? "Dinos qué necesitas y te conectamos con el negocio."
            : "Tell us what you need and we’ll connect you with the business."}
        </div>

        <div className="mt-3 space-y-2">
          <label className="block text-xs font-semibold text-[#111111]">
            {lang === "es" ? "¿Qué necesitas?" : "What do you need?"}
          </label>
          <select className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#111111]">
            {(tags.length ? tags : ["Servicio"]).slice(0, 6).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <label className="block text-xs font-semibold text-[#111111]">
            {lang === "es" ? "¿Cuándo lo necesitas?" : "When do you need it?"}
          </label>
          <select className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#111111]">
            <option>{lang === "es" ? "Hoy" : "Today"}</option>
            <option>{lang === "es" ? "Esta semana" : "This week"}</option>
            <option>{lang === "es" ? "Fecha específica" : "Specific date"}</option>
          </select>

          <label className="block text-xs font-semibold text-[#111111]">
            {lang === "es" ? "ZIP / Ciudad" : "ZIP / City"}
          </label>
          <input
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#111111]"
            placeholder={lang === "es" ? "Ej: 95112" : "e.g. 95112"}
          />

          <button className="mt-2 w-full rounded-xl bg-[#111111] px-4 py-3 text-sm font-semibold text-white hover:bg-black">
            {lang === "es" ? "Pedir cotización" : "Request a quote"}
          </button>

          <div className="mt-2 text-[11px] text-[#5A5A5A]">
            {lang === "es"
              ? "Premium (incluido con publicidad impresa)."
              : "Premium (included with print advertising)."}
          </div>
        </div>
      </div>
    ) : null;

  return (
    <main className="min-h-screen bg-[#D9D9D9]">
      <Navbar />

      <div className="mx-auto max-w-6xl px-6 pt-28 pb-16">
        <div className="rounded-2xl border border-black/10 bg-white p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="flex gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-2xl border border-black/10 bg-[#F5F5F5]">
                <Image src={newLogo} alt="LEONIX" className="h-full w-full object-cover" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-extrabold tracking-tight text-[#111111]">{title}</h1>
                  <span className="rounded-full border border-[#A98C2A]/50 bg-[#F2EFE8] px-3 py-1 text-[11px] font-semibold text-[#111111]">
                    {tier === "premium"
                      ? lang === "es"
                        ? "Corona de Oro"
                        : "Gold Crown"
                      : tier === "plus"
                        ? lang === "es"
                          ? "Business Plus"
                          : "Business Plus"
                        : lang === "es"
                          ? "Business Standard"
                          : "Business Standard"}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#2B2B2B]">
                  <span className="text-[#5A5A5A]">{listing.city}</span>
                  {listing.responseTime?.[lang] ? (
                    <span className="text-[#5A5A5A]">• {listing.responseTime[lang]}</span>
                  ) : null}
                </div>

                {tags.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {tags.slice(0, 6).map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-black/10 bg-[#F5F5F5] px-3 py-1 text-xs text-[#111111]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}

                <p className="mt-4 text-sm text-[#2B2B2B]">{listing.blurb?.[lang] ?? listing.blurb?.es}</p>
              </div>
            </div>

            <div className="grid gap-3 md:w-[360px]">
              {quoteBox}
              {ctaBox}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {tier !== "standard" && Array.isArray(listing.highlights) && listing.highlights.length ? (
              <section className="rounded-2xl border border-black/10 bg-white p-6">
                <div className="text-lg font-semibold text-[#111111]">
                  {lang === "es" ? "Destacados" : "Highlights"}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {listing.highlights.slice(0, 10).map((h: string) => (
                    <span
                      key={h}
                      className="rounded-full border border-[#A98C2A]/40 bg-[#F2EFE8] px-3 py-1 text-xs font-semibold text-[#111111]"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}

            {Array.isArray(listing.photos) && listing.photos.length ? (
              <section className="rounded-2xl border border-black/10 bg-white p-6">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold text-[#111111]">
                    {lang === "es" ? "Fotos" : "Photos"}
                  </div>
                  <div className="text-xs text-[#5A5A5A]">
                    {listing.photos.length} {lang === "es" ? "fotos" : "photos"}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {listing.photos.slice(0, tier === "standard" ? 1 : tier === "plus" ? 6 : 9).map((src: string, i: number) => (
                    <div key={src + i} className="aspect-[4/3] overflow-hidden rounded-xl border border-black/10 bg-[#F5F5F5]">
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {Array.isArray(listing.servicesOffered) && listing.servicesOffered.length ? (
              <section className="rounded-2xl border border-black/10 bg-white p-6">
                <div className="text-lg font-semibold text-[#111111]">
                  {lang === "es" ? "Servicios ofrecidos" : "Services offered"}
                </div>

                <div className="mt-4 space-y-3">
                  {listing.servicesOffered.slice(0, tier === "plus" ? 2 : 6).map((g: any) => (
                    <div key={g.group} className="rounded-xl border border-black/10 bg-[#F5F5F5] p-4">
                      <div className="text-sm font-semibold text-[#111111]">{g.group}</div>
                      <div className="mt-2 grid gap-1 sm:grid-cols-2">
                        {(g.items || []).slice(0, tier === "plus" ? 6 : 20).map((it: string) => (
                          <div key={it} className="text-sm text-[#2B2B2B]">• {it}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="rounded-2xl border border-black/10 bg-white p-6">
              <div className="text-lg font-semibold text-[#111111]">
                {lang === "es" ? "Sobre el negocio" : "About the business"}
              </div>
              <p className="mt-3 text-sm text-[#2B2B2B]">
                {listing.about?.[lang] ??
                  (lang === "es"
                    ? "Información y descripción del negocio. (Demo: aquí irá el texto del dueño.)"
                    : "Business info and description. (Demo: owner text goes here.)")}
              </p>
            </section>

            {tier === "premium" && Array.isArray(listing.faq) && listing.faq.length ? (
              <section className="rounded-2xl border border-black/10 bg-white p-6">
                <div className="text-lg font-semibold text-[#111111]">
                  {lang === "es" ? "Preguntas frecuentes" : "FAQ"}
                </div>
                <div className="mt-4 space-y-4">
                  {listing.faq.slice(0, 6).map((qa: any, idx: number) => (
                    <div key={idx} className="rounded-xl border border-black/10 bg-[#F5F5F5] p-4">
                      <div className="text-sm font-semibold text-[#111111]">Q: {qa.q?.[lang] ?? qa.q?.es}</div>
                      <div className="mt-2 text-sm text-[#2B2B2B]">A: {qa.a?.[lang] ?? qa.a?.es}</div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="space-y-6">
            {listing.hours ? (
              <section className="rounded-2xl border border-black/10 bg-white p-6">
                <div className="text-lg font-semibold text-[#111111]">{lang === "es" ? "Horario" : "Hours"}</div>
                <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  {[
                    ["Mon", "mon"], ["Tue", "tue"], ["Wed", "wed"], ["Thu", "thu"],
                    ["Fri", "fri"], ["Sat", "sat"], ["Sun", "sun"],
                  ].map(([label, key]) => (
                    <div key={key} className="flex items-center justify-between gap-3">
                      <span className="text-[#5A5A5A]">{label}</span>
                      <span className="font-medium text-[#111111]">{listing.hours[key]}</span>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {tier === "premium" && Array.isArray(listing.amenities) && listing.amenities.length ? (
              <section className="rounded-2xl border border-black/10 bg-white p-6">
                <div className="text-lg font-semibold text-[#111111]">{lang === "es" ? "Atributos" : "Amenities"}</div>
                <div className="mt-4 space-y-2 text-sm text-[#2B2B2B]">
                  {listing.amenities.slice(0, 10).map((a: string) => <div key={a}>✓ {a}</div>)}
                </div>
              </section>
            ) : null}
          </aside>
        </div>
      </div>
    </main>
  );
}
