import { FiAward, FiCheck, FiClock, FiTag, FiTruck, FiZap } from "react-icons/fi";
import { FaShieldAlt, FaGlobeAmericas } from "react-icons/fa";
import type { ServiciosQuickFact, ServiciosQuickFactKind } from "../types/serviciosBusinessProfile";

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

export function ServiciosQuickFacts({ facts }: { facts: ServiciosQuickFact[] }) {
  if (!facts.length) return null;
  return (
    <div className="flex flex-wrap gap-2 md:gap-3">
      {facts.map((f) => {
        const Icon = iconFor(f.kind);
        return (
          <div
            key={`${f.kind}-${f.label}`}
            className="inline-flex max-w-full min-w-0 items-center gap-2 rounded-full border border-black/[0.08] bg-white px-3 py-2.5 text-xs font-semibold text-[color:var(--lx-text-2)] shadow-sm sm:py-2 sm:text-[13px]"
          >
            <Icon className="h-4 w-4 shrink-0 text-[#3B66AD]" aria-hidden />
            <span className="min-w-0 break-words leading-snug">{f.label}</span>
          </div>
        );
      })}
    </div>
  );
}
