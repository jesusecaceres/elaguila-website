import Link from "next/link";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";

const LINKS: { href: string; labelEs: string; labelEn: string }[] = [
  { href: "/clasificados/rentas", labelEs: "Renta", labelEn: "Rentals" },
  { href: "/clasificados/en-venta", labelEs: "Ventas", labelEn: "For sale" },
  { href: "/clasificados/empleos", labelEs: "Empleos", labelEn: "Jobs" },
  { href: "/clasificados/autos", labelEs: "Autos", labelEn: "Cars" },
  { href: "/clasificados/viajes", labelEs: "Viajes", labelEn: "Travel" },
];

export function BienesRaicesCategoryNav({ lang }: { lang: Lang }) {
  return (
    <nav
      aria-label={lang === "en" ? "Leonix categories" : "Categorías Leonix"}
      className="mb-8 flex flex-wrap gap-x-1 gap-y-2 border-b border-[#E8DFD0]/50 pb-4 text-sm text-[#5C5346]"
    >
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={appendLangToPath(l.href, lang)}
          className="rounded-lg px-2.5 py-1 font-medium hover:bg-[#FFFCF7] hover:text-[#1E1810]"
        >
          {lang === "en" ? l.labelEn : l.labelEs}
        </Link>
      ))}
    </nav>
  );
}
