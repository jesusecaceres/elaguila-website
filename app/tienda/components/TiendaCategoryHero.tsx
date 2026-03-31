import type { Lang, TiendaCategory } from "../types/tienda";
import { accentStyles } from "../utils/tiendaTheme";

export function TiendaCategoryHero(props: { category: TiendaCategory; lang: Lang }) {
  const { category, lang } = props;
  const a = accentStyles(category.accent);
  const title = lang === "en" ? category.title.en : category.title.es;
  const desc = lang === "en" ? category.description.en : category.description.es;
  const hero = lang === "en" ? category.heroSummary.en : category.heroSummary.es;
  const eyebrow = category.eyebrow ? (lang === "en" ? category.eyebrow.en : category.eyebrow.es) : null;

  return (
    <header
      className={[
        "relative overflow-hidden rounded-[2rem] border p-7 sm:p-10 lg:p-11",
        "border-[rgba(255,255,255,0.10)]",
        "bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]",
        "shadow-[0_28px_100px_rgba(0,0,0,0.45)]",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-24 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(201,168,74,0.18),rgba(0,0,0,0))]" />
      </div>
      <div className="relative">
        <div className={["inline-flex rounded-full border px-3 py-1 text-[11px] tracking-wide uppercase", a.chip].join(" ")}>
          {eyebrow ?? (lang === "en" ? "Category" : "Categoría")}
        </div>
        <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white">{title}</h1>
        <p className="mt-3 max-w-3xl text-base sm:text-lg leading-relaxed text-[rgba(255,255,255,0.72)]">{desc}</p>
        <p className="mt-5 max-w-3xl text-sm sm:text-base leading-relaxed text-[rgba(255,247,226,0.80)] border-l-2 border-[rgba(201,168,74,0.55)] pl-4">
          {hero}
        </p>
      </div>
    </header>
  );
}
