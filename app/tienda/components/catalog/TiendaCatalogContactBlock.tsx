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
    <section className="rounded-2xl border border-[rgba(201,168,74,0.35)] bg-[rgba(255,247,226,0.06)] p-6 sm:p-8 space-y-4">
      <h2 className="text-lg font-semibold text-[rgba(201,168,74,0.95)]">
        {en ? "How to order or get a quote" : "Cómo pedir o cotizar"}
      </h2>
      <p className="text-sm leading-relaxed text-[rgba(255,247,226,0.88)]">
        {en
          ? "The best way to order or discuss this product is by phone or by visiting our office. We’re happy to walk through options, timelines, and mockups."
          : "La mejor forma de pedir o platicar este producto es por teléfono o visitando nuestra oficina. Con gusto vemos opciones, tiempos y mockups."}
      </p>
      {(item.office_preferred !== false || item.phone_preferred !== false) && (
        <ul className="space-y-3 text-sm text-[rgba(255,255,255,0.82)]">
          {item.phone_preferred !== false ? (
            <li>
              <span className="font-semibold text-[rgba(201,168,74,0.95)]">{en ? "Phone" : "Teléfono"}: </span>
              <a href={LEONIX_PHONE_TEL} className="underline text-[rgba(147,196,255,0.95)] hover:text-white">
                {LEONIX_PHONE_DISPLAY}
              </a>
            </li>
          ) : null}
          {item.office_preferred !== false ? (
            <li>
              <span className="font-semibold text-[rgba(201,168,74,0.95)]">{en ? "Office" : "Oficina"}: </span>
              {LEONIX_OFFICE_ADDRESS}
            </li>
          ) : null}
        </ul>
      )}
      {item.email_allowed !== false ? (
        <p className="text-xs text-[rgba(255,255,255,0.55)] leading-relaxed">
          {en ? "Email (secondary)" : "Correo (secundario)"}:{" "}
          <a href={`${LEONIX_MAILTO_TIENDA}?subject=${encodeURIComponent(en ? "Tienda catalog request" : "Solicitud catálogo Tienda")}`} className="underline text-[rgba(147,196,255,0.85)]">
            {LEONIX_TIENDA_EMAIL}
          </a>
          {en
            ? " — include the product name from this page. Order intake also uses this inbox."
            : " — incluye el nombre del producto de esta página. Los pedidos también llegan a este correo."}
        </p>
      ) : null}
      <p className="text-xs text-[rgba(255,255,255,0.55)] pt-2 border-t border-[rgba(255,255,255,0.08)]">
        <Link
          href={withLang(tiendaPublicContactPath(), lang)}
          className="font-medium text-[rgba(201,168,74,0.9)] hover:text-[rgba(255,247,226,0.95)]"
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
