import Link from "next/link";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import type { CategoryStandardKey } from "./categoryStandardTheme";

type VisibilitySurface = "hub" | "landing" | "results";

const ELIGIBLE_CATEGORIES = new Set<CategoryStandardKey>([
  "en-venta",
  "rentas",
  "empleos",
  "autos",
  "bienes-raices",
  "servicios",
  "restaurantes",
  "viajes",
]);

function sourceFor(category: CategoryStandardKey | "clasificados", surface: VisibilitySurface): string {
  if (category === "clasificados") return "clasificados-visibilidad";
  return `${category}-${surface}-visibilidad`;
}

export function visibilityContactHref(
  lang: Lang,
  category: CategoryStandardKey | "clasificados",
  surface: VisibilitySurface,
): string {
  const sp = new URLSearchParams();
  sp.set("lang", lang);
  sp.set("source", sourceFor(category, surface));
  return `/contacto?${sp.toString()}`;
}

export function categorySupportsVisibilityCta(category: CategoryStandardKey | "clasificados"): boolean {
  if (category === "clasificados") return true;
  return ELIGIBLE_CATEGORIES.has(category);
}

export function CategoryVisibilityCta({
  lang,
  category,
  surface,
  compact = false,
}: {
  lang: Lang;
  category: CategoryStandardKey | "clasificados";
  surface: VisibilitySurface;
  compact?: boolean;
}) {
  if (!categorySupportsVisibilityCta(category)) return null;

  const isEs = lang === "es";
  const href = visibilityContactHref(lang, category, surface);
  const title = isEs ? "Haz que tu anuncio tenga más visibilidad" : "Give your listing more visibility";
  const body = isEs
    ? "Opciones de revista, digital y destacados se revisan con Leonix. Nada aparece como Destacado sin un paquete activo."
    : "Print, digital, and featured options are reviewed with Leonix. Nothing is marked Featured without an active package.";
  const label = isEs ? "Conocer opciones de visibilidad" : "Explore visibility options";

  return (
    <aside
      className={[
        "rounded-xl border border-[#C9A84A]/45 bg-[#FFFDF7] text-[#2A2620] shadow-[0_8px_24px_-18px_rgba(31,36,28,0.18)]",
        compact ? "px-3 py-2.5" : "px-4 py-3",
      ].join(" ")}
      aria-label={label}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A1E2C]">
            {isEs ? "Visibilidad print + digital" : "Print + digital visibility"}
          </p>
          <p className="mt-1 text-sm font-bold leading-snug">{title}</p>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[#5C5346]">{body}</p>
        </div>
        <Link
          href={href}
          className="inline-flex min-h-[2.35rem] shrink-0 items-center justify-center rounded-lg border border-[#7A1E2C]/35 bg-[#7A1E2C] px-3 text-center text-xs font-bold text-[#FFFDF7] transition hover:bg-[#5e1721]"
        >
          {label}
        </Link>
      </div>
    </aside>
  );
}
