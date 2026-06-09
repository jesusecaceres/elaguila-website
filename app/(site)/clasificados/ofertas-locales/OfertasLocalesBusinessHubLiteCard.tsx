import type { OfertaLocalPublicOfferDetail } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";

import { ofertasLocalesPublicDetailCopy } from "./ofertasLocalesPublicDetailCopy";

const BTN =
  "inline-flex items-center justify-center rounded-lg border border-[#D4C4A8] bg-white px-3 py-2 text-sm font-semibold text-[#1E1814] hover:border-[#7A1E2C]/40";
const BTN_PRIMARY =
  "inline-flex items-center justify-center rounded-lg bg-[#7A1E2C] px-3 py-2 text-sm font-semibold text-white hover:bg-[#6a1926]";

type Props = {
  lang: OfertasLocalesAppLang;
  offer: OfertaLocalPublicOfferDetail;
};

function SocialBtn({ href, label }: { href?: string; label: string }) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={BTN}>
      {label}
    </a>
  );
}

export function OfertasLocalesBusinessHubLiteCard({ lang, offer }: Props) {
  const c = ofertasLocalesPublicDetailCopy(lang);
  const social = offer.socialLinks ?? {};

  const hasContact = Boolean(
    offer.phoneHref || offer.whatsappHref || offer.websiteHref || offer.directionsHref
  );
  const hasSocial = Boolean(
    social.facebookUrl ||
      social.instagramUrl ||
      social.tiktokUrl ||
      social.youtubeUrl ||
      social.googleBusinessUrl ||
      social.googleReviewUrl ||
      social.yelpUrl
  );

  if (!hasContact && !hasSocial) return null;

  return (
    <section className="rounded-2xl border border-[#D4C4A8]/70 bg-white p-5 shadow-sm">
      <h2 className="text-base font-bold text-[#1E1814]">{c.businessHubTitle}</h2>
      {hasContact ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {offer.phoneHref ? (
            <a href={offer.phoneHref} className={BTN_PRIMARY}>
              {c.call}
            </a>
          ) : null}
          {offer.whatsappHref ? (
            <a href={offer.whatsappHref} target="_blank" rel="noopener noreferrer" className={BTN_PRIMARY}>
              {c.whatsapp}
            </a>
          ) : null}
          {offer.websiteHref ? (
            <a href={offer.websiteHref} target="_blank" rel="noopener noreferrer" className={BTN}>
              {c.website}
            </a>
          ) : null}
          {offer.directionsHref ? (
            <a href={offer.directionsHref} target="_blank" rel="noopener noreferrer" className={BTN}>
              {c.directions}
            </a>
          ) : null}
        </div>
      ) : null}
      {hasSocial ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <SocialBtn href={social.facebookUrl} label={c.facebook} />
          <SocialBtn href={social.instagramUrl} label={c.instagram} />
          <SocialBtn href={social.tiktokUrl} label={c.tiktok} />
          <SocialBtn href={social.youtubeUrl} label={c.youtube} />
          <SocialBtn href={social.googleBusinessUrl} label={c.googleBusiness} />
          <SocialBtn href={social.googleReviewUrl} label={c.googleReviews} />
          <SocialBtn href={social.yelpUrl} label={c.yelp} />
        </div>
      ) : null}
    </section>
  );
}
