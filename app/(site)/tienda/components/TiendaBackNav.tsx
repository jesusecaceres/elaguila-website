import Link from "next/link";
import type { Lang } from "../types/tienda";
import { withLang } from "../utils/tiendaRouting";

export function TiendaBackNav(props: { lang: Lang; href: string; label: string }) {
  return (
    <nav className="mb-8" aria-label="Tienda navigation">
      <Link
        href={withLang(props.href, props.lang)}
        className="text-sm font-medium text-[color:var(--lx-muted)] hover:text-[color:var(--lx-lion)] transition"
      >
        {props.label}
      </Link>
    </nav>
  );
}
