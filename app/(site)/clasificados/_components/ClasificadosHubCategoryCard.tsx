import Link from "next/link";
import type { ReactNode } from "react";
import type { HubCategoryKey } from "@/app/(site)/clasificados/config/clasificadosHub";
import { getClasificadosCategoryCopy } from "@/app/lib/clasificados/clasificadosHubPageCopy";
import type { SupportedLang } from "@/app/lib/language";
import { getClasificadosHubExploreCtaLabel } from "../_lib/clasificadosLandingHubCopy";

function CategoryMark({ category }: { category: HubCategoryKey }) {
  const stroke = "#2A4536";
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-7 w-7",
  };

  switch (category) {
    case "en-venta":
      return (
        <svg {...common} aria-hidden>
          <rect x="4" y="4" width="7" height="7" rx="1" />
          <rect x="13" y="4" width="7" height="7" rx="1" />
          <rect x="4" y="13" width="7" height="7" rx="1" />
          <rect x="13" y="13" width="7" height="7" rx="1" />
        </svg>
      );
    case "rentas":
      return (
        <svg {...common} aria-hidden>
          <path d="M4 10l8-6 8 6v10H4z" />
          <path d="M10 20v-6h4v6" />
          <circle cx="17" cy="7" r="2.5" />
          <path d="M17 9.5v3.5" />
        </svg>
      );
    case "empleos":
      return (
        <svg {...common} aria-hidden>
          <rect x="3" y="7" width="18" height="12" rx="1.5" />
          <path d="M8 7V6a4 4 0 018 0v1" />
        </svg>
      );
    case "autos":
      return (
        <svg {...common} aria-hidden>
          <path d="M5 16h14l-1.5-5H6.5L5 16z" />
          <circle cx="8" cy="17" r="1.5" />
          <circle cx="16" cy="17" r="1.5" />
        </svg>
      );
    case "bienes-raices":
      return (
        <svg {...common} aria-hidden>
          <path d="M3 20h18" />
          <path d="M6 20V9l6-4 6 4v11" />
          <path d="M10 20v-5h4v5" />
        </svg>
      );
    case "servicios":
      return (
        <svg {...common} aria-hidden>
          <path d="M14 4l2 2-8 8-2-2 8-8z" />
          <path d="M16 6l2 2" />
          <path d="M6 18l-2 2" />
        </svg>
      );
    case "restaurantes":
      return (
        <svg {...common} aria-hidden>
          <path d="M8 4v8M6 4h4" />
          <path d="M16 4v16M14 4h4" />
        </svg>
      );
    case "travel":
      return (
        <svg {...common} aria-hidden>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 4v2M12 18v2M4 12h2M18 12h2" />
          <path d="M7 7l1.5 1.5M15.5 15.5L17 17M7 17l1.5-1.5M15.5 8.5L17 7" />
        </svg>
      );
    case "comunidad":
      return (
        <svg {...common} aria-hidden>
          <circle cx="9" cy="9" r="2.5" />
          <circle cx="15" cy="9" r="2.5" />
          <path d="M4 19c1.5-3 4-4.5 8-4.5s6.5 1.5 8 4.5" />
        </svg>
      );
    case "clases":
      return (
        <svg {...common} aria-hidden>
          <path d="M5 6h14v12H5z" />
          <path d="M9 6V4h6v2" />
          <path d="M8 11h8M8 14h5" />
        </svg>
      );
    case "busco":
      return (
        <svg {...common} aria-hidden>
          <circle cx="10" cy="10" r="5.5" />
          <path d="M14.5 14.5L19 19" />
        </svg>
      );
    case "mascotas-y-perdidos":
      return (
        <svg {...common} aria-hidden>
          <ellipse cx="8" cy="14" rx="2.5" ry="3" />
          <ellipse cx="12" cy="11" rx="2" ry="2.5" />
          <ellipse cx="16" cy="14" rx="2.5" ry="3" />
          <ellipse cx="10" cy="7" rx="2" ry="2.5" />
          <ellipse cx="14" cy="7" rx="2" ry="2.5" />
          <path d="M18 18l3 3" />
          <circle cx="19.5" cy="16.5" r="2.5" />
        </svg>
      );
    default:
      return (
        <span className="text-xs font-bold tracking-wide text-[#2A4536]" aria-hidden>
          LM
        </span>
      );
  }
}

export type ClasificadosHubCategoryCardProps = {
  lang: SupportedLang;
  browseHref: string;
  publishHref: string;
  label: string;
  description: string;
  publishLabel: string;
  note?: string;
  priority?: boolean;
  accent?: "gold" | "burgundy" | "default";
  icon?: ReactNode;
  category?: HubCategoryKey;
};

export function ClasificadosHubCategoryCard({
  lang,
  browseHref,
  publishHref,
  label,
  description,
  publishLabel,
  note,
  priority,
  accent = "default",
  icon,
  category,
}: ClasificadosHubCategoryCardProps) {
  const exploreLabel = getClasificadosHubExploreCtaLabel(lang);
  const resolvedNote =
    note ?? (category ? getClasificadosCategoryCopy(lang, category).note : undefined);

  const topAccent =
    accent === "burgundy"
      ? "border-t-[#7A1E2C]"
      : priority || accent === "gold"
        ? "border-t-[#C9A84A]"
        : "border-t-[#C9A84A]/35";

  const borderClass = priority
    ? "border-[#C9A84A]/50"
    : accent === "burgundy"
      ? "border-[#7A1E2C]/30"
      : "border-[#C9A84A]/40";

  return (
    <article
      className={`flex h-full min-h-[18rem] flex-col rounded-2xl border-2 border-t-[3px] bg-gradient-to-br from-[#FFFCF7] via-[#FFFCF7] to-[#FAF6EE] p-5 shadow-[0_10px_28px_-18px_rgba(31,36,28,0.18)] ${borderClass} ${topAccent}`}
    >
      <span
        className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-[#FAF6EE] text-[#2A4536] ${
          accent === "burgundy" ? "border-[#7A1E2C]/25 bg-[#7A1E2C]/5" : "border-[#C9A84A]/40"
        }`}
      >
        {icon ?? (category ? <CategoryMark category={category} /> : null)}
      </span>
      <h3 className="mt-4 text-base font-bold leading-snug text-[#1E1810]">{label}</h3>
      {resolvedNote ? <p className="mt-1 text-xs font-semibold text-[#556B3E]">{resolvedNote}</p> : null}
      <p className="mt-2 flex-1 text-sm leading-relaxed text-[#3D3428]">{description}</p>
      <div className="mt-auto flex flex-col gap-3 border-t border-[#D6C7AD]/45 pt-5">
        <Link
          href={browseHref}
          className="inline-flex min-h-[2.75rem] w-full items-center justify-center rounded-xl border-2 border-[#C9A84A]/60 bg-[#FFFCF7] px-4 py-2.5 text-center text-sm font-bold text-[#2A4536] transition hover:border-[#C9A84A] hover:bg-[#FBF7EF]"
        >
          {exploreLabel}
        </Link>
        <Link
          href={publishHref}
          className="inline-flex min-h-[2.75rem] w-full items-center justify-center rounded-xl bg-[#7A1E2C] px-4 py-2.5 text-center text-sm font-bold text-[#FFFDF7] shadow-sm transition hover:bg-[#5e1721]"
        >
          {publishLabel}
        </Link>
      </div>
    </article>
  );
}
