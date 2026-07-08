import { FaCheck, FaClock, FaHeart, FaShieldAlt, FaStar } from "react-icons/fa";
import type { ServiciosProfileResolved, ServiciosLang } from "../types/serviciosBusinessProfile";
import type { ServiciosListingTemplate } from "@/app/(site)/clasificados/servicios/lib/serviciosTemplateRouting";
import { LX_SECTION_CARD, LX_SECTION_HEADING, getTrustSectionHeading, getTrustSectionKicker } from "./serviciosLeonixBrand";

function TrustIcon({ icon }: { icon: string }) {
  const c = "h-5 w-5 text-[#7A1E2C]";
  switch (icon) {
    case "shieldCheck":
      return (
        <span className="relative inline-flex" aria-hidden>
          <FaShieldAlt className={c} />
          <FaCheck className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-white text-[#2D5A3D]" />
        </span>
      );
    case "shield":
      return <FaShieldAlt className={c} aria-hidden />;
    case "star":
      return <FaStar className={c} aria-hidden />;
    case "clock":
      return <FaClock className={c} aria-hidden />;
    case "heart":
      return <FaHeart className={c} aria-hidden />;
    case "check":
      return <FaCheck className={c} aria-hidden />;
    default:
      return <FaShieldAlt className={c} aria-hidden />;
  }
}

export function ServiciosTrustSection({
  profile,
  lang,
  template,
  embedded = false,
}: {
  profile: ServiciosProfileResolved;
  lang: ServiciosLang;
  template?: ServiciosListingTemplate;
  embedded?: boolean;
}) {
  const items = profile.trust.slice(0, 6);
  if (!items.length) return null;

  const heading = template ? getTrustSectionHeading(template, lang) : lang === "en" ? "Why choose us" : "¿Por qué elegirnos?";
  const kicker = template ? getTrustSectionKicker(template, lang) : lang === "en" ? "Trust & credentials" : "Confianza y credenciales";

  const content = (
    <>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6F6254]">{kicker}</p>
      <h2 className={`mt-1 ${embedded ? "text-base font-bold tracking-tight text-[#1E1814] md:text-lg" : LX_SECTION_HEADING}`}>
        {heading}
      </h2>
      <div className="mt-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-1 md:mt-5 md:grid md:grid-cols-2 md:gap-3 md:overflow-visible md:pb-0 md:snap-none lg:grid-cols-3">
        {items.map((t) => (
          <div
            key={t.id}
            className="flex min-w-[min(16rem,82vw)] max-w-[min(22rem,92vw)] shrink-0 snap-start items-center gap-2.5 rounded-lg border border-[#E8D9C4] bg-[#F5F0E8] px-3 py-3 shadow-sm sm:min-w-0 sm:max-w-none sm:gap-3 md:min-w-0"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#D4C4A8]/70 bg-[#FFFCF7] shadow-sm">
              <TrustIcon icon={t.icon} />
            </div>
            <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-[#1E1814]">{t.label}</p>
          </div>
        ))}
      </div>
    </>
  );

  if (embedded) return <div data-servicios-trust-embedded="1">{content}</div>;

  return (
    <section className={`${LX_SECTION_CARD} px-3 py-4 sm:px-6 sm:py-6`}>
      {content}
    </section>
  );
}
