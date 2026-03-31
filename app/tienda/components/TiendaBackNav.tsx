import Link from "next/link";
import type { Lang } from "../types/tienda";
import { withLang } from "../utils/tiendaRouting";

export function TiendaBackNav(props: { lang: Lang; href: string; label: string }) {
  return (
    <nav className="mb-8" aria-label="Tienda navigation">
      <Link
        href={withLang(props.href, props.lang)}
        className="text-sm font-medium text-[rgba(255,247,226,0.82)] hover:text-[rgba(201,168,74,0.95)] transition"
      >
        {props.label}
      </Link>
    </nav>
  );
}
