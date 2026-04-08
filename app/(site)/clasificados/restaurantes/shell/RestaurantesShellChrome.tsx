import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import newLogo from "@/public/logo.png";

type Lang = "es" | "en";

const copy = {
  es: {
    breadcrumbClassifieds: "Clasificados",
    breadcrumbRestaurants: "Restaurantes",
    breadcrumbCurrent: "Vista previa del anuncio",
  },
  en: {
    breadcrumbClassifieds: "Classifieds",
    breadcrumbRestaurants: "Restaurants",
    breadcrumbCurrent: "Listing preview",
  },
} as const;

function withLang(path: string, lang: Lang) {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}lang=${lang}`;
}

export function RestaurantesShellChrome({
  lang = "es",
  children,
  /** Preview / seller flow: no logo; single back link outside the ad canvas (see preview page). */
  previewEditHref,
}: {
  lang?: Lang;
  children: ReactNode;
  previewEditHref?: string;
}) {
  const c = copy[lang];
  const classifiedsHref = withLang("/clasificados", lang);
  const restaurantesHref = withLang("/clasificados/restaurantes", lang);

  return (
    <div
      className="min-h-screen overflow-x-hidden pb-20 pt-4 text-[color:var(--lx-text)] sm:pt-6 md:pb-24"
      style={{
        backgroundColor: "var(--lx-page)",
        backgroundImage: `
          radial-gradient(ellipse 120% 80% at 50% -20%, rgba(201, 180, 106, 0.18), transparent 55%),
          radial-gradient(ellipse 55% 40% at 100% 30%, rgba(255, 255, 255, 0.45), transparent 52%),
          radial-gradient(ellipse 45% 35% at 0% 75%, rgba(201, 164, 74, 0.1), transparent 50%)
        `,
      }}
    >
      <header className="mx-auto max-w-[1280px] px-4 md:px-5 lg:px-6">
        {previewEditHref ? (
          <div className="flex min-h-[44px] items-center">
            <Link
              href={previewEditHref}
              className="text-sm font-semibold text-[color:var(--lx-text-2)] underline decoration-[color:var(--lx-gold-border)] underline-offset-4 hover:text-[color:var(--lx-gold)]"
            >
              ← Volver a editar
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex min-w-0 shrink-0 flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                <Link href={classifiedsHref} className="block w-[min(160px,52vw)] max-w-[180px] sm:w-[min(200px,42vw)] sm:max-w-[200px]">
                  <Image src={newLogo} alt="LEONIX" className="h-auto w-full object-contain object-left" priority />
                </Link>
                <nav aria-label="Breadcrumb" className="hidden min-w-0 pt-1 text-sm text-[color:var(--lx-muted)] sm:block">
                  <ol className="flex flex-wrap items-center gap-1.5">
                    <li>
                      <Link
                        href={classifiedsHref}
                        className="font-medium text-[color:var(--lx-text-2)] hover:text-[color:var(--lx-gold)]"
                      >
                        {c.breadcrumbClassifieds}
                      </Link>
                    </li>
                    <li aria-hidden className="text-[color:var(--lx-muted)]">
                      /
                    </li>
                    <li>
                      <Link
                        href={restaurantesHref}
                        className="font-medium text-[color:var(--lx-text-2)] hover:text-[color:var(--lx-gold)]"
                      >
                        {c.breadcrumbRestaurants}
                      </Link>
                    </li>
                    <li aria-hidden className="text-[color:var(--lx-muted)]">
                      /
                    </li>
                    <li className="font-semibold text-[color:var(--lx-text)]">{c.breadcrumbCurrent}</li>
                  </ol>
                </nav>
              </div>
            </div>
            <nav aria-label="Breadcrumb" className="mt-3 text-sm text-[color:var(--lx-muted)] sm:hidden">
              <ol className="flex flex-wrap items-center gap-1.5">
                <li>
                  <Link href={classifiedsHref} className="font-medium text-[color:var(--lx-text-2)]">
                    {c.breadcrumbClassifieds}
                  </Link>
                </li>
                <span className="text-[color:var(--lx-muted)]">/</span>
                <li>
                  <Link href={restaurantesHref} className="font-medium text-[color:var(--lx-text-2)]">
                    {c.breadcrumbRestaurants}
                  </Link>
                </li>
                <span className="text-[color:var(--lx-muted)]">/</span>
                <li className="font-semibold text-[color:var(--lx-text)]">{c.breadcrumbCurrent}</li>
              </ol>
            </nav>
          </>
        )}
      </header>

      {children}
    </div>
  );
}
