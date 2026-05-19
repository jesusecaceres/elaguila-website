import Link from "next/link";
import type { Lang } from "../types/tienda";
import { tiendaPublicContactPath, withLang } from "../utils/tiendaRouting";

export function TiendaSupportPanel(props: {
  lang: Lang;
  title: string;
  body: string;
  message?: string;
}) {
  const { lang, title, body, message } = props;
  return (
    <section className="rounded-3xl border border-[color:var(--lx-border)] bg-[color:var(--lx-section)] p-6 sm:p-8 shadow-[0_22px_70px_rgba(42,36,22,0.08)]">
      <h2 className="text-lg font-semibold tracking-tight text-[color:var(--lx-text)]">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-[color:var(--lx-muted)]">{body}</p>
      {message ? (
        <p className="mt-3 text-sm leading-relaxed text-[color:var(--lx-text)]/80 border-t border-[color:var(--lx-border)] pt-3">
          {message}
        </p>
      ) : null}
      <div className="mt-5 flex flex-col sm:flex-row gap-3">
        <Link
          href={withLang(tiendaPublicContactPath(), lang)}
          className="inline-flex items-center justify-center rounded-full bg-[color:var(--lx-gold)] px-5 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] hover:brightness-95 transition shadow-[0_12px_34px_rgba(201,168,74,0.22)]"
        >
          {lang === "en" ? "Contact Leonix" : "Contactar a Leonix"}
        </Link>
        <span className="text-xs text-[color:var(--lx-muted)] sm:self-center">
          {lang === "en" ? "Visit our office for brand + custom jobs." : "Visita la oficina para marca y pedidos personalizados."}
        </span>
      </div>
    </section>
  );
}
