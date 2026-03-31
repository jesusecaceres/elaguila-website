import Link from "next/link";
import type { Lang } from "../types/tienda";
import { withLang } from "../utils/tiendaRouting";

export function TiendaCTA(props: {
  lang: Lang;
  title: string;
  body: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
}) {
  const { lang, title, body, primary, secondary } = props;
  return (
    <section className="rounded-[2rem] border border-[rgba(201,168,74,0.26)] bg-[linear-gradient(180deg,rgba(0,0,0,0.20),rgba(201,168,74,0.08))] p-6 sm:p-10 shadow-[0_24px_90px_rgba(0,0,0,0.38)] overflow-hidden relative">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 right-[-20%] h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(201,168,74,0.24),rgba(0,0,0,0))]" />
        <div className="absolute -bottom-32 left-[-18%] h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,252,247,0.10),rgba(0,0,0,0))]" />
      </div>

      <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-center">
        <div>
          <div className="inline-flex items-center gap-2">
            <span className="h-[1px] w-10 bg-[rgba(201,168,74,0.55)]" />
            <span className="text-[11px] tracking-[0.18em] uppercase text-[rgba(255,247,226,0.76)]">
              {lang === "en" ? "Next steps" : "Siguiente paso"}
            </span>
          </div>
          <h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            {title}
          </h2>
          <p className="mt-2 text-sm sm:text-base leading-relaxed text-[rgba(255,255,255,0.72)] max-w-2xl">
            {body}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={withLang(primary.href, lang)}
            className="inline-flex items-center justify-center rounded-full bg-[color:var(--lx-gold)] px-6 py-3 text-sm font-semibold text-[color:var(--lx-text)] hover:brightness-95 transition shadow-[0_14px_40px_rgba(201,168,74,0.22)]"
          >
            {primary.label}
          </Link>
          <Link
            href={withLang(secondary.href, lang)}
            className="inline-flex items-center justify-center rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.06)] px-6 py-3 text-sm font-semibold text-[rgba(255,255,255,0.86)] hover:bg-[rgba(255,255,255,0.10)] transition"
          >
            {secondary.label}
          </Link>
        </div>
      </div>
    </section>
  );
}

