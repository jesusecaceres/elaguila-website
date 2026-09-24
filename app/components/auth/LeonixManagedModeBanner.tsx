"use client";

import Link from "next/link";
import { QUICK_SALES_WORKSPACE_PATH } from "@/app/lib/sales/quickSalesRoutes";

/**
 * QUICK SALES ENTRY CONSOLIDATION — the PERSISTENT "you are in Leonix custody" banner.
 *
 * Rendered by PublishAuthGate whenever the SERVER verified an assisted-publishing context for this
 * render. Unlike ConciergeReturnBanner (which reads a sessionStorage return-context that only the
 * Create-for-Client handoff writes, and so is absent for a Quick Sales launch), this banner has no
 * client-side precondition at all: if the signed cookie verified, the banner shows. It exists so a
 * staff member can never mistake an assisted tab for their own customer session — the exact
 * confusion the mixed-session refusal closes on the server side.
 *
 * Presentational only. It reads the values PublishAuthGateLayout already verified and adds
 * nothing a customer could see, because a customer's render never carries the cookie.
 */
const CATEGORY_LABEL: Record<string, { es: string; en: string }> = {
  servicios: { es: "Servicios", en: "Services" },
  restaurantes: { es: "Restaurantes", en: "Restaurants" },
  autos: { es: "Autos Dealer", en: "Auto Dealer" },
  "bienes-raices": { es: "Bienes Raíces Negocio", en: "Real Estate Business" },
};

function shortId(id: string): string {
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

export function LeonixManagedModeBanner({
  businessId,
  category,
  listingId,
}: {
  businessId: string;
  category: string;
  listingId?: string | null;
}) {
  const label = CATEGORY_LABEL[category] ?? { es: category, en: category };
  return (
    <div
      className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#C9A84A] bg-[#7A1E2C] px-4 py-2 text-xs text-white"
      data-leonix-managed-banner
      data-category={category}
      data-business-id={businessId}
      data-listing-id={listingId ?? ""}
      role="status"
      aria-live="polite"
    >
      <p className="min-w-0">
        <span className="font-bold uppercase tracking-[0.12em]">Modo Leonix / Leonix Managed</span>
        <span className="text-white/85">
          {" "}· {label.es} / {label.en} · Negocio / Business <span className="font-mono">{shortId(businessId)}</span> · Anuncio / Ad{" "}
          <span className="font-mono">{listingId ? shortId(listingId) : "nuevo / new"}</span>
        </span>
        <span className="block text-[11px] text-white/75 sm:inline sm:before:content-['_·_']">
          Custodia de oficina; el anuncio no queda a nombre de tu cuenta. / Office custody; the ad is never saved under your own account.
        </span>
      </p>
      <Link
        href={QUICK_SALES_WORKSPACE_PATH}
        className="inline-flex min-h-[32px] shrink-0 items-center rounded-lg border border-white/60 bg-white/10 px-3 font-semibold hover:bg-white/20"
      >
        Volver a Venta asistida / Back to Quick Sales
      </Link>
    </div>
  );
}
