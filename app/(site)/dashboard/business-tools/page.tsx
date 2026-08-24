"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { LeonixDashboardShell } from "../components/LeonixDashboardShell";
import { BusinessConciergeOwnerHome } from "../components/BusinessConciergeOwnerHome";
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
            subtitle: "Estrategia Leonix Business Concierge — visibilidad, confianza y crecimiento.",
            lead: "Activa canales que convierten consultas en citas. Algunas integraciones llegarán en fases siguientes.",
            cards: [
              { h: "WhatsApp para tu negocio", p: "Centraliza respuestas rápidas y seguimiento de leads." },
              { h: "Perfil que vende", p: "Completa datos, fotos y prueba social para generar confianza." },
              { h: "Redes y presencia", p: "Conecta Instagram, Facebook y tu sitio con coherencia de marca." },
              { h: "Visibilidad y SEO local", p: "Títulos, ciudad y categorías que ayudan a que te encuentren." },
              { h: "Leonix Concierge", p: "Acompañamiento humano para priorizar anuncios y campañas." },
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
          }
        : {
            title: "Business tools",
            subtitle: "Leonix Business Concierge strategy — visibility, trust, and growth.",
            lead: "Turn inquiries into appointments. Some integrations will roll out in later phases.",
            cards: [
              { h: "WhatsApp for business", p: "Centralize fast replies and lead follow-up." },
              { h: "Profile that sells", p: "Complete details, photos, and social proof to build trust." },
              { h: "Social & presence", p: "Connect Instagram, Facebook, and your site with consistent branding." },
              { h: "Visibility & local SEO", p: "Titles, city, and categories that help buyers find you." },
              { h: "Leonix Concierge", p: "Human guidance to prioritize listings and campaigns." },
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
  const [hasBusinessListings, setHasBusinessListings] = useState(false);

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

        if (mounted) setHasBusinessListings(items.length > 0);
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
    <LeonixDashboardShell lang={lang} activeNav="business" plan={plan} userName={name} email={email} accountRef={accountRef} ownerId={userId} contentLayout="workbench">
      {loading ? (
        <div className="rounded-3xl border border-[#E8DFD0] bg-[#FFFCF7]/90 p-10 text-center text-sm text-[#5C5346]">{t.loading}</div>
      ) : (
        <BusinessConciergeOwnerHome
          lang={lang}
          q={q}
          hasBusinessListings={hasBusinessListings}
          completenessScore={completeness?.score ?? null}
          completenessMax={completeness?.max ?? null}
          completenessRecommendations={completeness?.recommendations ?? []}
          capabilityRows={capabilityRows.map((row) => ({
            key: row.key,
            label: row.label,
            href: row.href,
            active: row.active,
          }))}
          capabilitiesChecked={capabilitiesChecked}
        />
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
