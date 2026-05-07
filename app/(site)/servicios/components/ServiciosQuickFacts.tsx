import { FiAward, FiCheck, FiClock, FiTag, FiTruck, FiZap } from "react-icons/fi";
import { FaShieldAlt, FaGlobeAmericas } from "react-icons/fa";
import type { ServiciosLang, ServiciosQuickFact, ServiciosQuickFactKind } from "../types/serviciosBusinessProfile";
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
export function ServiciosQuickFacts({ 
  facts, 
  lang, 
  compact = false 
}: { 
  facts: ServiciosQuickFact[]; 
  lang: ServiciosLang; 
  compact?: boolean;
}) {
  if (!facts.length) return null;
  
  if (compact) {
    // Compact chip strip mode for Sobre Nosotros section
    return (
      <div className="flex flex-wrap gap-2" aria-label={lang === "en" ? "Trust signals" : "Señales de confianza"}>
        {facts.map((f) => {
          const Icon = iconFor(f.kind);
          return (
            <span
              key={`${f.kind}-${f.label}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E8D7B8] bg-[#FCF9F2] px-3 py-1 text-[11px] font-medium text-[#2F2A23]"
            >
              <Icon className="h-3 w-3 text-[#6F7A3A]" aria-hidden />
              {f.label}
            </span>
          );
        })}
      </div>
    );
  }
  
  // Full card mode
  return (
    <section
      className="rounded-2xl border px-4 py-5 shadow-sm sm:px-6 sm:py-6"
      style={{ backgroundColor: SV.card, borderColor: SV.border, boxShadow: SV.shadowSm }}
      aria-label={lang === "en" ? "Trust signals" : "Señales de confianza"}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#2F2A23]">
        {lang === "en" ? "What sets us apart" : "Lo que nos distingue"}
      </p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {facts.map((f) => {
          const Icon = iconFor(f.kind);
          return (
            <div
              key={`${f.kind}-${f.label}`}
              className="flex min-w-0 items-start gap-3 rounded-xl border border-[#E8D7B8] bg-white/90 px-3.5 py-3 shadow-sm sm:items-center sm:gap-3.5 sm:px-4 sm:py-3.5"
            >
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#FCF9F2] text-sm text-[#6F7A3A]"
                aria-hidden
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[#2F2A23]">{f.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
