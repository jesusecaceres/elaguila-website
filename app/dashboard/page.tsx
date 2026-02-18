"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Navbar from "../components/Navbar";
import { createSupabaseBrowserClient } from "../lib/supabase/browser";

type Lang = "es" | "en";
type Plan = "free" | "pro" | "business";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function normalizePlan(raw: unknown): Plan {
  const v = (typeof raw === "string" ? raw : "").toLowerCase().trim();
  if (v === "pro") return "pro";
  if (v === "business" || v === "lite" || v === "premium") return "business";
  return "free";
}

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname() ?? "/dashboard";

  const urlLang = searchParams?.get("lang");
  const lang: Lang = urlLang === "en" ? "en" : "es";

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
          "Muy pronto podrás mejorar tu plan para publicar más, ver estadísticas y acceder a herramientas avanzadas.",
        free: "Gratis",
        pro: "LEONIX Pro",
        business: "Business",
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
          "Coming soon: upgrade to post more, see stats, and access advanced tools.",
        free: "Free",
        pro: "LEONIX Pro",
        business: "Business",
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

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let mounted = true;

    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;

      if (!data.user) {
        const redirect = encodeURIComponent(
          `${pathname}${window.location.search || ""}`
        );
        router.replace(`/login?redirect=${redirect}`);
        return;
      }

      const u = data.user;
      setEmail(u.email ?? null);
      setName(
        (u.user_metadata?.full_name as string | undefined) ||
          (u.user_metadata?.name as string | undefined) ||
          null
      );

      const inferred =
        u.user_metadata?.plan ?? u.app_metadata?.plan ?? u.user_metadata?.role;
      setPlan(normalizePlan(inferred));


// Try profiles table (role-ready). If missing, we keep inferred plan.
try {
  const { data: pData, error: pErr } = await supabase
    .from("profiles")
    .select("plan, role")
    .eq("id", u.id)
    .maybeSingle();

  if (!pErr && pData) {
    setPlan(normalizePlan((pData as any).plan ?? (pData as any).role ?? inferred));
  }
} catch {
  // ignore
}

      // Count listings (safe, used for dashboard summary)
      const { count } = await supabase
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("user_id", u.id);

      setListingsCount(typeof count === "number" ? count : null);

      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [router, pathname]);

  const planLabel =
    plan === "pro" ? L.pro : plan === "business" ? L.business : L.free;

  const nav = [
    { href: `/dashboard?lang=${lang}`, label: L.overview, active: true },
    { href: `/dashboard/perfil?lang=${lang}`, label: L.profile, active: false },
    { href: `/dashboard/mis-anuncios?lang=${lang}`, label: L.myListings, active: false },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 pt-28 pb-16">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-semibold text-yellow-400">
            {L.title}
          </h1>
          <p className="mt-2 text-gray-300">{L.subtitle}</p>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          <aside className="rounded-2xl border border-yellow-600/20 bg-black/40 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-white/80">{L.plan}</div>
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
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

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-medium text-white">{name || "—"}</div>
              <div className="mt-1 text-xs text-white/70">{email || "—"}</div>
            </div>
          </aside>

          <section className="rounded-2xl border border-yellow-600/20 bg-black/40 p-6">
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
                      className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
                    >
                      {L.viewListings}
                    </Link>
                  </div>
                </div>


                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                    <div className="text-xs text-white/70">{L.plan}</div>
                    <div className="mt-2 text-lg font-semibold text-white">{planLabel}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                    <div className="text-xs text-white/70">{L.myListings}</div>
                    <div className="mt-2 text-lg font-semibold text-white">
                      {typeof listingsCount === "number" ? listingsCount : "—"}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                    <div className="text-xs text-white/70">{L.quickActions}</div>
                    <div className="mt-2 text-sm text-white/80">
                      {lang === "es" ? "Publica o administra tus anuncios." : "Post or manage your listings."}
                    </div>
                  </div>
                </div>

                <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="text-base font-semibold text-white">{L.upgradeTitle}</div>
                  <p className="mt-2 text-sm text-white/70">{L.upgradeBody}</p>
                  <div className="mt-4 inline-flex items-center rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs text-white/70">
                    {lang === "es" ? "Pagos no activados en esta fase." : "Payments not enabled in this phase."}
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
