import { FaCheck, FaClock, FaHeart, FaShieldAlt, FaStar } from "react-icons/fa";
import type { ServiciosProfileResolved, ServiciosLang } from "../types/serviciosBusinessProfile";
import { getServiciosProfileLabels } from "../copy/serviciosProfileCopy";
import { SV } from "./serviciosDesignTokens";

function TrustIcon({ icon }: { icon: string }) {
  const c = "h-5 w-5 text-[#3B66AD]";
  switch (icon) {
    case "shieldCheck":
      return (
        <span className="relative inline-flex" aria-hidden>
          <FaShieldAlt className={c} />
          <FaCheck className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-white text-emerald-600" />
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

export function ServiciosTrustSection({ profile, lang }: { profile: ServiciosProfileResolved; lang: ServiciosLang }) {
  const L = getServiciosProfileLabels(lang);
  const items = profile.trust;
  if (!items.length) return null;

  return (
    <section
      className="rounded-2xl border px-4 py-5 shadow-sm sm:px-6 sm:py-7 md:px-8"
      style={{ backgroundColor: SV.card, borderColor: SV.border, boxShadow: SV.shadowSm }}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#3B66AD]/90">
        {lang === "en" ? "Why work with us" : "Por qué con nosotros"}
      </p>
      <h2 className="mt-1 text-lg font-bold tracking-tight text-[color:var(--lx-text)] md:text-xl">{L.trust}</h2>
      <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
        {items.map((t) => (
          <div
            key={t.id}
            className="flex min-w-0 items-center gap-3 rounded-xl border border-black/[0.06] bg-white/95 px-3 py-3 shadow-sm sm:gap-3.5 sm:px-3.5 sm:py-3.5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#3B66AD]/[0.08] shadow-inner">
              <TrustIcon icon={t.icon} />
            </div>
            <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-[color:var(--lx-text)]">{t.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
