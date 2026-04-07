"use client";

import type { RentasPlanTier } from "../../shared/utils/rentasPlanTier";
import type { RentasAnuncioFactPair, RentasAnuncioLang, RentasAnuncioListingLike } from "../types/rentasAnuncioLiveTypes";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** Rental facts block — must render before the description blurb (parity with legacy layout). */
export function RentasAnuncioRentalFactsSection(props: {
  lang: RentasAnuncioLang;
  rentasPlanTier: RentasPlanTier | null;
  rentasRentalFacts: RentasAnuncioFactPair[];
}) {
  const { lang, rentasPlanTier, rentasRentalFacts } = props;
  if (rentasRentalFacts.length === 0) return null;
  return (
    <div
      className={cx(
        "mt-6 rounded-2xl p-6",
        rentasPlanTier === "privado_pro"
          ? "border border-stone-200/80 bg-[#FAFAF9]"
          : "border border-[#C9B46A]/55 bg-[#F5F5F5] backdrop-blur ring-1 ring-[#C9B46A]/25 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)]"
      )}
    >
      <h3 className="text-sm font-semibold text-[#111111]">{lang === "es" ? "Datos del rental" : "Rental details"}</h3>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {rentasRentalFacts.map((f) => (
          <div key={f.label} className="rounded-xl border border-black/10 bg-white/60 px-4 py-3">
            <div className="text-[10px] uppercase tracking-wide text-[#111111]/60">{f.label}</div>
            <div className="mt-0.5 text-sm font-semibold text-[#111111]">{f.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Amenities, “Quién publica”, and safety — after description / BR mobile block. */
export function RentasAnuncioPostDescriptionSections(props: {
  lang: RentasAnuncioLang;
  listing: RentasAnuncioListingLike;
  rentasPlanTier: RentasPlanTier | null;
  rentasAmenities: RentasAnuncioFactPair[];
}) {
  const { lang, listing, rentasPlanTier, rentasAmenities } = props;
  const isBusiness = listing.sellerType === "business" || listing.seller_type === "business";
  const businessDisplayName = listing.businessName ?? listing.business_name;

  return (
    <>
      {rentasAmenities.length > 0 && (
        <div
          className={cx(
            "mt-6 rounded-2xl p-6",
            rentasPlanTier === "privado_pro"
              ? "border border-stone-200/80 bg-[#FAFAF9]"
              : "border border-[#C9B46A]/55 bg-[#F5F5F5] backdrop-blur ring-1 ring-[#C9B46A]/25 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)]"
          )}
        >
          <h3 className="text-sm font-semibold text-[#111111]">
            {lang === "es" ? "Características y comodidades" : "Features & amenities"}
          </h3>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rentasAmenities.map((f) => (
              <div key={f.label} className="rounded-xl border border-black/10 bg-white/60 px-4 py-3">
                <div className="text-[10px] uppercase tracking-wide text-[#111111]/60">{f.label}</div>
                <div className="mt-0.5 text-sm font-semibold text-[#111111]">{f.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        className={cx(
          "mt-6 rounded-2xl border p-4 sm:p-5",
          rentasPlanTier === "business_plus" &&
            "border-yellow-300/50 bg-[#F5F5F5] ring-1 ring-yellow-300/20 shadow-[0_0_0_1px_rgba(250,204,21,0.15)]",
          rentasPlanTier === "business_standard" && "border-yellow-400/35 bg-[#F5F5F5]",
          rentasPlanTier === "privado_pro" && "border-stone-200/80 bg-[#FAFAF9]",
          !rentasPlanTier && "border-black/10 bg-[#F5F5F5]"
        )}
        data-section="rentas-trust"
      >
        <h3 className="text-xs font-semibold text-[#111111]/80 uppercase tracking-wide mb-3">
          {lang === "es" ? "Quién publica" : "Posted by"}
        </h3>
        {(rentasPlanTier === "business_plus" || rentasPlanTier === "business_standard") && isBusiness && (
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-yellow-400/50 bg-[#F5F5F5] px-2.5 py-1 text-[11px] font-semibold text-[#111111]/90">
              {lang === "es" ? "Negocio" : "Business"}
            </span>
          </div>
        )}
        {listing.sellerType === "business" ? (
          <>
            <p className="text-sm font-semibold text-[#111111]">
              {lang === "es" ? "Negocio" : "Business"}
              {businessDisplayName ? ` — ${businessDisplayName}` : ""}
            </p>
            <p className="mt-1.5 text-xs text-[#111111]/80">
              {lang === "es" ? "Anuncio profesional con identidad de negocio." : "Professional listing with business identity."}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-[#111111]">{lang === "es" ? "Anunciante privado" : "Private advertiser"}</p>
            <p className="mt-1 text-xs text-[#111111]/80">
              {lang === "es" ? "Arrendador o dueño (persona)." : "Landlord or owner (individual)."}
            </p>
            <p className="mt-2 text-[11px] text-[#111111]/60">{lang === "es" ? "Respuesta: —" : "Response: —"}</p>
          </>
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-[#C9B46A]/30 bg-[#F8F6F0] p-4 sm:p-5" data-section="rentas-safety">
        <h3 className="text-xs font-semibold text-[#111111]/80 uppercase tracking-wide mb-2">
          {lang === "es" ? "Para tu seguridad" : "For your safety"}
        </h3>
        <ul className="space-y-2 text-sm text-[#111111]/90">
          <li className="flex gap-2">
            <span className="shrink-0 text-[#111111]/60" aria-hidden>
              •
            </span>
            <span>
              {lang === "es"
                ? "No envíes depósitos sin verificar el inmueble o al anunciante."
                : "Do not send deposits without verifying the property or the advertiser."}
            </span>
          </li>
          <li className="flex gap-2">
            <span className="shrink-0 text-[#111111]/60" aria-hidden>
              •
            </span>
            <span>
              {lang === "es"
                ? "Confirma detalles (renta, depósito, contrato) antes de pagar."
                : "Confirm details (rent, deposit, contract) before paying."}
            </span>
          </li>
          <li className="flex gap-2">
            <span className="shrink-0 text-[#111111]/60" aria-hidden>
              •
            </span>
            <span>{lang === "es" ? "Usa los datos de contacto del anuncio." : "Use the contact information shown in the listing."}</span>
          </li>
          <li className="flex gap-2">
            <span className="shrink-0 text-[#111111]/60" aria-hidden>
              •
            </span>
            <span>
              {lang === "es"
                ? "Desconfía de ofertas que parezcan demasiado buenas para ser verdad."
                : "Be cautious of offers that seem too good to be true."}
            </span>
          </li>
        </ul>
      </div>
    </>
  );
}
