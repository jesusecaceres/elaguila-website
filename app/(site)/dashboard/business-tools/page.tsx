"use client";

import Link from "next/link";
import {useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { LeonixDashboardShell } from "../components/LeonixDashboardShell";
import { computeBusinessCompleteness } from "../lib/businessProfileCompleteness";
import { fetchDashboardProfile } from "../lib/dashboardProfile";
import { fetchOwnerRestaurantListings, fetchOwnerServiciosListings } from "../lib/dashboardInventory";
import {
  fetchDashboardListingPackageEntitlementBadges,
  dashboardHasCapabilityForKey,
  type DashboardEntitlementLookupItem,
} from "../lib/dashboardPackageEntitlementBadges";

export const dynamic = "force-dynamic";

type Lang = "es" | "en";
type Plan = "free" | "pro";

function accountRefFromId(id: string): string {
  const s = (id ?? "").replace(/-/g, "").trim();
  if (s.length < 8) return "—";
  return `${s.slice(0, 4).toUpperCase()}-${s.slice(-4).toUpperCase()}`;
}

/** Package E Build E2, Gate 2 — a real, per-listing capability row. `active` is resolved
 * server-side via `resolveBusinessToolsAccess()` (Package C canonical resolver); never inferred
 * from profile completeness, account tier, placement, or a listing label. */
type CapabilityRow = {
  key: string;
  label: string;
  href: string;
  active: boolean;
};

function BusinessToolsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname() ?? "/dashboard/business-tools";
  const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";
  const q = `lang=${lang}`;

  const t = useMemo(
    () =>
      lang === "es"
        ? {
            title: "Herramientas de negocio",
            subtitle: "Leonix Business Concierge — lo que funciona hoy y lo que viene.",
            lead: "Esta página muestra capacidades reales según tu perfil y paquetes. No hay generadores de sitio web ni logo todavía.",
            availableNowTitle: "Disponible ahora",
            availableNowLead: "Herramientas activas hoy en tu panel Leonix.",
            yourToolsTitle: "Tus herramientas de negocio",
            conciergeTitle: "Business Concierge",
            conciergeLead:
              "Acompañamiento humano de Leonix para priorizar anuncios y campañas. No es un workspace de IA todavía.",
            comingSoonTitle: "Próximamente",
            comingSoonLead: "Planeado — aún no disponible en el producto.",
            comingSoonItems: [
              "Workspace de Concierge con IA",
              "Constructor de sitio web",
              "Generador de logo",
              "Generación de marca y contenido",
              "Generador de publicaciones para redes",
              "Integración WhatsApp para negocio",
              "Conexión automática de redes y SEO local",
            ],
            ctaProfile: "Completar perfil",
            ctaConcierge: "Solicitar información",
            loading: "Cargando…",
            completeness: "Completitud del perfil",
            nextSteps: "Siguientes pasos sugeridos",
            capabilitiesTitle: "Capacidades por anuncio",
            capabilitiesHint: "Estado real según tu paquete activo — nunca según el plan de tu cuenta.",
            capabilitiesEmpty: "No tienes anuncios de Restaurantes o Servicios todavía. Esta capacidad aplica a esas categorías.",
            active: "Incluido",
            locked: "No incluido",
            couponsLabel: "Cupones y ofertas",
            liveBadge: "Activo",
            partialBadge: "Parcial",
            soonBadge: "Próximamente",
          }
        : {
            title: "Business tools",
            subtitle: "Leonix Business Concierge — what works today and what is next.",
            lead: "This page shows real capabilities from your profile and packages. Website and logo builders are not live yet.",
            availableNowTitle: "Available now",
            availableNowLead: "Tools you can use in your Leonix dashboard today.",
            yourToolsTitle: "Your business tools",
            conciergeTitle: "Business Concierge",
            conciergeLead:
              "Human Leonix guidance to prioritize listings and campaigns. This is not an AI workspace yet.",
            comingSoonTitle: "Coming soon",
            comingSoonLead: "Planned — not available in the product yet.",
            comingSoonItems: [
              "AI Concierge workspace",
              "Website builder",
              "Logo generator",
              "Branding and content generation",
              "Social post generator",
              "WhatsApp for business integration",
              "Automated social and local SEO connections",
            ],
            ctaProfile: "Complete profile",
            ctaConcierge: "Request information",
            loading: "Loading…",
            completeness: "Profile completeness",
            nextSteps: "Suggested next steps",
            capabilitiesTitle: "Per-listing capabilities",
            capabilitiesHint: "Real status from your active package — never from your account plan.",
            capabilitiesEmpty: "You don't have any Restaurantes or Servicios listings yet. This capability applies to those categories.",
            active: "Included",
            locked: "Not included",
            couponsLabel: "Coupons & offers",
            liveBadge: "Live",
            partialBadge: "Partial",
            soonBadge: "Coming soon",
          },
    [lang]
  );

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const plan: Plan = "free";
  const [userId, setUserId] = useState<string | null>(null);
  const [completeness, setCompleteness] = useState<ReturnType<typeof computeBusinessCompleteness> | null>(null);
  const [capabilityRows, setCapabilityRows] = useState<CapabilityRow[]>([]);
  const [capabilitiesChecked, setCapabilitiesChecked] = useState(false);

  useEffect(() => {
    const sb = createSupabaseBrowserClient();
    let mounted = true;
    async function run() {
      const { data } = await sb.auth.getUser();
      if (!mounted) return;
      if (!data.user) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }
      const u = data.user;
      setUserId(u.id);
      setEmail(u.email ?? null);
      setName(
        (u.user_metadata?.full_name as string | undefined) ||
          (u.user_metadata?.name as string | undefined) ||
          null
      );
      try {
        const { row } = await fetchDashboardProfile(sb, u.id);
        if (row?.display_name?.trim()) setName(row.display_name.trim());
        if (row?.email?.trim()) setEmail(row.email.trim());
        const meta = u.user_metadata as Record<string, unknown> | undefined;
        const wa = typeof meta?.whatsapp === "string" ? meta.whatsapp : "";
        setCompleteness(
          computeBusinessCompleteness(row ?? null, { lang, whatsappHint: wa, businessMeta: meta ?? null })
        );
      } catch {
        /* ignore */
      }

      // Package E Build E2, Gate 2 — real capability truth. Only Restaurantes/Servicios have a
      // real capability model today (`categoryCommercialPlan.ts`'s CAPABILITY_CATEGORIES); no
      // other category is treated as gated here, and nothing here reads profile completeness or
      // account tier to decide inclusion.
      try {
        const { data: sess } = await sb.auth.getSession();
        const token = sess.session?.access_token ?? null;
        const [restaurantRows, serviciosRows] = await Promise.all([
          fetchOwnerRestaurantListings(sb, u.id),
          fetchOwnerServiciosListings(token),
        ]);

        const items: DashboardEntitlementLookupItem[] = [
          ...restaurantRows.map((row) => ({
            key: row.id,
            category: "restaurantes",
            listingSource: "restaurantes_public_listings",
            listingId: row.id,
            slug: row.slug ?? null,
            leonixAdId: row.leonix_ad_id ?? null,
          })),
          ...serviciosRows.map((row) => {
            const id = (row.id ?? row.slug) as string;
            return {
              key: id,
              category: "servicios",
              listingSource: "servicios_public_listings",
              listingId: id,
              slug: row.slug ?? null,
              leonixAdId: row.leonix_ad_id ?? null,
            };
          }),
        ];

        if (items.length > 0 && token) {
          const { badges } = await fetchDashboardListingPackageEntitlementBadges(items, token);
          const rows: CapabilityRow[] = [
            ...restaurantRows.map((row) => ({
              key: row.id,
              label: `${t.couponsLabel} — ${row.business_name?.trim() || row.slug}`,
              href: `/dashboard/restaurantes?${q}`,
              active: dashboardHasCapabilityForKey(badges, [row.id], "coupons_offers"),
            })),
            ...serviciosRows.map((row) => {
              const id = (row.id ?? row.slug) as string;
              return {
                key: id,
                label: `${t.couponsLabel} — ${row.business_name?.trim() || row.slug}`,
                href: `/dashboard/servicios?${q}`,
                active: dashboardHasCapabilityForKey(badges, [id], "coupons_offers"),
              };
            }),
          ];
          if (mounted) setCapabilityRows(rows);
        }
      } catch {
        /* fail closed to empty — never fabricate a capability */
      }
      if (mounted) setCapabilitiesChecked(true);
      setLoading(false);
    }
    void run();
    return () => {
      mounted = false;
    };
  }, [router, pathname]);

  const accountRef = userId ? accountRefFromId(userId) : null;

  return (
    <LeonixDashboardShell lang={lang} activeNav="business" plan={plan} userName={name} email={email} accountRef={accountRef} ownerId={userId}>
      {loading ? (
        <div className="rounded-3xl border border-[#E8DFD0] bg-[#FFFCF7]/90 p-10 text-center text-sm text-[#5C5346]">{t.loading}</div>
      ) : (
        <>
          <header className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6 shadow-[0_12px_40px_-14px_rgba(42,36,22,0.12)] sm:p-8">
            <h1 className="text-2xl font-bold tracking-tight text-[#1E1810] sm:text-3xl">{t.title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#5C5346]/95">{t.subtitle}</p>
            <p className="mt-4 text-sm text-[#3D3428]/90">{t.lead}</p>
          </header>

          <section className="mt-8 rounded-3xl border border-[#C9B46A]/35 bg-[#FFFDF7] p-6 shadow-[0_12px_40px_-14px_rgba(42,36,22,0.12)]">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold text-[#1E1810]">{t.availableNowTitle}</h2>
              <span className="inline-flex rounded-full border border-[#2A4536]/25 bg-[#2A4536]/[0.08] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#2A4536]">
                {t.liveBadge}
              </span>
            </div>
            <p className="mt-1 text-xs text-[#7A7164]">{t.availableNowLead}</p>

            {completeness ? (
              <div className="mt-4 rounded-2xl border border-[#E8DFD0] bg-white p-4">
                <h3 className="text-sm font-bold text-[#1E1810]">{t.completeness}</h3>
                <p className="mt-2 text-3xl font-bold tabular-nums text-[#1E1810]">
                  {completeness.score}/{completeness.max}
                </p>
                <p className="mt-3 text-sm font-semibold text-[#5C5346]">{t.nextSteps}</p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[#3D3428]/95">
                  {completeness.recommendations.slice(0, 4).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <Link
                  href={`/dashboard/perfil?${q}`}
                  className="mt-4 inline-flex min-h-[44px] items-center rounded-2xl bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-5 py-2.5 text-sm font-semibold text-[#1E1810] shadow-md hover:brightness-[1.03]"
                >
                  {t.ctaProfile}
                </Link>
              </div>
            ) : null}
          </section>

          {capabilitiesChecked ? (
            <section className="mt-8 rounded-3xl border border-[#C9B46A]/35 bg-[#FFFDF7] p-6 shadow-[0_12px_40px_-14px_rgba(42,36,22,0.12)]">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-bold text-[#1E1810]">{t.yourToolsTitle}</h2>
                <span className="inline-flex rounded-full border border-[#7A7164]/30 bg-[#F3EBDD]/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">
                  {t.partialBadge}
                </span>
              </div>
              <p className="mt-1 text-xs text-[#7A7164]">{t.capabilitiesHint}</p>
              <h3 className="mt-4 text-sm font-semibold text-[#1E1810]">{t.capabilitiesTitle}</h3>
              {capabilityRows.length === 0 ? (
                <p className="mt-3 text-sm text-[#5C5346]">{t.capabilitiesEmpty}</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {capabilityRows.map((row) => (
                    <li
                      key={row.key}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E8DFD0] bg-white px-4 py-3"
                    >
                      <Link href={row.href} className="text-sm font-medium text-[#1E1810] hover:underline">
                        {row.label}
                      </Link>
                      <span
                        className={
                          row.active
                            ? "inline-flex rounded-full border border-[#2A4536]/25 bg-[#2A4536]/[0.08] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#2A4536]"
                            : "inline-flex rounded-full border border-[#D6C7AD]/70 bg-[#F3EBDD]/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#7A7164]"
                        }
                      >
                        {row.active ? t.active : t.locked}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}

          <section className="mt-8 rounded-3xl border border-[#E8DFD0]/90 bg-gradient-to-br from-[#FFFCF7] to-[#FAF4EA] p-6 shadow-[0_10px_32px_-12px_rgba(42,36,22,0.1)]">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-[#1E1810]">{t.conciergeTitle}</h2>
              <span className="inline-flex rounded-full border border-[#7A7164]/30 bg-[#F3EBDD]/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">
                {t.partialBadge}
              </span>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#5C5346]/95">{t.conciergeLead}</p>
            <a
              href={`mailto:hola@leonix.com?subject=${encodeURIComponent(lang === "es" ? "Leonix Concierge" : "Leonix Concierge")}`}
              className="mt-4 inline-flex min-h-[44px] items-center rounded-2xl border border-[#E8DFD0] bg-white px-5 py-2.5 text-sm font-semibold text-[#2C2416] shadow-sm hover:bg-[#FAF7F2]"
            >
              {t.ctaConcierge}
            </a>
          </section>

          <section className="mt-8 rounded-3xl border border-dashed border-[#D6C7AD] bg-[#FFFCF7]/90 p-6">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-[#1E1810]">{t.comingSoonTitle}</h2>
              <span className="inline-flex rounded-full border border-[#D6C7AD]/70 bg-[#F3EBDD]/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">
                {t.soonBadge}
              </span>
            </div>
            <p className="mt-2 text-sm text-[#5C5346]/95">{t.comingSoonLead}</p>
            <ul className="mt-4 space-y-2">
              {t.comingSoonItems.map((item) => (
                <li
                  key={item}
                  className="flex min-h-[44px] items-center rounded-xl border border-[#E8DFD0]/70 bg-[#FAF7F2] px-4 py-3 text-sm text-[#5C5346]"
                >
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </LeonixDashboardShell>
  );
}

export default function BusinessToolsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <BusinessToolsPageContent />
    </Suspense>
  );
}
