import { FaCheck, FaClock, FaHeart, FaShieldAlt, FaStar } from "react-icons/fa";
import type { ServiciosBusinessProfile, ServiciosLang } from "../types/serviciosBusinessProfile";
import { getServiciosProfileLabels } from "../copy/serviciosProfileCopy";
import { SV } from "./serviciosDesignTokens";

function TrustIcon({ icon }: { icon: string }) {
  const c = "h-6 w-6 text-[#3B66AD]";
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

export function ServiciosTrust({ profile, lang }: { profile: ServiciosBusinessProfile; lang: ServiciosLang }) {
  const L = getServiciosProfileLabels(lang);
  const items = profile.trustItems;
  if (!items?.length) return null;

  return (
    <section
      className="rounded-2xl border p-6 shadow-sm md:p-8"
      style={{ backgroundColor: SV.card, borderColor: SV.border, boxShadow: SV.shadowSm }}
    >
      <h2 className="text-lg font-bold tracking-tight text-[color:var(--lx-text)] md:text-xl">{L.trust}</h2>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-4 rounded-xl border border-black/[0.06] bg-[#3B66AD]/[0.04] px-4 py-4"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
              <TrustIcon icon={t.icon} />
            </div>
            <p className="text-sm font-semibold leading-snug text-[color:var(--lx-text)]">{t.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
