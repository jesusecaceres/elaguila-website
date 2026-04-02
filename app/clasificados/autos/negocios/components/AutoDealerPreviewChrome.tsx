import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import newLogo from "@/public/logo.png";

export const AUTO_DEALER_PREVIEW_PAGE_BG = {
  backgroundColor: "var(--lx-page)",
  backgroundImage: `
    radial-gradient(ellipse 120% 80% at 50% -20%, rgba(201, 180, 106, 0.2), transparent 55%),
    radial-gradient(ellipse 55% 40% at 100% 30%, rgba(255, 255, 255, 0.45), transparent 52%),
    radial-gradient(ellipse 45% 35% at 0% 75%, rgba(201, 164, 74, 0.1), transparent 50%)
  `,
} as const;

/** Shared Leonix shell: branding, breadcrumbs, optional back link — same for listing and empty preview. */
export function AutoDealerPreviewChrome({
  editBackHref,
  children,
}: {
  editBackHref?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen pb-16 pt-6 text-[color:var(--lx-text)] md:pb-20" style={AUTO_DEALER_PREVIEW_PAGE_BG}>
      <header className="mx-auto max-w-[1280px] px-4 md:px-5 lg:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex shrink-0 items-start gap-4">
            <Link href="/clasificados" className="block w-[min(200px,42vw)] max-w-[200px]">
              <Image src={newLogo} alt="LEONIX" className="h-auto w-full object-contain object-left" priority />
            </Link>
            <nav aria-label="Migas de pan" className="hidden min-w-0 pt-1 text-sm text-[color:var(--lx-muted)] sm:block">
              <ol className="flex flex-wrap items-center gap-1.5">
                <li>
                  <Link href="/clasificados" className="font-medium text-[color:var(--lx-text-2)] hover:text-[color:var(--lx-gold)]">
                    Clasificados
                  </Link>
                </li>
                <li aria-hidden className="text-[color:var(--lx-muted)]">
                  /
                </li>
                <li>
                  <Link href="/clasificados/autos" className="font-medium text-[color:var(--lx-text-2)] hover:text-[color:var(--lx-gold)]">
                    Autos
                  </Link>
                </li>
                <li aria-hidden className="text-[color:var(--lx-muted)]">
                  /
                </li>
                <li className="font-semibold text-[color:var(--lx-text)]">Negocios</li>
              </ol>
            </nav>
          </div>
        </div>
        <nav aria-label="Migas de pan" className="mt-3 text-sm text-[color:var(--lx-muted)] sm:hidden">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/clasificados" className="font-medium text-[color:var(--lx-text-2)]">
                Clasificados
              </Link>
            </li>
            <span className="text-[color:var(--lx-muted)]">/</span>
            <li>
              <Link href="/clasificados/autos" className="font-medium text-[color:var(--lx-text-2)]">
                Autos
              </Link>
            </li>
            <span className="text-[color:var(--lx-muted)]">/</span>
            <li className="font-semibold text-[color:var(--lx-text)]">Negocios</li>
          </ol>
        </nav>
        {editBackHref ? (
          <div className="mt-4 flex justify-end">
            <Link
              href={editBackHref}
              className="text-sm font-semibold text-[color:var(--lx-text-2)] underline decoration-[color:var(--lx-gold-border)] underline-offset-4 transition hover:text-[color:var(--lx-gold)]"
            >
              Volver a editar
            </Link>
          </div>
        ) : null}
      </header>

      {children}
    </div>
  );
}
