"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Navbar from "../components/Navbar";
import { createSupabaseBrowserClient } from "../lib/supabase/browser";

type Lang = "es" | "en";
type Plan = "free" | "pro";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function normalizePlan(raw: unknown): Plan {
  const v = (typeof raw === "string" ? raw : "").toLowerCase().trim();
  // LOCKED: Plans are Free + LEONIX Pro only.
  // If legacy metadata contains other tiers, we treat them as Pro to avoid confusing users.
  if (v.includes("pro") || v.includes("business") || v.includes("lite") || v.includes("premium")) return "pro";
  return "free";
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function parseIsoMaybe(v: unknown): Date | null {
  if (!v) return null;
  const d = new Date(String(v));
  return Number.isFinite(d.getTime()) ? d : null;
}

function daysBetween(a: Date, b: Date) {
  const ms = b.getTime() - a.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}


export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname() ?? "/dashboard";

  const urlLang = searchParams?.get("lang");
  const lang: Lang = urlLang === "en" ? "en" : "es";

  const membershipHref = `/clasificados/membresias?lang=${lang}`;


  const t = useMemo(
    () => ({
      es: {
        title: "Mi cuenta",
        subtitle: "Administra tu perfil y tus anuncios.",
        overview: "Resumen",
        profile: "Perfil",
        myListings: "Mis anuncios",
        plan: "Plan",
        quickActions: "Acciones rápidas",
        postAd: "Publicar anuncio",
        viewListings: "Ver mis anuncios",
        upgradeTitle: "Desbloquea más con LEONIX Pro",
        upgradeBody:
          "Publica más, sube más fotos, ordena tu media y desbloquea LEONIX AI Insights. Pro: $24.99/mes.",
        free: "Gratis",
        pro: "LEONIX Pro",
        business: "Business",
        activeListings: "Anuncios activos",
        of: "de",
        profileCompletion: "Perfil completado",
        completeProfile: "Completar perfil",
        aiInsights: "LEONIX AI Insights",
        visibilityAssist: "Asistente de visibilidad",
        aiTeaser: "Disponible en Pro",
        aiTeaserBody:
          "Sugerencias inteligentes para mejorar tu anuncio (título, precio, fotos) y aumentar visitas.",
        proUnlocked: "Desbloqueado",
        basicAnalytics: "Analíticas",
        views: "Vistas",
        saves: "Guardados",
        verifiedTitle: "Vendedor verificado",
        verifiedSubtitle: "Gánate una insignia por confianza (no se compra).",
        verifiedDisclaimer: "La verificación ayuda a reducir fraude, pero no garantiza resultados.",
        verifiedEligible: "Elegible",
        verifiedActive: "Verificado",
        checkEmail: "Email confirmado",
        checkPhone: "Teléfono confirmado",
        checkAge: "Antigüedad de cuenta",
        checkProfile: "Perfil completado",
        checkViolations: "Sin infracciones",
        comingSoon: "Próximamente",
      },
      en: {
        title: "My account",
        subtitle: "Manage your profile and your listings.",
        overview: "Overview",
        profile: "Profile",
        myListings: "My listings",
        plan: "Plan",
        quickActions: "Quick actions",
        postAd: "Post an ad",
        viewListings: "View my listings",
        upgradeTitle: "Unlock more with LEONIX Pro",
        upgradeBody:
          "Post more, upload more photos, reorder media, and unlock LEONIX AI Insights.",
        free: "Free",
        pro: "LEONIX Pro",
        business: "Business",
        activeListings: "Active listings",
        of: "of",
        profileCompletion: "Profile completion",
        completeProfile: "Complete profile",
        aiInsights: "LEONIX AI Insights",
        visibilityAssist: "Visibility Assist",
        aiTeaser: "Available on Pro",
        aiTeaserBody:
          "Smart suggestions to improve your listing (title, price, photos) and increase views.",
        proUnlocked: "Unlocked",
        basicAnalytics: "Analytics",
        views: "Views",
        saves: "Saves",
        verifiedTitle: "Verified seller",
        verifiedSubtitle: "Earn a trust badge (not for sale).",
        verifiedDisclaimer: "Verification helps reduce fraud, but it doesn’t guarantee outcomes.",
        verifiedEligible: "Eligible",
        verifiedActive: "Verified",
        checkEmail: "Email confirmed",
        checkPhone: "Phone confirmed",
        checkAge: "Account age",
        checkProfile: "Profile completion",
        checkViolations: "No violations",
        comingSoon: "Coming soon",
      },
    }),
    []
  );

  const L = t[lang];

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan>("free");
  const [listingsCount, setListingsCount] = useState<number | null>(null);

  // Garage Mode (Free-only, En Venta only) status for dashboard guidance.
  const [enVentaActiveCount, setEnVentaActiveCount] = useState<number | null>(null);
  const [garageActive, setGarageActive] = useState(false);
  const [garageExpiresAt, setGarageExpiresAt] = useState<string>("");
  const [garageCooldownDaysLeft, setGarageCooldownDaysLeft] = useState<number | null>(null);

  // lightweight profile completion based on known, safe fields
  const [hasPhone, setHasPhone] = useState(false);
  const [hasCity, setHasCity] = useState(false);

  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [phoneConfirmed, setPhoneConfirmed] = useState(false);
  const [accountAgeDays, setAccountAgeDays] = useState<number | null>(null);
  const [verifiedSeller, setVerifiedSeller] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let mounted = true;

    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;

      if (!data.user) {
        const redirect = encodeURIComponent(`${pathname}${window.location.search || ""}`);
        router.replace(`/login?redirect=${redirect}`);
        return;
      }

      const u = data.user;

      const inferred =
        u.user_metadata?.plan ?? u.app_metadata?.plan ?? u.user_metadata?.role;
      const inferredPlan = normalizePlan(inferred);

      setEmail(u.email ?? null);
      setName(
        (u.user_metadata?.full_name as string | undefined) ||
          (u.user_metadata?.name as string | undefined) ||
          null
      );
      setHasPhone(Boolean(u.user_metadata?.phone));
      setHasCity(Boolean(u.user_metadata?.city || u.user_metadata?.location));
      setPlan(inferredPlan);

      // Garage Mode status (stored in user_metadata.garage_mode_en_venta)
      const gm = (u.user_metadata as any)?.garage_mode_en_venta || null;
      const lastUsed = gm && (gm.lastUsedAt || gm.last_used_at || gm.last_used) ? String(gm.lastUsedAt || gm.last_used_at || gm.last_used) : "";
      const expires = gm && (gm.expiresAt || gm.expires_at || gm.expires) ? String(gm.expiresAt || gm.expires_at || gm.expires) : "";
      setGarageExpiresAt(expires);
      const expD = parseIsoMaybe(expires);
      setGarageActive(Boolean(expD && expD.getTime() > Date.now()));

      const lastD = parseIsoMaybe(lastUsed);
      if (lastD) {
        const now = new Date();
        const left = Math.max(0, 30 - daysBetween(lastD, now));
        setGarageCooldownDaysLeft(left);
      } else {
        setGarageCooldownDaysLeft(null);
      }

      setEmailConfirmed(Boolean((u as any).email_confirmed_at));
      setPhoneConfirmed(Boolean((u as any).phone_confirmed_at));
      setAccountAgeDays(u.created_at ? Math.max(0, Math.floor((Date.now() - new Date(u.created_at).getTime()) / 86400000)) : null);
      setVerifiedSeller(Boolean((u.user_metadata as any)?.verified_seller || (u.user_metadata as any)?.verifiedSeller || (u.user_metadata as any)?.verified === true));

      // Try profiles table (role-ready). If missing, keep inferred plan.
      try {
        const { data: pData, error: pErr } = await supabase
          .from("profiles")
          .select("plan, role, phone, city")
          .eq("id", u.id)
          .maybeSingle();

        if (!pErr && pData) {
          setPlan(normalizePlan((pData as any).plan ?? (pData as any).role ?? inferred));
          setHasPhone(Boolean((pData as any).phone) || Boolean(u.user_metadata?.phone));
          setHasCity(Boolean((pData as any).city) || Boolean(u.user_metadata?.city || u.user_metadata?.location));
        }
      } catch {
        // ignore
      }

      // Count listings (safe, used for dashboard summary)
      try {
        const { count } = await supabase
          .from("listings")
          .select("id", { count: "exact", head: true })
          .eq("user_id", u.id);

        if (mounted) setListingsCount(typeof count === "number" ? count : null);
      } catch {
        if (mounted) setListingsCount(null);
      }

      // En Venta active count (used for Garage Mode guidance). Safe fallbacks if schema differs.
      try {
        const base = supabase.from("listings").select("id", { count: "exact", head: true }).eq("category", "en-venta");
        let r = await base.eq("user_id", u.id).eq("status", "active");
        if (r.error) {
          const msg = String(r.error.message || "");
          if (/status/i.test(msg) && /(does not exist|unknown|column)/i.test(msg)) {
            r = await base.eq("user_id", u.id);
          }
        }
        if (!r.error && mounted) setEnVentaActiveCount(typeof r.count === "number" ? r.count : 0);
        if (r.error && mounted) setEnVentaActiveCount(null);
      } catch {
        if (mounted) setEnVentaActiveCount(null);
      }

      if (mounted) setLoading(false);
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [router, pathname]);

  const planLabel = plan === "pro" ? L.pro : L.free;

  const maxActive = plan === "pro" ? 5 : 2;
  const active = typeof listingsCount === "number" ? listingsCount : 0;

  const completionParts = [
    { key: "name", ok: Boolean(name), label: lang === "es" ? "Nombre" : "Name" },
    { key: "email", ok: Boolean(email), label: lang === "es" ? "Email" : "Email" },
    { key: "phone", ok: hasPhone, label: lang === "es" ? "Teléfono" : "Phone" },
    { key: "city", ok: hasCity, label: lang === "es" ? "Ciudad" : "City" },
  ];
  const completionOk = completionParts.filter((p) => p.ok).length;
  const completionPct = clamp(Math.round((completionOk / completionParts.length) * 100), 0, 100);


  const minAgeDays = 14;
  const checkEmailOk = emailConfirmed;
  const checkPhoneOk = phoneConfirmed;
  const checkAgeOk = typeof accountAgeDays === "number" ? accountAgeDays >= minAgeDays : false;
  const checkProfileOk = completionPct >= 75;
  // Violations system is Phase 2. We don't auto-verify based on unknown data.
  const checkViolationsOk = false;

  const eligible =
    checkEmailOk && checkPhoneOk && checkAgeOk && checkProfileOk;


  const nav = [
    { href: `/dashboard?lang=${lang}`, label: L.overview, active: true },
    { href: `/dashboard/perfil?lang=${lang}`, label: L.profile, active: false },
    { href: `/dashboard/mis-anuncios?lang=${lang}`, label: L.myListings, active: false },
  ];

  const isPro = plan === "pro";

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 pt-28 pb-16">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-semibold text-yellow-400">{L.title}</h1>
          <p className="mt-2 text-gray-300">{L.subtitle}</p>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          <aside className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-white/80">{L.plan}</div>
              <span className={cx(
                "inline-flex items-center rounded-full px-3 py-1 text-xs",
                plan === "pro"
                  ? "border border-yellow-500/30 bg-yellow-500/10 text-yellow-200"
                  : "border border-white/10 bg-black/30 text-white/80"
              )}>
                {planLabel}
              </span>
            </div>

            <nav className="mt-4 space-y-1">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cx(
                    "block rounded-xl px-3 py-2 text-sm transition",
                    item.active ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-sm font-medium text-white">{name || "—"}</div>
              <div className="mt-1 text-xs text-white/70">{email || "—"}</div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between">
                <div className="text-xs text-white/70">{L.profileCompletion}</div>
                <div className="text-xs font-semibold text-white">{completionPct}%</div>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                <div className="h-2 rounded-full bg-yellow-500" style={{ width: `${completionPct}%` }} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {completionParts.map((p) => (
                  <span
                    key={p.key}
                    className={cx(
                      "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px]",
                      p.ok ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200" : "border-white/10 bg-white/5 text-white/70"
                    )}
                  >
                    {p.label}
                  </span>
                ))}
              </div>

              <Link
                href={`/dashboard/perfil?lang=${lang}`}
                className="mt-3 inline-flex text-xs text-yellow-300 hover:text-yellow-200"
              >
                {L.completeProfile} →
              </Link>
            </div>
          </aside>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            {loading ? (
              <div className="text-white/70">Loading…</div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <div className="text-xl font-semibold text-white">{L.overview}</div>
                    <div className="mt-1 text-sm text-white/70">{email ?? ""}</div>
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <Link
                      href={`/clasificados/publicar?lang=${lang}`}
                      className="inline-flex items-center justify-center rounded-full bg-yellow-500 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-400 transition"
                    >
                      {L.postAd}
                    </Link>
                    <Link
                      href={`/dashboard/mis-anuncios?lang=${lang}`}
                      className="inline-flex items-center justify-center rounded-full border border-white/15 bg-black/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
                    >
                      {L.viewListings}
                    </Link>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                    <div className="text-xs text-white/70">{L.plan}</div>
                    <div className="mt-2 text-lg font-semibold text-white">{planLabel}</div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                    <div className="text-xs text-white/70">{L.activeListings}</div>
                    <div className="mt-2 text-lg font-semibold text-white">
                      {active} {L.of} {maxActive}
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-yellow-500"
                        style={{ width: `${clamp(Math.round((active / maxActive) * 100), 0, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                    <div className="text-xs text-white/70">{L.basicAnalytics}</div>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                        <div className="text-[11px] text-white/70">{L.views}</div>
                        <div className="mt-1 text-sm font-semibold text-white">—</div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                        <div className="text-[11px] text-white/70">{L.saves}</div>
                        <div className="mt-1 text-sm font-semibold text-white">—</div>
                      </div>
                    </div>
                    <div className="mt-2 text-[11px] text-white/60">
                      {lang === "es"
                        ? "Más métricas se activan en Pro."
                        : "More metrics unlock on Pro."}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
                    <div className="flex items-center justify-between">
                      <div className="text-base font-semibold text-white">{L.visibilityAssist}</div>
                      <span className={cx(
                        "text-xs rounded-full border px-3 py-1",
                        isPro ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-200" : "border-white/10 bg-white/5 text-white/70"
                      )}>
                        {isPro ? L.proUnlocked : L.aiTeaser}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-white/70">
                      {isPro
                        ? (lang === "es"
                            ? "Recomendaciones para mejorar visibilidad: fotos, título y precio."
                            : "Recommendations to improve visibility: photos, title, and price.")
                        : L.aiTeaserBody}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
                    <div className="flex items-center justify-between">
                      <div className="text-base font-semibold text-white">{L.aiInsights}</div>
                      <span className={cx(
                        "text-xs rounded-full border px-3 py-1",
                        isPro ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-200" : "border-white/10 bg-white/5 text-white/70"
                      )}>
                        {isPro ? L.proUnlocked : L.aiTeaser}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-white/70">
                      {isPro
                        ? (lang === "es"
                            ? "Insights privados sobre rendimiento y calidad del anuncio (sin mostrar AI al público)."
                            : "Private insights on listing quality and performance (AI stays invisible publicly).")
                        : L.aiTeaserBody}
                    </p>
    
                {!isPro && (
                  <div className="mt-6 rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-6">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <div className="text-base font-semibold text-white">
                          {lang === "es" ? "Modo Garaje (En Venta)" : "Garage Mode (For Sale)"}
                        </div>
                        <p className="mt-2 text-sm text-white/70">
                          {lang === "es"
                            ? "Cuando llegas al límite de anuncios Gratis en En Venta, puedes desbloquear +4 anuncios por 7 días (una vez cada 30 días)."
                            : "When you hit the Free limit in For Sale, you can unlock +4 listings for 7 days (once every 30 days)."}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-white/60">
                          {typeof enVentaActiveCount === "number"
                            ? (lang === "es"
                                ? `Activos En Venta: ${enVentaActiveCount} / ${2 + (garageActive ? 4 : 0)}`
                                : `For Sale active: ${enVentaActiveCount} / ${2 + (garageActive ? 4 : 0)}`)
                            : (lang === "es" ? "Activos En Venta: —" : "For Sale active: —")}
                        </div>

                        {garageActive && garageExpiresAt && (
                          <div className="mt-2 text-xs text-emerald-200">
                            {lang === "es"
                              ? `Activo hasta ${new Date(garageExpiresAt).toLocaleDateString("es-US")}`
                              : `Active until ${new Date(garageExpiresAt).toLocaleDateString("en-US")}`}
                          </div>
                        )}

                        {!garageActive && typeof garageCooldownDaysLeft === "number" && garageCooldownDaysLeft > 0 && (
                          <div className="mt-2 text-xs text-white/60">
                            {lang === "es"
                              ? `Disponible de nuevo en ${garageCooldownDaysLeft} día(s)`
                              : `Available again in ${garageCooldownDaysLeft} day(s)`}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link
                        href={`/clasificados/publicar?lang=${lang}&categoria=en-venta`}
                        className="inline-flex items-center justify-center rounded-full border border-emerald-400/25 bg-black/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
                      >
                        {lang === "es" ? "Publicar en En Venta" : "Post in For Sale"}
                      </Link>
                      <Link
                        href={membershipHref}
                        className="inline-flex items-center justify-center rounded-full bg-yellow-500 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-400 transition"
                      >
                        {lang === "es" ? "Mejorar a Pro" : "Upgrade to Pro"}
                      </Link>
                    </div>
                  </div>
                )}

                {!isPro && (
                      <div className="mt-4">
                        <Link
                          href={membershipHref}
                          className="inline-flex items-center rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-xs font-semibold text-yellow-200 hover:bg-yellow-500/15 transition"
                        >
                          {lang === "es" ? "Ver LEONIX Pro ($24.99/mes)" : "View LEONIX Pro ($24.99/mo)"}
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {!isPro && (
                  <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-6">
                    <div className="text-base font-semibold text-white">{L.upgradeTitle}</div>
                    <p className="mt-2 text-sm text-white/70">{L.upgradeBody}</p>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link
                        href={membershipHref}
                        className="inline-flex items-center justify-center rounded-full bg-yellow-500 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-400 transition"
                      >
                        {lang === "es" ? "Ver LEONIX Pro ($24.99/mes)" : "View LEONIX Pro ($24.99/mo)"}
                      </Link>
                      <Link
                        href={`/clasificados/lista?lang=${lang}`}
                        className="inline-flex items-center justify-center rounded-full border border-white/15 bg-black/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
                      >
                        {lang === "es" ? "Seguir explorando" : "Keep browsing"}
                      </Link>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
