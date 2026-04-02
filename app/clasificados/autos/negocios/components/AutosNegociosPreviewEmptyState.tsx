import Link from "next/link";
import { AutoDealerPreviewChrome } from "./AutoDealerPreviewChrome";

const CARD =
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-5 shadow-[0_8px_32px_-8px_rgba(42,36,22,0.1)] sm:p-6";

const EDIT_HREF = "/publicar/autos/negocios";

/** Premium empty state when the borrador has no meaningful content yet (no mock vehicle). */
export function AutosNegociosPreviewEmptyState() {
  return (
    <AutoDealerPreviewChrome editBackHref={EDIT_HREF}>
      <main className="mx-auto mt-8 max-w-[1280px] px-4 md:px-5 lg:px-6">
        <div className={CARD}>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[color:var(--lx-muted)]">Vista previa del anuncio</p>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-[color:var(--lx-text)] sm:text-2xl">
            Completa la información en Publicar para ver cómo aparecerá tu anuncio.
          </h1>
          <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-[color:var(--lx-text-2)]">
            Los campos vacíos no se mostrarán al comprador: galería, especificaciones y datos del negocio aparecerán aquí
            conforme los vayas añadiendo.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Link
              href={EDIT_HREF}
              className="inline-flex h-11 items-center justify-center rounded-[14px] bg-[color:var(--lx-cta-dark)] px-5 text-sm font-bold text-[#FFFCF7] shadow-lg transition hover:bg-[color:var(--lx-cta-dark-hover)]"
            >
              Ir a Publicar
            </Link>
            <span className="text-xs text-[color:var(--lx-muted)]">Borrador · solo en este dispositivo</span>
          </div>
        </div>
      </main>
    </AutoDealerPreviewChrome>
  );
}
