import { FaTicketAlt } from "react-icons/fa";
import type { ServiciosProfileResolved, ServiciosLang } from "../types/serviciosBusinessProfile";
import { getServiciosProfileLabels, getServiciosPromocionesSectionCopy } from "../copy/serviciosProfileCopy";
import { hasOfferSectionResolved } from "../lib/serviciosProfilePresence";
import { SV } from "./serviciosDesignTokens";

function OfferHeadline({ text }: { text: string }) {
  const parts = text.split(/(\$\d+)/g);
  return (
    <p className="mt-1 text-base font-bold leading-snug text-[color:var(--lx-text)] sm:text-lg">
      {parts.map((part, i) =>
        /^\$\d+$/.test(part) ? (
          <span key={i} className="text-[#C9A84A]">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </p>
  );
}

function PromoInnerCard({
  promo,
  lang,
  compact,
}: {
  promo: ServiciosProfileResolved["promotions"][number];
  lang: ServiciosLang;
  compact?: boolean;
}) {
  const L = getServiciosProfileLabels(lang);

  const actionLine =
    promo.assetImageHrefSafe || promo.assetPdfHrefSafe || promo.hrefSafe ? (
      <div className="mt-3 flex flex-wrap gap-x-2 gap-y-2 border-t border-[#3B66AD]/15 pt-3 text-xs font-semibold">
        {promo.assetImageHrefSafe ? (
          <a
            href={promo.assetImageHrefSafe}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-lg border border-[#3B66AD]/20 bg-white px-3 py-2 text-[#3B66AD] shadow-sm transition hover:border-[#3B66AD]/40 hover:shadow"
          >
            {L.promoViewImage}
          </a>
        ) : null}
        {promo.assetPdfHrefSafe ? (
          <a
            href={promo.assetPdfHrefSafe}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-lg border border-[#3B66AD]/20 bg-white px-3 py-2 text-[#3B66AD] shadow-sm transition hover:border-[#3B66AD]/40 hover:shadow"
          >
            {L.promoViewPdf}
          </a>
        ) : null}
        {promo.hrefSafe ? (
          <a
            href={promo.hrefSafe}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-lg border border-[#3B66AD]/20 bg-white px-3 py-2 text-[#3B66AD] shadow-sm transition hover:border-[#3B66AD]/40 hover:shadow"
          >
            {L.visitWebsite}
          </a>
        ) : null}
      </div>
    ) : null;

  const iconWrap = compact ? "h-10 w-10" : "h-12 w-12";
  const iconSz = compact ? "h-5 w-5" : "h-6 w-6";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-[#3B66AD]/20 shadow-md transition hover:border-[#3B66AD]/35 hover:shadow-lg ${
        compact ? "px-3 py-4 sm:px-4 sm:py-5" : "px-4 py-5 sm:px-5 sm:py-6"
      }`}
      style={{
        background: `linear-gradient(135deg, rgba(59,102,173,0.1) 0%, rgba(255,255,255,0.96) 55%, rgba(59,102,173,0.06) 100%)`,
      }}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#3B66AD]/10" aria-hidden />
      <div className="relative flex min-w-0 gap-3 sm:gap-4">
        <div className={`flex ${iconWrap} shrink-0 items-center justify-center rounded-xl bg-white shadow-sm`}>
          <FaTicketAlt className={`${iconSz} text-[#3B66AD]`} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <OfferHeadline text={promo.headline} />
          {promo.footnote ? (
            <p className="mt-2 text-xs leading-relaxed text-[color:var(--lx-muted)]">{promo.footnote}</p>
          ) : null}
        </div>
      </div>
      {actionLine}
    </div>
  );
}

export function ServiciosPromocionesCard({ profile, lang }: { profile: ServiciosProfileResolved; lang: ServiciosLang }) {
  const copy = getServiciosPromocionesSectionCopy(lang);
  if (!hasOfferSectionResolved(profile)) return null;

  const n = profile.promotions.length;
  const listClass =
    n === 1
      ? "mt-5"
      : n === 2
        ? "mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5"
        : "mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5";

  return (
    <section
      className="rounded-2xl border p-4 shadow-sm sm:p-6 md:p-8"
      style={{ backgroundColor: SV.card, borderColor: SV.border, boxShadow: SV.shadowSm }}
      aria-labelledby="servicios-promociones-heading"
    >
      <h2
        id="servicios-promociones-heading"
        className="text-lg font-bold tracking-tight text-[color:var(--lx-text)] md:text-xl"
      >
        {copy.sectionTitle}
      </h2>
      <div className={listClass}>
        {profile.promotions.map((p) => (
          <PromoInnerCard key={p.id} promo={p} lang={lang} compact={n > 1} />
        ))}
      </div>
    </section>
  );
}
