import { FiAward, FiCheck, FiClock, FiTag, FiTruck, FiZap } from "react-icons/fi";
import { FaShieldAlt, FaGlobeAmericas } from "react-icons/fa";
import type { ServiciosLang, ServiciosQuickFact, ServiciosQuickFactKind } from "../types/serviciosBusinessProfile";
import { getServiciosProfileLabels } from "../copy/serviciosProfileCopy";
import { SV } from "./serviciosDesignTokens";

function iconFor(kind: ServiciosQuickFactKind) {
  switch (kind) {
    case "years_experience":
      return FiAward;
    case "response_time":
      return FiClock;
    case "free_estimate":
      return FiCheck;
    case "emergency":
      return FiZap;
    case "mobile_service":
      return FiTruck;
    case "same_day":
      return FiClock;
    case "bilingual":
      return FaGlobeAmericas;
    case "licensed_insured":
      return FaShieldAlt;
    default:
      return FiTag;
  }
}

/** Additional quick facts below the hero (first 3 may appear in the hero). */
export function ServiciosQuickFacts({ facts, lang }: { facts: ServiciosQuickFact[]; lang: ServiciosLang }) {
  const L = getServiciosProfileLabels(lang);
  if (!facts.length) return null;
  return (
    <section
      className="rounded-2xl border px-4 py-5 shadow-sm sm:px-6 sm:py-6"
      style={{ backgroundColor: SV.card, borderColor: SV.border, boxShadow: SV.shadowSm }}
      aria-label={lang === "en" ? "Trust signals" : "Señales de confianza"}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#3B66AD]/90">
        {lang === "en" ? "Trust & fit" : "Confianza y encaje"}
      </p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {facts.map((f) => {
          const Icon = iconFor(f.kind);
          return (
            <div
              key={`${f.kind}-${f.label}`}
              className="flex min-w-0 items-start gap-3 rounded-xl border border-black/[0.06] bg-white/90 px-3.5 py-3 shadow-sm sm:items-center sm:gap-3.5 sm:px-4 sm:py-3.5"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#3B66AD]/[0.08] text-[#3B66AD]"
                aria-hidden
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 text-sm font-semibold leading-snug text-[color:var(--lx-text)]">{f.label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
