"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { LeonixDashboardShell } from "../components/LeonixDashboardShell";
import { computeBusinessCompleteness } from "../lib/businessProfileCompleteness";
import { fetchDashboardProfile } from "../lib/dashboardProfile";
import { BusinessIdentityAccessPanel } from "./_components/BusinessIdentityAccessPanel";

type Lang = "es" | "en";
type Plan = "free" | "pro";

function accountRefFromId(id: string): string {
  const s = (id ?? "").replace(/-/g, "").trim();
  if (s.length < 8) return "—";
  return `${s.slice(0, 4).toUpperCase()}-${s.slice(-4).toUpperCase()}`;
}

function normalizePlanFromMembershipTier(raw: unknown): Plan {
  void raw;
  return "free";
}

export default function BusinessToolsPage() {
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
            learningCenterTitle: "Centro de aprendizaje",
            learningCenterDesc: "Educación práctica y gratuita sobre publicidad, SEO local, WhatsApp Business, reseñas y más.",
            learningCenterCta: "Explorar lecciones",
            ideaBuilderTitle: "Constructor de ideas",
            ideaBuilderDesc: "Organiza tu idea de negocio paso a paso, guarda tu progreso y descarga un resumen.",
            ideaBuilderCta: "Empezar",
            conciergeTitle: "Concierge DIY",
            conciergeDesc: "Tu mapa de salud, tus acciones personalizadas y tu progreso real, en un solo lugar.",
            conciergeCta: "Abrir Concierge",
            healthMapTitle: "Mapa de salud del negocio",
            healthMapDesc: "Una mirada en lenguaje claro a lo que Leonix entiende sobre tu negocio.",
            healthMapCta: "Ver mapa de salud",
            bookTitle: "Lo que Leonix entiende",
            bookDesc: "Revisa, confirma o corrige la información que Leonix tiene sobre tu negocio.",
            bookCta: "Revisar información",
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
            learningCenterTitle: "Learning Center",
            learningCenterDesc: "Free, practical education on advertising, local SEO, WhatsApp Business, reviews, and more.",
            learningCenterCta: "Explore lessons",
            ideaBuilderTitle: "Idea Builder",
            ideaBuilderDesc: "Organize your business idea step by step, save your progress, and download a summary.",
            ideaBuilderCta: "Get started",
            conciergeTitle: "DIY Concierge",
            conciergeDesc: "Your Health Map, your personalized actions, and your real progress, in one place.",
            conciergeCta: "Open Concierge",
            healthMapTitle: "Business Health Map",
            healthMapDesc: "A plain-language look at what Leonix understands about your business.",
            healthMapCta: "View Health Map",
            bookTitle: "What Leonix understands",
            bookDesc: "Review, confirm, or correct the information Leonix has about your business.",
            bookCta: "Review information",
          },
    [lang]
  );

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan>("free");
  const [userId, setUserId] = useState<string | null>(null);
  const [completeness, setCompleteness] = useState<ReturnType<typeof computeBusinessCompleteness> | null>(null);

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
        setPlan(normalizePlanFromMembershipTier(row?.membership_tier));
        const meta = u.user_metadata as Record<string, unknown> | undefined;
        const wa = typeof meta?.whatsapp === "string" ? meta.whatsapp : "";
        setCompleteness(
          computeBusinessCompleteness(row ?? null, { lang, whatsappHint: wa, businessMeta: meta ?? null })
        );
      } catch {
        /* ignore */
      }
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

          <div className="mt-8">
            <BusinessIdentityAccessPanel lang={lang} userId={userId} />
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-[#E8DFD0]/90 bg-gradient-to-br from-[#FFFCF7] to-[#FAF4EA] p-6 shadow-[0_10px_32px_-12px_rgba(42,36,22,0.1)]">
              <h2 className="text-base font-bold text-[#1E1810]">{t.learningCenterTitle}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#5C5346]/95">{t.learningCenterDesc}</p>
              <Link
                href={`/aprender?${q}`}
                className="mt-4 inline-flex min-h-11 items-center rounded-2xl border border-[#E8DFD0] bg-white px-4 text-sm font-semibold text-[#2C2416] shadow-sm hover:bg-[#FAF7F2]"
              >
                {t.learningCenterCta}
              </Link>
            </div>
            <div className="rounded-3xl border border-[#E8DFD0]/90 bg-gradient-to-br from-[#FFFCF7] to-[#FAF4EA] p-6 shadow-[0_10px_32px_-12px_rgba(42,36,22,0.1)]">
              <h2 className="text-base font-bold text-[#1E1810]">{t.ideaBuilderTitle}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#5C5346]/95">{t.ideaBuilderDesc}</p>
              <Link
                href={`/dashboard/business-tools/idea-builder?${q}`}
                className="mt-4 inline-flex min-h-11 items-center rounded-2xl bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-4 text-sm font-semibold text-[#1E1810] shadow-md hover:brightness-[1.03]"
              >
                {t.ideaBuilderCta}
              </Link>
            </div>
            <div className="rounded-3xl border border-[#E8DFD0]/90 bg-gradient-to-br from-[#FFFCF7] to-[#FAF4EA] p-6 shadow-[0_10px_32px_-12px_rgba(42,36,22,0.1)]">
              <h2 className="text-base font-bold text-[#1E1810]">{t.conciergeTitle}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#5C5346]/95">{t.conciergeDesc}</p>
              <Link
                href={`/dashboard/business-tools/concierge?${q}`}
                className="mt-4 inline-flex min-h-11 items-center rounded-2xl bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-4 text-sm font-semibold text-[#1E1810] shadow-md hover:brightness-[1.03]"
              >
                {t.conciergeCta}
              </Link>
            </div>
            <div className="rounded-3xl border border-[#E8DFD0]/90 bg-gradient-to-br from-[#FFFCF7] to-[#FAF4EA] p-6 shadow-[0_10px_32px_-12px_rgba(42,36,22,0.1)]">
              <h2 className="text-base font-bold text-[#1E1810]">{t.healthMapTitle}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#5C5346]/95">{t.healthMapDesc}</p>
              <Link
                href={`/dashboard/business-tools/business-health?${q}`}
                className="mt-4 inline-flex min-h-11 items-center rounded-2xl border border-[#E8DFD0] bg-white px-4 text-sm font-semibold text-[#2C2416] shadow-sm hover:bg-[#FAF7F2]"
              >
                {t.healthMapCta}
              </Link>
            </div>
            <div className="rounded-3xl border border-[#E8DFD0]/90 bg-gradient-to-br from-[#FFFCF7] to-[#FAF4EA] p-6 shadow-[0_10px_32px_-12px_rgba(42,36,22,0.1)]">
              <h2 className="text-base font-bold text-[#1E1810]">{t.bookTitle}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#5C5346]/95">{t.bookDesc}</p>
              <Link
                href={`/dashboard/business-tools/what-we-understand?${q}`}
                className="mt-4 inline-flex min-h-11 items-center rounded-2xl border border-[#E8DFD0] bg-white px-4 text-sm font-semibold text-[#2C2416] shadow-sm hover:bg-[#FAF7F2]"
              >
                {t.bookCta}
              </Link>
            </div>
          </div>

          {completeness ? (
            <div className="mt-8 rounded-3xl border border-[#C9B46A]/35 bg-gradient-to-br from-[#FFFCF7] to-[#F3EBDD]/90 p-6 shadow-[0_12px_40px_-14px_rgba(42,36,22,0.12)]">
              <h2 className="text-sm font-bold text-[#1E1810]">{t.completeness}</h2>
              <p className="mt-2 text-3xl font-bold tabular-nums text-[#1E1810]">
                {completeness.score}/{completeness.max}
              </p>
              <p className="mt-3 text-sm font-semibold text-[#5C5346]">{t.nextSteps}</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[#3D3428]/95">
                {completeness.recommendations.slice(0, 4).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {t.cards.map((c) => (
              <div
                key={c.h}
                className="rounded-3xl border border-[#E8DFD0]/90 bg-gradient-to-br from-[#FFFCF7] to-[#FAF4EA] p-6 shadow-[0_10px_32px_-12px_rgba(42,36,22,0.1)]"
              >
                <h2 className="text-base font-bold text-[#1E1810]">{c.h}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[#5C5346]/95">{c.p}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/dashboard/perfil?${q}`}
              className="inline-flex rounded-2xl bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-5 py-2.5 text-sm font-semibold text-[#1E1810] shadow-md hover:brightness-[1.03]"
            >
              {t.ctaProfile}
            </Link>
            <a
              href={`mailto:hola@leonix.com?subject=${encodeURIComponent(lang === "es" ? "Leonix Concierge" : "Leonix Concierge")}`}
              className="inline-flex rounded-2xl border border-[#E8DFD0] bg-white px-5 py-2.5 text-sm font-semibold text-[#2C2416] shadow-sm hover:bg-[#FAF7F2]"
            >
              {t.ctaConcierge}
            </a>
          </div>
        </>
      )}
    </LeonixDashboardShell>
  );
}
