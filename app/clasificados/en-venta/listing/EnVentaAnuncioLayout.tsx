"use client";

import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import ContactActions from "../../components/ContactActions";
import { formatPostedAgo } from "./enVentaAnuncioFormatters";
import { EnVentaMediaGallery } from "./EnVentaMediaGallery";
import { EnVentaSellerCard } from "./EnVentaSellerCard";
import { EnVentaItemSpecs } from "./EnVentaItemSpecs";
import { EnVentaRelatedRail } from "./EnVentaRelatedRail";
import { enVentaClassifiedAdJsonLd } from "../seo/enVentaJsonLd";
import { trackEnVentaListingView } from "../analytics/enVentaAnalytics";
import { useEffect, useMemo } from "react";

type Lang = "es" | "en";

type AnuncioListingLike = {
  id: string;
  title: { es: string; en: string };
  priceLabel: { es: string; en: string };
  city: string;
  blurb: { es: string; en: string };
  images?: string[] | null;
  sellerType?: "personal" | "business";
  businessName?: string | null;
  business_name?: string | null;
  detailPairs?: Array<{ label: string; value: string }> | null;
  created_at?: string | null;
  status?: string;
  contact_phone?: string | null;
  contact_email?: string | null;
};

function pairsFromListing(l: AnuncioListingLike): Array<{ label: string; value: string }> {
  const dp = l.detailPairs;
  if (!Array.isArray(dp)) return [];
  return dp
    .map((p) => {
      if (!p || typeof p !== "object") return null;
      const o = p as { label?: string; value?: string };
      if (!o.label || !o.value) return null;
      return { label: String(o.label), value: String(o.value) };
    })
    .filter((x): x is { label: string; value: string } => x != null);
}

function conditionFromPairs(rows: Array<{ label: string; value: string }>, lang: Lang): string | null {
  for (const r of rows) {
    const lb = r.label.toLowerCase();
    if (lb.includes("condición") || lb.includes("condicion") || (lb.includes("condition") && !lb.includes("air"))) {
      const k = r.value.trim().toLowerCase();
      const map: Record<string, { es: string; en: string }> = {
        new: { es: "Nuevo", en: "New" },
        "like-new": { es: "Como nuevo", en: "Like new" },
        good: { es: "Bueno", en: "Good" },
        fair: { es: "Regular", en: "Fair" },
      };
      const hit = map[k];
      return hit ? hit[lang] : r.value;
    }
  }
  return null;
}

export function EnVentaAnuncioLayout({
  listing,
  lang,
  backHref,
}: {
  listing: AnuncioListingLike;
  lang: Lang;
  backHref: string;
}) {
  const images = listing.images ?? [];
  const rows = useMemo(() => pairsFromListing(listing), [listing]);
  const condition = conditionFromPairs(rows, lang);
  const sellerKind = listing.sellerType === "business" ? "business" : "personal";
  const biz = listing.businessName || listing.business_name || null;

  const fulfillmentLine = useMemo(() => {
    for (const r of rows) {
      if (/entrega|fulfillment/i.test(r.label)) return r.value;
    }
    return "";
  }, [rows]);

  useEffect(() => {
    trackEnVentaListingView(listing.id);
  }, [listing.id]);

  const jsonLd = enVentaClassifiedAdJsonLd({
    title: listing.title[lang],
    description: listing.blurb[lang],
    url: `/clasificados/anuncio/${listing.id}`,
    priceLabel: listing.priceLabel[lang],
    city: listing.city,
  });

  const posted = formatPostedAgo(listing.created_at ?? null, lang);

  return (
    <div className="min-h-screen bg-[#D9D9D9] pb-24 text-[#111111]">
      <Navbar />
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="mx-auto max-w-6xl px-4 pt-28">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={backHref}
            className="rounded-full border border-black/10 bg-[#F5F5F5] px-4 py-2 text-sm font-semibold hover:bg-[#EFEFEF]"
          >
            ← {lang === "es" ? "Volver" : "Back"}
          </Link>
          <Link
            href={`/clasificados/en-venta/results?lang=${lang}`}
            className="text-sm font-semibold text-[#111111]/70 underline"
          >
            {lang === "es" ? "Más en En Venta" : "More in For Sale"}
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <EnVentaMediaGallery urls={images} title={listing.title[lang]} />
          </div>
          <div className="space-y-4 lg:col-span-5">
            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <div className="text-3xl font-extrabold tracking-tight text-[#111111]">{listing.priceLabel[lang]}</div>
              {condition ? (
                <span className="mt-2 inline-flex rounded-full border border-[#C9B46A]/50 bg-[#FAF7EF] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#111111]">
                  {condition}
                </span>
              ) : null}
              <h1 className="mt-3 text-2xl font-bold leading-tight text-[#111111]">{listing.title[lang]}</h1>
              <div className="mt-2 text-sm text-[#111111]/75">
                {listing.city}
                {posted ? (
                  <>
                    <span className="text-[#111111]/40"> · </span>
                    {posted}
                  </>
                ) : null}
              </div>
              {fulfillmentLine ? (
                <p className="mt-3 text-sm font-medium text-[#111111]/85">
                  {lang === "es" ? "Entrega: " : "Fulfillment: "}
                  {fulfillmentLine}
                </p>
              ) : null}
            </div>

            <EnVentaSellerCard lang={lang} sellerKind={sellerKind} businessName={biz} />

            <div className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-4">
              <div className="text-sm font-bold text-[#111111]">{lang === "es" ? "Contacto" : "Contact"}</div>
              <div className="mt-3">
                {listing.contact_phone || listing.contact_email ? (
                  <ContactActions
                    lang={lang}
                    phone={listing.contact_phone ? String(listing.contact_phone) : null}
                    text={listing.contact_phone ? String(listing.contact_phone) : null}
                    email={listing.contact_email ? String(listing.contact_email) : null}
                  />
                ) : (
                  <p className="text-sm text-[#111111]/65">
                    {lang === "es" ? "El vendedor no mostró contacto público." : "The seller did not expose public contact."}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <section className="rounded-2xl border border-black/10 bg-white p-5">
              <h2 className="text-sm font-bold text-[#111111]">{lang === "es" ? "Descripción" : "Description"}</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#111111]/85">{listing.blurb[lang]}</p>
            </section>
            <EnVentaItemSpecs lang={lang} rows={rows} />
          </div>
          <div className="lg:col-span-4">
            <EnVentaRelatedRail lang={lang} q={listing.title[lang].split(/\s+/).slice(0, 4).join(" ")} />
          </div>
        </div>
      </section>
    </div>
  );
}
