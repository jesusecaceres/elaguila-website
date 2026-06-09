import Link from "next/link";

import type { OfertaLocalPublicOfferDetail } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";

import { OfertasLocalesBusinessHubLiteCard } from "./OfertasLocalesBusinessHubLiteCard";
import { ofertasLocalesPublicDetailCopy } from "./ofertasLocalesPublicDetailCopy";

const BTN =
  "inline-flex rounded-lg border border-[#D4C4A8] bg-white px-3 py-2 text-sm font-medium text-[#1E1814] hover:border-[#7A1E2C]/40";
const BTN_PRIMARY =
  "inline-flex rounded-lg bg-[#7A1E2C] px-3 py-2 text-sm font-semibold text-white hover:bg-[#6a1926]";

type Props = {
  lang: OfertasLocalesAppLang;
  offer: OfertaLocalPublicOfferDetail;
};

export function OfertasLocalesPublicDetailView({ lang, offer }: Props) {
  const c = ofertasLocalesPublicDetailCopy(lang);
  const location = [offer.city, offer.state, offer.zipCode].filter(Boolean).join(", ");
  const dates =
    offer.validFrom && offer.validUntil
      ? `${offer.validFrom} – ${offer.validUntil}`
      : offer.validFrom || offer.validUntil;
  const resultsHref = `/clasificados/ofertas-locales?lang=${lang}`;
  const publishHref = `/publicar/ofertas-locales?lang=${lang}`;

  const allAssets = [...offer.flyerAssets, ...offer.couponAssets];

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link href={resultsHref} className="text-sm font-semibold text-[#7A1E2C] underline">
          ← {c.backToResults}
        </Link>

        <header className="mt-6 rounded-2xl border border-[#D4C4A8]/70 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-[#7A1E2C]">{offer.businessName}</p>
          <h1 className="mt-2 text-2xl font-bold text-[#1E1814] sm:text-3xl">{offer.title}</h1>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#1E1814]/70">
            {offer.offerType ? <span className="rounded-full bg-[#FAF6F0] px-2 py-1">{offer.offerType}</span> : null}
            {offer.businessCategory ? (
              <span className="rounded-full bg-[#FAF6F0] px-2 py-1">{offer.businessCategory}</span>
            ) : null}
            {offer.marketType ? <span className="rounded-full bg-[#FAF6F0] px-2 py-1">{offer.marketType}</span> : null}
          </div>
          {location ? <p className="mt-3 text-sm text-[#1E1814]/75">{location}</p> : null}
          {offer.address ? <p className="text-sm text-[#1E1814]/65">{offer.address}</p> : null}
          {dates ? (
            <p className="mt-2 text-sm text-[#1E1814]/65">
              {c.validDates}: {dates}
              {offer.isExpired ? (
                <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-xs font-bold text-slate-800">
                  {c.expiredLabel}
                </span>
              ) : null}
            </p>
          ) : null}
          {offer.primaryAssetHref ? (
            <a
              href={offer.primaryAssetHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`${BTN_PRIMARY} mt-4`}
            >
              {offer.primaryAssetLabel || c.openFile}
            </a>
          ) : null}
        </header>

        <div className="mt-6 space-y-6">
          {offer.description ? (
            <section className="rounded-2xl border border-[#D4C4A8]/60 bg-white p-5">
              <h2 className="text-sm font-bold uppercase tracking-wide text-[#7A7164]">{c.description}</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-[#1E1814]">{offer.description}</p>
            </section>
          ) : null}

          {offer.couponText ? (
            <section className="rounded-2xl border border-[#D4C4A8]/60 bg-white p-5">
              <h2 className="text-sm font-bold uppercase tracking-wide text-[#7A7164]">{c.couponText}</h2>
              <p className="mt-2 text-sm text-[#1E1814]">{offer.couponText}</p>
            </section>
          ) : null}

          {offer.flyerTitle ? (
            <section className="rounded-2xl border border-[#D4C4A8]/60 bg-white p-5">
              <h2 className="text-sm font-bold uppercase tracking-wide text-[#7A7164]">{c.flyerTitle}</h2>
              <p className="mt-2 text-sm text-[#1E1814]">{offer.flyerTitle}</p>
            </section>
          ) : null}

          {allAssets.length > 0 ? (
            <section className="rounded-2xl border border-[#D4C4A8]/60 bg-white p-5">
              <h2 className="text-sm font-bold uppercase tracking-wide text-[#7A7164]">{c.assetsTitle}</h2>
              <ul className="mt-3 space-y-3">
                {allAssets.map((asset) => {
                  const kindLabel = asset.kind === "flyer" ? c.viewFlyer : c.viewCoupon;
                  return (
                    <li
                      key={`${asset.kind}-${asset.id}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] px-4 py-3"
                    >
                      <span className="text-sm font-medium text-[#1E1814]">{asset.label}</span>
                      {asset.href ? (
                        <a href={asset.href} target="_blank" rel="noopener noreferrer" className={BTN_PRIMARY}>
                          {kindLabel}
                        </a>
                      ) : asset.pending ? (
                        <span className="text-xs text-[#7A7164]">{c.fileSoon}</span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          <OfertasLocalesBusinessHubLiteCard lang={lang} offer={offer} />

          {(offer.requiresMembershipForDeals || offer.membershipUrl || offer.membershipNote) && (
            <section className="rounded-2xl border border-[#D4C4A8]/60 bg-[#FFFCF7] p-5">
              <h2 className="text-sm font-bold uppercase tracking-wide text-[#7A7164]">{c.membershipTitle}</h2>
              {offer.requiresMembershipForDeals ? (
                <p className="mt-2 text-sm text-amber-900">{c.membershipRequired}</p>
              ) : null}
              {offer.membershipNote ? <p className="mt-2 text-sm text-[#1E1814]/75">{offer.membershipNote}</p> : null}
              {offer.membershipUrl ? (
                <a
                  href={offer.membershipUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${BTN_PRIMARY} mt-3`}
                >
                  {offer.membershipCtaLabel || c.signUpBeforeYouGo}
                </a>
              ) : null}
            </section>
          )}

          {(offer.digitalCouponUrl || offer.digitalCouponNote) && (
            <section className="rounded-2xl border border-[#D4C4A8]/60 bg-[#FFFCF7] p-5">
              <h2 className="text-sm font-bold uppercase tracking-wide text-[#7A7164]">{c.digitalCouponTitle}</h2>
              {offer.digitalCouponNote ? (
                <p className="mt-2 text-sm text-[#1E1814]/75">{offer.digitalCouponNote}</p>
              ) : null}
              {offer.digitalCouponUrl ? (
                <a
                  href={offer.digitalCouponUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${BTN_PRIMARY} mt-3`}
                >
                  {c.activateDigitalCoupons}
                </a>
              ) : null}
            </section>
          )}

          {offer.wantsAiSearchableSpecials ? (
            <p className="rounded-xl border border-dashed border-[#C9B46A]/60 bg-[#FBF7EF] px-4 py-3 text-xs text-[#5C5346]">
              {c.aiInterestNote}
            </p>
          ) : null}
        </div>

        <div className="mt-10 rounded-xl border border-[#7A1E2C]/20 bg-[#7A1E2C]/5 px-4 py-4">
          <Link href={publishHref} className="text-sm font-semibold text-[#7A1E2C] underline">
            {c.publishCta}
          </Link>
        </div>
      </div>
    </div>
  );
}

export function OfertasLocalesPublicDetailUnavailable({ lang }: { lang: OfertasLocalesAppLang }) {
  const c = ofertasLocalesPublicDetailCopy(lang);
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center px-4 py-16 text-center">
      <h1 className="text-xl font-bold text-[#1E1814]">{c.unavailableTitle}</h1>
      <p className="mt-3 text-sm text-[#1E1814]/70">{c.unavailableBody}</p>
      <Link
        href={`/clasificados/ofertas-locales?lang=${lang}`}
        className="mt-6 text-sm font-semibold text-[#7A1E2C] underline"
      >
        {c.backToResults}
      </Link>
    </div>
  );
}
