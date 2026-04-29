import { FaCertificate, FaAward, FaShieldAlt } from "react-icons/fa";
import type { ServiciosProfileResolved, ServiciosLang } from "../types/serviciosBusinessProfile";
import { getServiciosProfileLabels } from "../copy/serviciosProfileCopy";
import { SV } from "./serviciosDesignTokens";

export function ServiciosLicense({ profile, lang }: { profile: ServiciosProfileResolved; lang: ServiciosLang }) {
  const L = getServiciosProfileLabels(lang);
  const badges = profile.hero.badges || [];
  const licenseBadges = badges.filter(b => b.kind === "licensed" || b.kind === "verified");
  
  if (licenseBadges.length === 0) return null;

  return (
    <section
      className="rounded-2xl border p-4 shadow-sm sm:p-6 md:p-8"
      style={{ backgroundColor: SV.card, borderColor: SV.border, boxShadow: SV.shadowSm }}
    >
      <div className="flex items-center gap-2">
        <FaCertificate className="h-5 w-5 text-[#3B66AD]" aria-hidden />
        <h2 className="text-lg font-bold tracking-tight text-[color:var(--lx-text)] md:text-xl">
          {lang === "en" ? "Licenses & Credentials" : "Licencias y Credenciales"}
        </h2>
      </div>
      
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {licenseBadges.map((badge, index) => (
          <div
            key={`${badge.kind}-${badge.label}`}
            className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-white/95 px-4 py-3 shadow-sm"
            style={{ borderColor: SV.goldBorder }}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#3B66AD]/[0.08] shadow-inner">
              {badge.kind === "licensed" ? (
                <FaCertificate className="h-5 w-5 text-[#3B66AD]" aria-hidden />
              ) : badge.kind === "verified" ? (
                <FaShieldAlt className="h-5 w-5 text-[#3B66AD]" aria-hidden />
              ) : (
                <FaAward className="h-5 w-5 text-[#3B66AD]" aria-hidden />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-snug text-[color:var(--lx-text)]">{badge.label}</p>
              <p className="mt-1 text-xs text-[color:var(--lx-text-2)]">
                {badge.kind === "licensed" 
                  ? (lang === "en" ? "Licensed and certified professional" : "Profesional licenciado y certificado")
                  : badge.kind === "verified"
                  ? (lang === "en" ? "Verified business credentials" : "Credenciales de negocio verificadas")
                  : (lang === "en" ? "Professional recognition" : "Reconocimiento profesional")
                }
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
