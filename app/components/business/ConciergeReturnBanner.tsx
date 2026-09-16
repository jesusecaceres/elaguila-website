"use client";

/**
 * P0 Sales Ad Creation Flow — "you're building this for X" + a clean way back to the business,
 * shown ONLY when a staff member arrived here through Create for Client (Business Concierge).
 * Reads app/lib/business/applicationContext/conciergeReturnContext.ts, written once by
 * HandoffClient. Renders nothing for a real customer's own session (no key = no context).
 *
 * Deliberately dumb/presentational: no fetch, no auth check of its own — the business link it
 * renders goes to the existing Business Concierge page, which re-enforces staff access itself.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { readConciergeReturnContext, type ConciergeReturnContext } from "@/app/lib/business/applicationContext/conciergeReturnContext";
import { normalizePublicarGatewayDeepLink, resolvePublicarGatewayDestination } from "@/app/(site)/publicar/publicarGatewayResolver";

const CATEGORY_LABEL_ES: Record<string, string> = {
  servicios: "Servicios",
  restaurantes: "Restaurantes",
  autos: "Autos",
  "bienes-raices": "Bienes Raíces",
  "ofertas-locales": "Ofertas Locales",
  "comida-local": "Comida Local",
  travel: "Viajes",
};
const CATEGORY_LABEL_EN: Record<string, string> = {
  servicios: "Servicios",
  restaurantes: "Restaurantes",
  autos: "Autos",
  "bienes-raices": "Real Estate",
  "ofertas-locales": "Local Deals",
  "comida-local": "Local Food",
  travel: "Travel",
};

export function ConciergeReturnBanner({ editHref: editHrefProp }: { editHref?: string }) {
  const [ctx, setCtx] = useState<ConciergeReturnContext | null>(null);
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    setMounted(true);
    setCtx(readConciergeReturnContext());
  }, []);

  // Never render during SSR/pre-hydration (sessionStorage is client-only) and never render at
  // all when there's no concierge context — a real customer previewing their own draft sees
  // nothing here, ever.
  if (!mounted || !ctx) return null;

  const label = CATEGORY_LABEL_ES[ctx.category] ?? ctx.category;
  const labelEn = CATEGORY_LABEL_EN[ctx.category] ?? ctx.category;
  const businessHref = `/admin/businesses/${encodeURIComponent(ctx.businessId)}#prospect-journey`;
  // No explicit editHref was passed (the common case now that PublishAuthGate mounts this
  // banner universally, on both application and preview pages) — derive one from the SAME
  // gateway resolver every category's launcher already uses, so "Editar / Edit" always points at
  // the real category application, never a duplicated/guessed route.
  const lang = searchParams?.get("lang") === "en" ? "en" : "es";
  const normalizedCategory = normalizePublicarGatewayDeepLink(ctx.category);
  const editHref = editHrefProp ?? (normalizedCategory ? resolvePublicarGatewayDestination(normalizedCategory, lang) : undefined);

  return (
    <div
      className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-2 border-b border-[#C9A84A]/50 bg-[#FBF7EF] px-4 py-2.5 text-sm"
      data-concierge-return-banner
      role="status"
    >
      <p className="min-w-0 text-[#3D2C12]">
        <span className="font-semibold">Borrador para {ctx.businessName}</span>
        <span className="text-[#7A6A4A]"> · {label} — borrador, aún no publicado</span>
        <span className="block text-xs text-[#7A6A4A] sm:inline sm:before:content-['_·_']">
          Draft for {ctx.businessName} · {labelEn} — draft, not yet published
        </span>
      </p>
      <div className="flex shrink-0 flex-wrap gap-2">
        {editHref ? (
          <Link
            href={editHref}
            className="inline-flex min-h-[36px] items-center rounded-lg border border-[#C9A84A]/70 bg-white px-3 text-xs font-semibold text-[#3D2C12] hover:bg-[#FFFDF7]"
          >
            Editar / Edit
          </Link>
        ) : null}
        <Link
          href={businessHref}
          className="inline-flex min-h-[36px] items-center rounded-lg bg-[#7A1E2C] px-3 text-xs font-semibold text-white hover:bg-[#651829]"
        >
          Volver al negocio / Back to Business
        </Link>
      </div>
    </div>
  );
}
