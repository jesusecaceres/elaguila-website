import Image from "next/image";
import Link from "next/link";
import type { TiendaCategory, Lang } from "../types/tienda";
import { tiendaCategoryCoverImage } from "../data/tiendaVisualAssets";
import type { TiendaCategorySlug } from "../data/tiendaCategories";
import { accentStyles } from "../utils/tiendaTheme";
import { withLang } from "../utils/tiendaRouting";

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none">
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

  const coverSrc = tiendaCategoryCoverImage(category.slug as TiendaCategorySlug);

  return (
    <Link
      href={withLang(category.href, lang)}
      className={[
        "group relative flex min-h-[300px] flex-col justify-end overflow-hidden rounded-3xl",
        "ring-1",
        a.ring,
        "transition duration-500 ease-out",
        "hover:-translate-y-1 hover:ring-[color:rgba(201,168,74,0.45)] hover:shadow-[0_28px_90px_rgba(0,0,0,0.5)]",
        a.glow,
      ].join(" ")}
      aria-label={title}
    >
      <div className="absolute inset-0">
        <Image
          src={coverSrc}
          alt=""
          fill
          className="object-cover transition duration-700 ease-out group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070708] via-[#070708]/88 to-[#070708]/35" />
        <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100">
          <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,rgba(201,168,74,0.35),rgba(0,0,0,0))]" />
        </div>
      </div>

      <div className="relative z-10 p-6 sm:p-7">
        <div className={["inline-flex rounded-full border px-3 py-1 text-[11px] tracking-wide uppercase backdrop-blur-sm", a.chip].join(" ")}>
          {eyebrow ?? (lang === "en" ? "Category" : "Categoría")}
        </div>

        <div className="mt-4 flex items-start justify-between gap-6">
          <div className="min-w-0">
            <h3 className="text-lg sm:text-xl font-semibold tracking-tight text-[rgba(255,247,226,0.98)] drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
              {title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[rgba(255,247,226,0.88)] drop-shadow-[0_1px_8px_rgba(0,0,0,0.55)] max-w-prose">
              {desc}
            </p>
          </div>

          <div className="mt-1 flex shrink-0 items-center gap-2 text-sm font-medium text-[rgba(255,247,226,0.92)]">
            <span className="hidden sm:inline drop-shadow-[0_1px_6px_rgba(0,0,0,0.65)]">
              {lang === "en" ? "Explore" : "Explorar"}
            </span>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(255,247,226,0.35)] bg-[rgba(0,0,0,0.35)] backdrop-blur-sm text-[rgba(255,247,226,0.95)] transition group-hover:border-[rgba(201,168,74,0.55)] group-hover:bg-[rgba(201,168,74,0.2)]">
              <ArrowIcon />
            </span>
          </div>
        </div>

        <div className="mt-6 h-[1px] w-full opacity-90">
          <div className={["h-full w-full", a.line].join(" ")} />
        </div>
      </div>
    </Link>
  );
}
