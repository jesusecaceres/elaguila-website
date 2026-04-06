"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin/workspace/tienda", label: "Mapa del workspace", hint: "Resumen y enlaces de la vitrina" },
  { href: "/admin/tienda/orders", label: "Pedidos", hint: "Bandeja e inbox de órdenes" },
  { href: "/admin/tienda/catalog", label: "Catálogo", hint: "Lista y edición de artículos" },
  { href: "/admin/tienda/catalog/new", label: "Nuevo artículo", hint: "Alta de un producto en el catálogo" },
] as const;

function cx(...p: Array<string | false | undefined>) {
  return p.filter(Boolean).join(" ");
}

function tiendaSubnavActive(pathname: string, href: string): boolean {
  if (href === "/admin/workspace/tienda") return pathname === href;
  if (href === "/admin/tienda/orders") return pathname === href || pathname.startsWith(`${href}/`);
  if (href === "/admin/tienda/catalog/new") {
    return pathname === href || pathname.startsWith(`${href}/`);
  }
  if (href === "/admin/tienda/catalog") {
    if (pathname === "/admin/tienda/catalog/new" || pathname.startsWith("/admin/tienda/catalog/new/")) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  }
  return false;
}

/**
 * In-content nav for real Tienda CRUD routes (/admin/tienda/*), paired with {@link AdminWorkspaceNav}.
 */
export function AdminTiendaWorkspaceSubnav() {
  const pathname = usePathname() ?? "";

  return (
    <div
      className="mb-6 rounded-2xl border border-[#C9B46A]/25 bg-[#FFFCF7]/95 px-3 py-2.5 shadow-sm sm:px-4"
      role="navigation"
      aria-label="Áreas de administración de Tienda"
    >
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">Dentro de Tienda</p>
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {LINKS.map((item) => {
          const active = tiendaSubnavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.hint}
              aria-current={active ? "page" : undefined}
              className={cx(
                "inline-flex min-h-[2rem] items-center rounded-xl border px-2.5 py-1 text-xs font-semibold transition sm:px-3 sm:text-sm",
                active
                  ? "border-[#C9B46A]/45 bg-[#FBF7EF] text-[#1E1810]"
                  : "border-transparent bg-white/70 text-[#3D3428]/90 hover:border-[#E8DFD0] hover:bg-white"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
