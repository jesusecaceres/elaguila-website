"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type WorkspaceNavItem = { href: string; label: string; hint?: string };

const SECTIONS: WorkspaceNavItem[] = [
  { href: "/admin/workspace/home", label: "Home", hint: "Ruta pública /home (revista) — no la pantalla raíz /" },
  { href: "/admin/workspace/clasificados", label: "Clasificados", hint: "Moderación de anuncios en Supabase" },
  { href: "/admin/workspace/tienda", label: "Tienda", hint: "Vitrina /tienda + enlaces al catálogo y pedidos" },
  { href: "/admin/workspace/nosotros", label: "Nosotros", hint: "Página pública /about" },
  { href: "/admin/workspace/revista", label: "Revista", hint: "Manifiesto editions.json + notas internas" },
  { href: "/admin/workspace/contacto", label: "Contacto", hint: "Página /contacto (formulario global)" },
  { href: "/admin/workspace/noticias", label: "Noticias", hint: "Pública /noticias — workspace esqueleto, sin CMS aún" },
  { href: "/admin/workspace/iglesias", label: "Iglesias", hint: "Pública /iglesias — workspace esqueleto" },
  { href: "/admin/workspace/cupones", label: "Cupones", hint: "Públicas /cupones y /coupons — sin editor aún" },
  { href: "/admin/workspace/anunciate", label: "Anúnciate", hint: "Mapa al funnel publicar + cola Clasificados; sin CRM" },
];

const TIENDA_CRUD_PREFIX = "/admin/tienda";

function isSectionActive(pathname: string, item: WorkspaceNavItem): boolean {
  if (pathname === item.href || pathname.startsWith(`${item.href}/`)) return true;
  if (item.href === "/admin/workspace/tienda" && pathname.startsWith(`${TIENDA_CRUD_PREFIX}/`)) return true;
  return false;
}

function cx(...p: Array<string | false | undefined>) {
  return p.filter(Boolean).join(" ");
}

/**
 * Second-layer admin navigation — website section workspaces only.
 * Not a mirror of the public site nav; teaches where editorial vs ops live.
 */
export function AdminWorkspaceNav() {
  const pathname = usePathname() ?? "";

  return (
    <div className="mb-6 rounded-2xl border border-[#C9B46A]/35 bg-gradient-to-r from-[#FFF8F0]/95 to-[#FFFCF7]/90 px-2 py-3 shadow-sm sm:mb-8 sm:px-4">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0 pr-1">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">Website sections</p>
          <p className="text-xs text-[#5C5346]/90">Admin-only workspaces — not the public menu.</p>
        </div>
        <Link
          href="/admin/workspace"
          className={cx(
            "flex h-10 min-w-[44px] shrink-0 items-center justify-center rounded-xl px-3 py-2 text-xs font-bold transition sm:h-auto sm:min-h-0 sm:px-2.5 sm:py-1",
            pathname === "/admin/workspace"
              ? "bg-[#2A2620] text-[#FAF7F2]"
              : "text-[#6B5B2E] underline decoration-[#C9B46A]/60 underline-offset-2 hover:text-[#2A2620]"
          )}
        >
          Overview
        </Link>
      </div>
      <nav
        className="-mx-1 flex max-w-full gap-1.5 overflow-x-auto overscroll-x-contain px-1 pb-1 [-webkit-overflow-scrolling:touch] sm:flex-wrap sm:overflow-visible sm:pb-0"
        aria-label="Website section workspaces"
      >
        {SECTIONS.map((item) => {
          const active = isSectionActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.hint}
              aria-current={active ? "page" : undefined}
              className={cx(
                "inline-flex shrink-0 snap-start items-center rounded-xl border px-3 py-2.5 text-xs font-semibold transition sm:min-h-[2.25rem] sm:py-1.5 sm:text-sm",
                active
                  ? "border-[#C9B46A]/50 bg-[#FBF7EF] text-[#1E1810] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]"
                  : "border-transparent bg-white/60 text-[#3D3428]/90 hover:border-[#E8DFD0] hover:bg-white"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
