"use client";

import Link from "next/link";
import Navbar from "@/app/components/Navbar";

type Lang = "es" | "en";

type ListingIn = {
  id: string;
  title: { es: string; en: string };
  priceLabel: { es: string; en: string };
  city: string;
  blurb: { es: string; en: string };
  images: string[] | null | undefined;
  sellerType: string;
  businessName?: string | null;
  business_name?: string | null;
  detailPairs: Array<{ label: string; value: string }> | null;
  created_at?: string | null;
  status?: string;
  contact_phone?: string | null;
  contact_email?: string | null;
};

export function EnVentaAnuncioLayout({
  listing,
  lang,
  backHref,
}: {
  listing: ListingIn;
  lang: Lang;
  backHref: string;
}) {
  const title = listing.title[lang] ?? "";
  const price = listing.priceLabel[lang] ?? "";
  const blurb = listing.blurb[lang] ?? "";
  const imgs = listing.images?.filter(Boolean) ?? [];

  return (
    <div className="min-h-screen bg-[#D9D9D9] text-[#111111]">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 pb-24 pt-28">
        <Link href={backHref} className="text-sm font-semibold text-[#111111] underline hover:opacity-90">
          {lang === "es" ? "← Volver" : "← Back"}
        </Link>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-[#111111]">{title}</h1>
        <p className="mt-3 text-2xl font-bold text-emerald-600">{price}</p>
        <p className="mt-2 text-sm text-[#111111]/60">{listing.city}</p>

        {imgs.length > 0 ? (
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {imgs.slice(0, 6).map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={src} alt="" className="h-48 w-full rounded-xl border border-black/10 object-cover" />
            ))}
          </div>
        ) : null}

        <div className="mt-8 rounded-2xl border border-black/10 bg-[#F5F5F5] p-6">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#111111]/90">{blurb}</p>
        </div>

        {listing.detailPairs && listing.detailPairs.length > 0 ? (
          <dl className="mt-8 space-y-2 rounded-xl border border-black/10 bg-white p-4">
            {listing.detailPairs.map((row, idx) => (
              <div key={idx} className="grid grid-cols-2 gap-2 text-sm">
                <dt className="font-semibold text-[#111111]/65">{row.label}</dt>
                <dd className="text-[#111111]">{row.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </main>
    </div>
  );
}
