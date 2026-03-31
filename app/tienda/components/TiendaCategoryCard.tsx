import Link from "next/link";
import type { TiendaCategory, Lang } from "../types/tienda";
import { accentStyles } from "../utils/tiendaTheme";
import { withLang } from "../utils/tiendaRouting";

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-4 w-4"
      fill="none"
    >
      <path
        d="M7.5 4.5L13.5 10l-6 5.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TiendaCategoryCard(props: { category: TiendaCategory; lang: Lang }) {
  const { category, lang } = props;
  const a = accentStyles(category.accent);
  const title = lang === "en" ? category.title.en : category.title.es;
  const desc = lang === "en" ? category.description.en : category.description.es;
  const eyebrow = category.eyebrow ? (lang === "en" ? category.eyebrow.en : category.eyebrow.es) : null;

  return (
    <Link
      href={withLang(category.href, lang)}
      className={[
        "group relative overflow-hidden rounded-3xl",
        "bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))]",
        "ring-1",
        a.ring,
        "p-6 sm:p-7",
        "transition duration-300 ease-out",
        "hover:-translate-y-0.5 hover:ring-[color:rgba(201,168,74,0.40)]",
        a.glow,
      ].join(" ")}
      aria-label={title}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
        <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,rgba(201,168,74,0.22),rgba(0,0,0,0))]" />
        <div className="absolute -bottom-28 -left-24 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,252,247,0.14),rgba(0,0,0,0))]" />
      </div>

      <div className="relative">
        <div className={["inline-flex rounded-full border px-3 py-1 text-[11px] tracking-wide uppercase", a.chip].join(" ")}>
          {eyebrow ?? (lang === "en" ? "Category" : "Categoría")}
        </div>

        <div className="mt-4 flex items-start justify-between gap-6">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold tracking-tight text-white">
              {title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[rgba(255,255,255,0.70)]">
              {desc}
            </p>
          </div>

          <div className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-[rgba(255,247,226,0.86)]">
            <span className="hidden sm:inline">
              {lang === "en" ? "Explore" : "Explorar"}
            </span>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.04)] text-[rgba(255,247,226,0.88)] transition group-hover:border-[rgba(201,168,74,0.40)] group-hover:bg-[rgba(201,168,74,0.12)]">
              <ArrowIcon />
            </span>
          </div>
        </div>

        <div className="mt-6 h-[1px] w-full opacity-70">
          <div className={["h-full w-full", a.line].join(" ")} />
        </div>
      </div>
    </Link>
  );
}

