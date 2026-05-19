import Link from "next/link";
import type { Lang } from "../../types/tienda";
import type { TiendaCatalogItemRow } from "@/app/lib/tienda/tiendaCatalogTypes";
import {
  LEONIX_MAILTO_TIENDA,
  LEONIX_OFFICE_ADDRESS,
  LEONIX_PHONE_DISPLAY,
  LEONIX_PHONE_TEL,
  LEONIX_TIENDA_EMAIL,
} from "../../data/leonixContact";
import { tiendaPublicContactPath, withLang } from "../../utils/tiendaRouting";

export function TiendaCatalogContactBlock(props: { item: TiendaCatalogItemRow; lang: Lang }) {
  const { item, lang } = props;
  const en = lang === "en";

  return (
    <section className="rounded-2xl border border-[color:var(--lx-border)] bg-[color:var(--lx-section)] p-6 sm:p-8 space-y-4">
      <h2 className="text-lg font-semibold text-[color:var(--lx-text)]">
        {en ? "How to order or get a quote" : "Cómo pedir o cotizar"}
      </h2>
      <p className="text-sm leading-relaxed text-[color:var(--lx-muted)]">
        {en
          ? "The best way to order or discuss this product is by phone or by visiting our office. We’re happy to walk through options, timelines, and mockups."
          : "La mejor forma de pedir o platicar este producto es por teléfono o visitando nuestra oficina. Con gusto vemos opciones, tiempos y mockups."}
      </p>
      {(item.office_preferred !== false || item.phone_preferred !== false) && (
        <ul className="space-y-3 text-sm text-[color:var(--lx-text)]/80">
          {item.phone_preferred !== false ? (
            <li>
              <span className="font-semibold text-[color:var(--lx-text)]">{en ? "Phone" : "Teléfono"}: </span>
              <a href={LEONIX_PHONE_TEL} className="underline text-[color:var(--lx-blue)] hover:text-[color:var(--lx-text)]">
                {LEONIX_PHONE_DISPLAY}
              </a>
            </li>
          ) : null}
          {item.office_preferred !== false ? (
            <li>
              <span className="font-semibold text-[color:var(--lx-text)]">{en ? "Office" : "Oficina"}: </span>
              {LEONIX_OFFICE_ADDRESS}
            </li>
          ) : null}
        </ul>
      )}
      {item.email_allowed !== false ? (
        <p className="text-xs text-[color:var(--lx-muted)] leading-relaxed">
          {en ? "Email (secondary)" : "Correo (secundario)"}:{" "}
          <a href={`${LEONIX_MAILTO_TIENDA}?subject=${encodeURIComponent(en ? "Tienda catalog request" : "Solicitud catálogo Tienda")}`} className="underline text-[color:var(--lx-blue)] hover:text-[color:var(--lx-text)]">
            {LEONIX_TIENDA_EMAIL}
          </a>
          {en
            ? " — include the product name from this page. Order intake also uses this inbox."
            : " — incluye el nombre del producto de esta página. Los pedidos también llegan a este correo."}
        </p>
      ) : null}
      <p className="text-xs text-[color:var(--lx-muted)] pt-2 border-t border-[color:var(--lx-border)]">
        <Link
          href={withLang(tiendaPublicContactPath(), lang)}
          className="font-medium text-[color:var(--lx-lion)] hover:text-[color:var(--lx-text)]"
        >
          {en ? "Tienda help & contact page" : "Página de ayuda y contacto Tienda"}
        </Link>
        {en
          ? " — office-first guidance, phone, and Tienda email in one place."
          : " — guía con oficina primero, teléfono y correo Tienda en un solo lugar."}
      </p>
    </section>
  );
}
