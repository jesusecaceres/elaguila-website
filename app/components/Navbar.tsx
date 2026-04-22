"use client";

import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, Suspense, useCallback } from "react";
import { createSupabaseBrowserClient, withAuthTimeout, AUTH_CHECK_TIMEOUT_MS } from "../lib/supabase/browser";

type Lang = "es" | "en";

type MembershipBadge = "free" | "pro";

function normalizeMembershipTier(raw: unknown): MembershipBadge {
  const v = (typeof raw === "string" ? raw : "").toLowerCase().trim();
  if (v === "pro") return "pro";
  if (v === "business_lite" || v === "business_premium") return "pro";
  return "free";
}

function planLabel(badge: MembershipBadge, lang: Lang) {
  if (badge === "pro") return lang === "es" ? "Pro" : "Pro";
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

function NavbarContent() {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlLang = searchParams?.get("lang");
  const [lang, setLang] = useState<Lang>(urlLang === "en" ? "en" : "es");
  const [mobileOpen, setMobileOpen] = useState(false);

  const [user, setUser] = useState<NavbarUser | null>(null);
  const [membershipBadge, setMembershipBadge] = useState<MembershipBadge>("free");
  const [authLoading, setAuthLoading] = useState(true);
  const [accountOpen, setAccountOpen] = useState(false);

  const signedOutParam = searchParams?.get("signed_out") === "1";
  const [showSignedOutToast, setShowSignedOutToast] = useState(false);
  useEffect(() => {
    if (pathname === "/home" && signedOutParam) {
      setShowSignedOutToast(true);
      const t = setTimeout(() => {
        setShowSignedOutToast(false);
        const next = new URLSearchParams(searchParams?.toString() ?? "");
        next.delete("signed_out");
        const q = next.toString();
        router.replace(q ? `/home?${q}` : "/home");
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [pathname, signedOutParam, router, searchParams]);

  useEffect(() => {
    if (urlLang === "es" || urlLang === "en") setLang(urlLang);
  }, [urlLang]);

  useEffect(() => {
    setMobileOpen(false);
    setAccountOpen(false);
     
  }, [pathname, urlLang, searchParams?.toString()]);

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
        createAccount: "Crear cuenta",
        myAccount: "Mi cuenta",
        myListings: "Mis anuncios",
        signOut: "Cerrar sesión",
        dashboard: "Panel",
        account: "Cuenta",
        manageAccount: "Administrar mi cuenta",
        signedOutToast: "Sesión cerrada correctamente",
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
        createAccount: "Create account",
        myAccount: "My account",
        myListings: "My listings",
        signOut: "Sign out",
        dashboard: "Dashboard",
        account: "Account",
        manageAccount: "Manage account",
        signedOutToast: "Signed out successfully",
      },
    }),
    []
  );

  const L = t[lang];

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

  const switchLang = (target: Lang) => {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    next.set("lang", target);
    const q = next.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
  };

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
    const onPublicar = currentPathWithQuery?.startsWith("/clasificados/publicar");
    if (onPublicar) {
      const redirect = encodeURIComponent(currentPathWithQuery || `/clasificados/publicar?lang=${lang}`);
      router.push(`/login?mode=post&lang=${lang}&redirect=${redirect}`);
    } else {
      router.push(`/login?mode=login&lang=${lang}`);
    }
  }, [currentPathWithQuery, lang, router]);

  useEffect(() => {
    let mounted = true;
    let supabase: ReturnType<typeof createSupabaseBrowserClient> | null = null;
    try {
      supabase = createSupabaseBrowserClient();
    } catch {
      setUser(null);
      setMembershipBadge("free");
      setAuthLoading(false);
      return;
    }

    async function loadSession() {
      try {
        const { data } = await withAuthTimeout(
          supabase!.auth.getUser(),
          AUTH_CHECK_TIMEOUT_MS
        );
        if (!mounted) return;
        const u = data.user;
        if (!u) {
          setUser(null);
          setMembershipBadge("free");
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
          email: u.email ?? null,
          fullName,
          avatarUrl,
        });
        try {
          const { data: pData, error: pErr } = await supabase!
            .from("profiles")
            .select("membership_tier, account_type")
            .eq("id", u.id)
            .maybeSingle();
          if (!pErr && pData) {
            const row = pData as { membership_tier?: string | null; account_type?: string | null };
            setMembershipBadge(normalizeMembershipTier(row.membership_tier ?? row.account_type));
          } else {
            setMembershipBadge("free");
          }
        } catch {
          setMembershipBadge("free");
        }
        setAuthLoading(false);
      } catch {
        if (!mounted) return;
        setUser(null);
        setMembershipBadge("free");
        setAuthLoading(false);
      }
    }

    loadSession();

    const { data: sub } = supabase!.auth.onAuthStateChange(() => {
      void loadSession();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    const { clearAllClassifiedsDrafts } = await import("@/app/clasificados/lib/classifiedsDraftStorage");
    clearAllClassifiedsDrafts({ userId: user?.id ?? null });
    setMobileOpen(false);
    setAccountOpen(false);
    try {
      const sb = createSupabaseBrowserClient();
      await sb.auth.signOut();
    } catch (e) {
      console.error("[auth] signOut failed", e);
    } finally {
      setUser(null);
      router.refresh();
      router.replace(`/home?lang=${lang}&signed_out=1`);
    }
  }, [router, lang, user?.id]);

  const accountLabel = user?.fullName || user?.email || "User";
  const initials = getInitials(user?.fullName || user?.email);
  const displayName =
    user?.fullName?.trim() ||
    (user?.email ? user.email.split("@")[0] : null) ||
    L.myAccount;

  const isPreviewSurface =
    pathname.endsWith("/preview") ||
    pathname.includes("/preview/");
  const isServiciosPublicProfile =
    pathname.startsWith("/servicios/perfil");
  if (pathname === "/" || isPreviewSurface || isServiciosPublicProfile) return null;

  return (
    <nav className="fixed top-0 left-0 w-full z-50" data-navbar-root>
      {showSignedOutToast && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[1000] rounded-xl bg-green-600/95 text-white px-4 py-2.5 text-sm font-medium shadow-lg border border-green-500/30"
          role="status"
        >
          {L.signedOutToast}
        </div>
      )}

      <div
        className="
          backdrop-blur-md bg-[color:var(--lx-nav-bg)]
          border-b border-[color:var(--lx-nav-border)] py-2 px-4 sm:px-6
          flex flex-wrap items-center gap-x-4 gap-y-2
        "
      >
        {/* DESKTOP MENU */}
        <div className="hidden sm:flex flex-wrap gap-x-4 gap-y-2 text-[color:var(--lx-nav-fg)] text-[clamp(12px,1.05vw,15px)] font-semibold tracking-tight">
          {navLinks.map((item, i) => {
            const active = isActive(item.href);
            const href = item.href === "/advertise" ? `/login?mode=post&lang=${lang}&redirect=${encodeURIComponent(`/clasificados/publicar/en-venta?lang=${lang}`)}` : buildLink(item.href);
            return (
              <Link
                key={i}
                href={href}
                className={cx(
                  "transition px-2 py-1 rounded-lg border border-transparent hover:bg-[color:var(--lx-nav-hover)] hover:border-[color:var(--lx-nav-border)]",
                  item.gold
                    ? "text-[color:var(--lx-text)] font-bold bg-[color:var(--lx-nav-active)] border-[color:var(--lx-nav-border)]"
                    : active
                    ? "text-[color:var(--lx-nav-fg)] bg-[color:var(--lx-nav-active)] border-[color:var(--lx-nav-border)]"
                    : "text-[color:var(--lx-nav-fg-muted)] hover:text-[color:var(--lx-nav-fg)]"
                )}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* RIGHT SIDE (LANG + ACCOUNT) */}
        <div className="hidden sm:flex items-center gap-3 ml-auto text-[clamp(11px,0.95vw,13px)]">
          <div className="flex gap-3 items-center">
            <button
              onClick={() => switchLang("es")}
              className={
                lang === "es"
                  ? "text-[color:var(--lx-gold)] font-semibold"
                  : "text-[color:var(--lx-nav-fg-muted)] hover:text-[color:var(--lx-nav-fg)] transition"
              }
              aria-label="Cambiar idioma a Español"
            >
              ES
            </button>
            <span className="text-[color:var(--lx-nav-fg-subtle)]">|</span>
            <button
              onClick={() => switchLang("en")}
              className={
                lang === "en"
                  ? "text-[color:var(--lx-gold)] font-semibold"
                  : "text-[color:var(--lx-nav-fg-muted)] hover:text-[color:var(--lx-nav-fg)] transition"
              }
              aria-label="Switch language to English"
            >
              EN
            </button>
          </div>

          {/* DESKTOP ACCOUNT */}
          <div className="relative">
            {authLoading ? (
              <div className="h-9 w-24 rounded-full bg-black/5 animate-pulse" />
            ) : user ? (
              <>
                <button
                  onClick={() => setAccountOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full border border-[color:var(--lx-nav-border)] bg-white/60 px-3 py-1.5 hover:bg-white/80 transition"
                  aria-label={L.myAccount}
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt=""
                      className="h-7 w-7 rounded-full border border-[color:var(--lx-nav-border)] object-cover"
                    />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-[color:var(--lx-nav-active)] border border-[color:var(--lx-nav-border)] flex items-center justify-center text-[color:var(--lx-text)] font-bold text-xs">
                      {initials}
                    </div>
                  )}
                  <span className="text-[color:var(--lx-text)] text-xs max-w-[140px] truncate">
                    {accountLabel}
                  </span>
                  <span className="hidden sm:inline-flex items-center rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-nav-hover)] px-2 py-0.5 text-[10px] text-[color:var(--lx-text)]">
                    {planLabel(membershipBadge, lang)}
                  </span>
                  <span className="text-[color:var(--lx-nav-fg-muted)] text-xs">{accountOpen ? "▲" : "▼"}</span>
                </button>

                {accountOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] backdrop-blur-xl shadow-[0_18px_48px_rgba(42,36,22,0.18)] overflow-hidden"
                    role="menu"
                  >
                    <div className="px-4 py-3 border-b border-black/10">
                      <div className="text-xs text-[color:var(--lx-text)] truncate font-medium">
                        {displayName}
                      </div>
                      {user.email && (
                        <div className="text-xs text-[color:var(--lx-text-2)]/80 truncate mt-0.5">
                          {user.email}
                        </div>
                      )}
                      <div className="mt-1.5 inline-flex items-center rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-nav-hover)] px-2 py-0.5 text-[10px] text-[color:var(--lx-text)]">
                        {planLabel(membershipBadge, lang)}
                      </div>
                    </div>
                    <Link
                      href={`/dashboard?lang=${lang}`}
                      className="block px-4 py-3 text-sm text-[color:var(--lx-text)] hover:bg-black/5"
                      onClick={() => setAccountOpen(false)}
                    >
                      {L.manageAccount}
                    </Link>
                    <Link
                      href={`/dashboard/mis-anuncios?lang=${lang}`}
                      className="block px-4 py-3 text-sm text-[color:var(--lx-text)] hover:bg-black/5"
                      onClick={() => setAccountOpen(false)}
                    >
                      {L.myListings}
                    </Link>
                    <button
                      type="button"
                      onClick={signOut}
                      className="w-full text-left px-4 py-3 text-sm text-[color:var(--lx-text)] hover:bg-black/5 border-t border-black/10"
                    >
                      {L.signOut}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={goToLogin}
                className="rounded-full border border-[color:var(--lx-nav-border)] bg-white/60 px-4 py-2 text-[color:var(--lx-text)] hover:bg-white/80 transition"
              >
                {L.signIn}
              </button>
            )}
          </div>
        </div>

        {/* MOBILE HAMBURGER */}
        <button
          className="sm:hidden ml-auto text-[color:var(--lx-nav-fg)] text-xl"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          ☰
        </button>
      </div>

      {/* MOBILE DRAWER — 3 zones: top (title/close), middle (nav links, scrolls), bottom (account + lang) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[999]">
          <button
            className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          />

          <div
            className="absolute top-0 right-0 w-[min(88vw,22rem)] max-w-[100vw] h-[100dvh] max-h-[100dvh] flex flex-col overflow-hidden bg-[color:var(--lx-card)] backdrop-blur-xl rounded-l-2xl shadow-[0_0_22px_rgba(42,36,22,0.28)] border-l border-[color:var(--lx-nav-border)]"
            role="dialog"
            aria-modal="true"
            style={{ height: "100dvh" }}
          >
            {/* ZONE 1: Top — title + close, always visible */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-black/10">
              <span className="text-[color:var(--lx-text-2)]/80 text-sm font-semibold">Menú</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="text-[color:var(--lx-text)] text-2xl leading-none p-2 -m-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close menu"
              >
                ×
              </button>
            </div>

            {/* ZONE 2: Middle — nav links only, primary scroll area */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-3">
              <nav className="flex flex-col gap-1" aria-label="Navegación">
                {navLinks.map((item, i) => (
                  <Link
                    key={i}
                    href={item.href === "/advertise" ? `/login?mode=post&lang=${lang}&redirect=${encodeURIComponent(`/clasificados/publicar/en-venta?lang=${lang}`)}` : buildLink(item.href)}
                    onClick={() => setMobileOpen(false)}
                    className={cx(
                      "py-2.5 text-[15px] font-semibold rounded-xl px-2 transition",
                      item.gold
                        ? "text-[color:var(--lx-text)] bg-[color:var(--lx-nav-active)]"
                        : "text-[color:var(--lx-text)] hover:bg-black/5",
                      isActive(item.href) && !item.gold && "bg-[color:var(--lx-nav-hover)]"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* ZONE 3: Bottom — account card + language, pinned */}
            <div className="flex-shrink-0 flex flex-col gap-3 px-4 py-4 pt-3 border-t border-black/10">
              <section aria-label={L.account} className="rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] p-3">
                {authLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-black/5 flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 w-24 rounded bg-black/5" />
                      <div className="h-3 w-20 rounded bg-black/5" />
                    </div>
                  </div>
                ) : user ? (
                  <>
                    <div className="flex items-center gap-3">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt=""
                          className="h-10 w-10 rounded-full border border-[color:var(--lx-nav-border)] object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-nav-active)] flex items-center justify-center text-[color:var(--lx-text)] font-bold text-sm flex-shrink-0">
                          {initials}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-[color:var(--lx-text)] font-semibold text-sm truncate">
                          {displayName}
                        </div>
                        {user.email && (
                          <div className="text-[color:var(--lx-text-2)]/80 text-xs truncate">
                            {user.email}
                          </div>
                        )}
                        <div className="mt-1 inline-flex items-center rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-nav-hover)] px-2 py-0.5 text-[10px] text-[color:var(--lx-text)] w-fit">
                          {planLabel(membershipBadge, lang)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-col gap-2">
                      <Link
                        href={`/dashboard?lang=${lang}`}
                        onClick={() => setMobileOpen(false)}
                        className="w-full rounded-xl bg-[color:var(--lx-cta-dark)] px-3 py-2.5 text-sm font-semibold text-[color:var(--lx-cta-light)] hover:bg-[color:var(--lx-cta-dark-hover)] transition text-center"
                      >
                        {L.manageAccount}
                      </Link>
                      <Link
                        href={`/dashboard/mis-anuncios?lang=${lang}`}
                        onClick={() => setMobileOpen(false)}
                        className="w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white/60 px-3 py-2 text-sm font-medium text-[color:var(--lx-text)] hover:bg-white/80 transition text-center"
                      >
                        {L.myListings}
                      </Link>
                      <button
                        type="button"
                        onClick={async () => {
                          await signOut();
                        }}
                        className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm text-[color:var(--lx-text-2)] hover:bg-black/5 transition text-center"
                      >
                        {L.signOut}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-semibold text-[color:var(--lx-text)]">
                      {L.account}
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileOpen(false);
                        goToLogin();
                      }}
                      className="w-full rounded-xl bg-[color:var(--lx-cta-dark)] px-3 py-2.5 text-sm font-semibold text-[color:var(--lx-cta-light)] hover:bg-[color:var(--lx-cta-dark-hover)] transition"
                    >
                      {L.signIn}
                    </button>
                    <Link
                      href={`/login?mode=signup&lang=${lang}`}
                      onClick={() => setMobileOpen(false)}
                      className="w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white/60 px-3 py-2.5 text-sm font-medium text-[color:var(--lx-text)] hover:bg-white/80 transition text-center block"
                    >
                      {L.createAccount}
                    </Link>
                  </div>
                )}
              </section>
              <div className="flex gap-6 text-[color:var(--lx-text)] text-sm font-semibold">
                <button
                  onClick={() => {
                    switchLang("es");
                    setMobileOpen(false);
                  }}
                  className={lang === "es" ? "text-[color:var(--lx-gold)]" : "text-[color:var(--lx-nav-fg-muted)]"}
                  aria-label="Cambiar idioma a Español"
                >
                  ES
                </button>
                <button
                  onClick={() => {
                    switchLang("en");
                    setMobileOpen(false);
                  }}
                  className={lang === "en" ? "text-[color:var(--lx-gold)]" : "text-[color:var(--lx-nav-fg-muted)]"}
                  aria-label="Switch language to English"
                >
                  EN
                </button>
              </div>
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
