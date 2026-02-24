"use client";

import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, Suspense, useCallback } from "react";
import { createSupabaseBrowserClient } from "../lib/supabase/browser";

type Lang = "es" | "en";

type Plan = "free" | "pro";

function normalizePlan(raw: unknown): Plan {
  const v = (typeof raw === "string" ? raw : "").toLowerCase().trim();
  if (v === "pro") return "pro";
  // LOCKED: only Free + LEONIX Pro exist publicly.
  // Legacy tiers map to Pro for backward compatibility.
  if (v === "business" || v === "lite" || v === "premium") return "pro";
  return "free";
}

function planLabel(plan: Plan, lang: Lang) {
  if (plan === "pro") return lang === "es" ? "Pro" : "Pro";
  return lang === "es" ? "Gratis" : "Free";
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type NavbarUser = {
  id: string;
  email?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
};

function getInitials(input?: string | null) {
  const s = (input ?? "").trim();
  if (!s) return "U";
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function safeInternalRedirect(raw: string | null | undefined) {
  const v = (raw ?? "").trim();
  if (!v) return "";
  // Only allow internal paths
  if (v.startsWith("/")) return v;
  return "";
}

function NavbarContent() {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlLang = searchParams?.get("lang");
  const [lang, setLang] = useState<Lang>(urlLang === "en" ? "en" : "es");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileAccountOpen, setMobileAccountOpen] = useState(false);

  // Auth UI state
  const [user, setUser] = useState<NavbarUser | null>(null);
  const [plan, setPlan] = useState<Plan>("free");
  const [authLoading, setAuthLoading] = useState(true);
  const [accountOpen, setAccountOpen] = useState(false);

  // Hide navbar on cinematic intro
  if (pathname === "/") return null;

  useEffect(() => {
    if (urlLang === "es" || urlLang === "en") setLang(urlLang);
  }, [urlLang]);

  // Close drawers on route changes
  useEffect(() => {
    setMobileOpen(false);
    setAccountOpen(false);
    setMobileAccountOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, urlLang, searchParams?.toString()]);

  // Prevent body scroll behind mobile drawer
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const t = useMemo(
    () => ({
      es: {
        home: "Inicio",
        magazine: "Revista",
        classifieds: "Clasificados",
        coupons: "Cupones",
        shop: "Tienda",
        news: "Noticias",
        contact: "Contacto",
        about: "Nosotros",
        churches: "Iglesias",
        advertise: "Anúnciate",
        signIn: "Iniciar sesión",
        myAccount: "Mi cuenta",
        myListings: "Mis anuncios",
        signOut: "Cerrar sesión",
        dashboard: "Panel",
      },
      en: {
        home: "Home",
        magazine: "Magazine",
        classifieds: "Classifieds",
        coupons: "Coupons",
        shop: "Shop",
        news: "News",
        contact: "Contact",
        about: "About Us",
        churches: "Churches",
        advertise: "Advertise",
        signIn: "Sign in",
        myAccount: "My account",
        myListings: "My listings",
        signOut: "Sign out",
        dashboard: "Dashboard",
      },
    }),
    []
  );

  const L = t[lang];

  // Inicio/Home → always goes to /home?lang={}
  const buildLink = (href: string) => {
    if (href === "/") return `/home?lang=${lang}`;
    const cleanHref = href.split("?")[0];
    return `${cleanHref}?lang=${lang}`;
  };

  const isActive = (href: string) => {
    const cleanHref = href.split("?")[0];
    if (cleanHref === "/") return pathname === "/home";
    return pathname === cleanHref || pathname.startsWith(`${cleanHref}/`);
  };

  // Preserve current query params, only switch lang.
  const switchLang = (target: Lang) => {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    next.set("lang", target);
    const q = next.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
  };

  // NAV ORDER (LOCKED)
  const navLinks: Array<{ href: string; label: string; gold?: boolean }> = [
    { href: "/", label: L.home },
    { href: "/magazine", label: L.magazine },
    { href: "/clasificados", label: L.classifieds },
    { href: "/coupons", label: L.coupons },
    { href: "/tienda", label: L.shop },
    { href: "/noticias", label: L.news },
    { href: "/contacto", label: L.contact },
    { href: "/about", label: L.about },
    { href: "/iglesias", label: L.churches },
    { href: "/advertise", label: L.advertise, gold: true },
  ];

  const currentPathWithQuery = useMemo(() => {
    const q = searchParams?.toString() ?? "";
    return q ? `${pathname}?${q}` : pathname;
  }, [pathname, searchParams]);

  const goToLogin = useCallback(() => {
    const redirect = encodeURIComponent(currentPathWithQuery || `/home?lang=${lang}`);
    router.push(`/login?redirect=${redirect}`);
  }, [currentPathWithQuery, lang, router]);

  // Load + subscribe to auth state
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    let mounted = true;

    async function load() {
      try {
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;

        const u = data.user;
        if (!u) {
          setUser(null);
          setPlan("free");
          setAuthLoading(false);
          return;
        }

        const fullName =
          (u.user_metadata?.full_name as string | undefined) ||
          (u.user_metadata?.name as string | undefined) ||
          null;

        const avatarUrl =
          (u.user_metadata?.avatar_url as string | undefined) ||
          (u.user_metadata?.picture as string | undefined) ||
          null;

        setUser({
          id: u.id,
          email: u.email,
          fullName,
          avatarUrl,
        });
        setAuthLoading(false);
// Plan badge (role-ready). We try profiles.plan / profiles.role if table exists.
try {
  const { data: pData, error: pErr } = await supabase
    .from("profiles")
    .select("plan, role")
    .eq("id", u.id)
    .maybeSingle();

  if (!pErr && pData) {
    setPlan(normalizePlan((pData as any).plan ?? (pData as any).role));
  } else {
    setPlan("free");
  }
} catch {
  setPlan("free");
}

      } catch {
        if (!mounted) return;
        setUser(null);
        setPlan("free");
        setAuthLoading(false);
      }
    }

    load();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setAccountOpen(false);
    setUser(null);
    router.refresh();
  }, [router]);

  const accountLabel = user?.fullName || user?.email || "User";
  const initials = getInitials(user?.fullName || user?.email);

  return (
    <nav className="fixed top-0 left-0 w-full z-50">
      <div
        className="
          backdrop-blur-md bg-black/40
          border-b border-white/10 py-2 px-4 sm:px-6
          flex justify-center items-center
        "
      >
        {/* DESKTOP MENU */}
        <div className="hidden md:flex gap-7 text-white text-sm font-medium tracking-tight">
          {navLinks.map((item, i) => {
            const active = isActive(item.href);
            return (
              <Link
                key={i}
                href={buildLink(item.href)}
                className={cx(
                  "transition",
                  item.gold
                    ? "text-yellow-300 font-bold"
                    : active
                    ? "text-yellow-200"
                    : "text-white hover:text-yellow-200"
                )}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* RIGHT SIDE (LANG + ACCOUNT) */}
        <div className="hidden md:flex items-center gap-4 absolute right-6 text-sm">
          {/* LANGUAGE TOGGLE */}
          <div className="flex gap-3 items-center">
            <button
              onClick={() => switchLang("es")}
              className={
                lang === "es" ? "text-yellow-400 font-semibold" : "text-white/70"
              }
              aria-label="Cambiar idioma a Español"
            >
              ES
            </button>
            <span className="text-white/40">|</span>
            <button
              onClick={() => switchLang("en")}
              className={
                lang === "en" ? "text-yellow-400 font-semibold" : "text-white/70"
              }
              aria-label="Switch language to English"
            >
              EN
            </button>
          </div>

          {/* ACCOUNT */}
          <div className="relative">
            {authLoading ? (
              <div className="h-9 w-24 rounded-full bg-white/10 animate-pulse" />
            ) : user ? (
              <>
                <button
                  onClick={() => setAccountOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 hover:bg-black/40 transition"
                  aria-label={L.myAccount}
                >
                  <div className="h-7 w-7 rounded-full bg-yellow-600/20 border border-yellow-500/30 flex items-center justify-center text-yellow-200 font-bold text-xs">
                    {initials}
                  </div>
                  <span className="text-white/90 text-xs max-w-[140px] truncate">
                    {accountLabel}
                  </span>
                  <span className="hidden sm:inline-flex items-center rounded-full border border-yellow-500/20 bg-yellow-600/10 px-2 py-0.5 text-[10px] text-yellow-200/90">
                    {planLabel(plan, lang)}
                  </span>
                  <span className="text-white/60 text-xs">{accountOpen ? "▲" : "▼"}</span>
                </button>

                {accountOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/10 bg-black/90 backdrop-blur-xl shadow-[0_12px_30px_rgba(0,0,0,0.55)] overflow-hidden"
                    role="menu"
                  >

<div className="px-4 py-3 border-b border-white/10">
  <div className="text-xs text-white/80 truncate">{user?.email}</div>
  <div className="mt-1 inline-flex items-center rounded-full border border-yellow-500/20 bg-yellow-600/10 px-2 py-0.5 text-[10px] text-yellow-200/90">
    {planLabel(plan, lang)}
  </div>
</div>

                    <Link
                      href={`/dashboard?lang=${lang}`}
                      className="block px-4 py-3 text-sm text-white/90 hover:bg-white/5"
                      onClick={() => setAccountOpen(false)}
                    >
                      {L.dashboard}
                    </Link>
                    <Link
                      href={`/dashboard/mis-anuncios?lang=${lang}`}
                      className="block px-4 py-3 text-sm text-white/90 hover:bg-white/5"
                      onClick={() => setAccountOpen(false)}
                    >
                      {L.myListings}
                    </Link>
                    <button
                      onClick={signOut}
                      className="w-full text-left px-4 py-3 text-sm text-white/90 hover:bg-white/5"
                    >
                      {L.signOut}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={goToLogin}
                className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-white/90 hover:bg-black/40 transition"
              >
                {L.signIn}
              </button>
            )}
          </div>
        </div>

        {/* MOBILE HAMBURGER */}
        <button
          className="md:hidden text-white text-xl absolute right-6"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          ☰
        </button>
      </div>

      {/* MOBILE OVERLAY + DRAWER */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[999]">
          {/* overlay */}
          <button
            className="absolute inset-0 bg-black/60 backdrop-blur-[1px]"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          />

          {/* drawer */}
          <div
            className="
              absolute top-0 right-0
              min-h-[70vh] w-72 max-w-[85vw]
              bg-black/90 backdrop-blur-xl
              rounded-l-2xl shadow-[0_0_20px_rgba(0,0,0,0.8)]
              p-6 pt-10 flex flex-col gap-6
              border-l border-white/10
            "
            role="dialog"
            aria-modal="true"
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="text-white text-3xl self-end"
              aria-label="Close menu"
            >
              ×
            </button>

            {/* NAV LINKS */}
{navLinks.map((item, i) => (
  <Link
    key={i}
    href={buildLink(item.href)}
    onClick={() => setMobileOpen(false)}
    className={cx(
      "text-base font-semibold",
      item.gold ? "text-yellow-300" : "text-white",
      isActive(item.href) && !item.gold && "text-yellow-200"
    )}
  >
    {item.label}
  </Link>
))}

{/* ACCOUNT (MOBILE) — collapsible so it never pushes nav down */}
<div className="mt-2 rounded-2xl border border-white/10 bg-black/25 overflow-hidden">
  <button
    type="button"
    onClick={() => setMobileAccountOpen((v) => !v)}
    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
    aria-expanded={mobileAccountOpen}
  >
    <div className="text-white/90 font-semibold">
      {lang === "es" ? "Cuenta" : "Account"}
    </div>
    <div className="text-white/70 text-lg">{mobileAccountOpen ? "−" : "+"}</div>
  </button>

  {mobileAccountOpen && (
    <div className="px-4 pb-4">
      {authLoading ? (
        <div className="h-10 rounded-xl bg-white/10 animate-pulse" />
      ) : user ? (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-yellow-600/20 border border-yellow-500/30 flex items-center justify-center text-yellow-200 font-bold">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-white/90 font-semibold truncate">
              {accountLabel}
            </div>
            <div className="text-white/50 text-xs truncate">
              {user.email}
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => {
            setMobileOpen(false);
            goToLogin();
          }}
          className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-white/90 hover:bg-black/50 transition"
        >
          {L.signIn}
        </button>
      )}

      {user && (
        <div className="mt-4 flex flex-col gap-2">
          <Link
            href={`/dashboard?lang=${lang}`}
            className="rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-white/90 hover:bg-black/50 transition"
            onClick={() => setMobileOpen(false)}
          >
            {L.dashboard}
          </Link>
          <Link
            href={`/dashboard/mis-anuncios?lang=${lang}`}
            className="rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-white/90 hover:bg-black/50 transition"
            onClick={() => setMobileOpen(false)}
          >
            {L.myListings}
          </Link>
          <button
            onClick={async () => {
              await signOut();
              setMobileOpen(false);
            }}
            className="rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-white/90 hover:bg-black/50 transition text-left"
          >
            {L.signOut}
          </button>
        </div>
      )}
    </div>
  )}
</div>

{/* LANGUAGE TOGGLE MOBILE */}
            <div className="flex gap-6 pt-6 text-white text-base font-semibold">
              <button
                onClick={() => {
                  switchLang("es");
                  setMobileOpen(false);
                }}
                className={lang === "es" ? "text-yellow-400" : ""}
                aria-label="Cambiar idioma a Español"
              >
                ES
              </button>

              <button
                onClick={() => {
                  switchLang("en");
                  setMobileOpen(false);
                }}
                className={lang === "en" ? "text-yellow-400" : ""}
                aria-label="Switch language to English"
              >
                EN
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={null}>
      <NavbarContent />
    </Suspense>
  );
}
