import { FaTicketAlt } from "react-icons/fa";
import type { ServiciosProfileResolved, ServiciosLang } from "../types/serviciosBusinessProfile";
import { getServiciosProfileLabels } from "../copy/serviciosProfileCopy";
import { hasOfferSectionResolved } from "../lib/serviciosProfilePresence";

function OfferHeadline({ text }: { text: string }) {
  const parts = text.split(/(\$\d+)/g);
  return (
    <p className="mt-2 text-lg font-bold leading-snug text-[color:var(--lx-text)]">
      {parts.map((part, i) =>
        /^\$\d+$/.test(part) ? (
          <span key={i} className="text-[#C9A84A]">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
}

export function ServiciosOfferCard({ profile, lang }: { profile: ServiciosProfileResolved; lang: ServiciosLang }) {
  const L = getServiciosProfileLabels(lang);
  if (!hasOfferSectionResolved(profile)) return null;
  const promo = profile.promo!;

  const actionLine = (
    <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2 border-t border-[#3B66AD]/15 pt-3 text-xs font-semibold">
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
  );

  const mainBlock = (
    <>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
        <FaTicketAlt className="h-6 w-6 text-[#3B66AD]" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#3B66AD]/90">{L.offerTitle}</p>
        <OfferHeadline text={promo.headline} />
        {promo.footnote ? <p className="mt-3 text-xs text-[color:var(--lx-muted)]">{promo.footnote}</p> : null}
      </div>
    </>
  );

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-[#3B66AD]/20 px-4 py-5 shadow-md transition hover:border-[#3B66AD]/35 hover:shadow-lg sm:px-5 sm:py-6"
      style={{
        background: `linear-gradient(135deg, rgba(59,102,173,0.12) 0%, rgba(255,255,255,0.95) 55%, rgba(59,102,173,0.08) 100%)`,
      }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#3B66AD]/10"
        aria-hidden
      />
      <div className="relative flex min-w-0 gap-3 sm:gap-4">
        {mainBlock}
      </div>
      {actionLine}
    </div>
  );
}
