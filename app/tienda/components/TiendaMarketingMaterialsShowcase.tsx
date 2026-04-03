import type { Lang } from "../types/tienda";
import { marketingMaterialsShowcaseItems } from "../data/tiendaVisualAssets";
import { TiendaRemoteFillImage } from "./TiendaRemoteFillImage";

/**
 * Visual-first catalog grid for /tienda/c/marketing-materials — does not change registry families.
 */
export function TiendaMarketingMaterialsShowcase(props: { lang: Lang }) {
  const { lang } = props;

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-[rgba(201,168,74,0.22)] bg-[linear-gradient(165deg,rgba(201,168,74,0.07),rgba(0,0,0,0.35))] p-4 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
      <h2 className="text-sm font-semibold tracking-tight text-[rgba(255,247,226,0.96)]">
        {lang === "en" ? "What we produce in this lane" : "Qué producimos en esta categoría"}
      </h2>
      <p className="mt-1 max-w-3xl text-xs text-[rgba(255,255,255,0.55)] sm:text-sm">
        {lang === "en"
          ? "Menus, mailers, postcards, and campaign pieces — Leonix coordinates files and proofs before print."
          : "Menús, mailers, postales y piezas de campaña — Leonix coordina archivos y pruebas antes de imprimir."}
      </p>
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
        {marketingMaterialsShowcaseItems.map((item, i) => {
          const label = lang === "en" ? item.label.en : item.label.es;
          return (
            <div
              key={`${item.label.en}-${i}`}
              className="group relative overflow-hidden rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.35)]"
            >
              <div className="relative aspect-[4/3] w-full">
                <TiendaRemoteFillImage
                  primarySrc={item.photo}
                  fallbackSrc="/tienda/visuals/category-marketing-materials.svg"
                  alt={label}
                  className="object-cover object-center transition duration-500 group-hover:scale-[1.04]"
                  sizes="(max-width: 640px) 45vw, 200px"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <span className="absolute bottom-2 left-2 right-2 text-[11px] font-semibold leading-tight text-white drop-shadow-md sm:text-xs">
                  {label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
