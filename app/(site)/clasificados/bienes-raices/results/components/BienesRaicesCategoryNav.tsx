import Link from "next/link";

const LINKS: { href: string; label: string }[] = [
  { href: "/clasificados/rentas", label: "Renta" },
  { href: "/clasificados/en-venta", label: "Ventas" },
  { href: "/clasificados/empleos", label: "Empleos" },
  { href: "/clasificados/autos", label: "Autos" },
  { href: "/clasificados/travel", label: "Viajes" },
];

export function BienesRaicesCategoryNav() {
  return (
    <nav
      aria-label="Categorías Leonix"
      className="mb-8 flex flex-wrap gap-x-1 gap-y-2 border-b border-[#E8DFD0]/50 pb-4 text-sm text-[#5C5346]"
    >
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="rounded-lg px-2.5 py-1 font-medium hover:bg-[#FFFCF7] hover:text-[#1E1810]"
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
