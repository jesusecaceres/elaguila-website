"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, Suspense, useCallback, useRef } from "react";
import { createSupabaseBrowserClient, withAuthTimeout, AUTH_CHECK_TIMEOUT_MS } from "../lib/supabase/browser";
import {
  PUBLIC_NAV_ADVERTISE,
  PUBLIC_NAV_MAS_ITEMS,
  PUBLIC_NAV_PRIMARY,
  publicNavLabel,
  type PublicNavLang,
} from "../lib/publicNavConfig";

type Lang = PublicNavLang;

function accountBadgeLabel(lang: Lang) {
  return lang === "es" ? "Cuenta" : "Account";
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

const HEADER_LOGO_SRC = "/logo.png";

function NavbarContent() {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlLang = searchParams?.get("lang");
  const [lang, setLang] = useState<Lang>(urlLang === "en" ? "en" : "es");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [masOpen, setMasOpen] = useState(false);
  const masRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<NavbarUser | null>(null);
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
    setMasOpen(false);
  }, [pathname, urlLang, searchParams?.toString()]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!masOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (masRef.current && !masRef.current.contains(e.target as Node)) setMasOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [masOpen]);

  const t = useMemo(
    () => ({
      es: {
        brandName: "Leonix Media",
        mas: "Más",
        navAria: "Navegación principal",
        langAria: "Idioma",
        signIn: "Iniciar sesión",
        createAccount: "Crear cuenta",
        myAccount: "Mi cuenta",
        myListings: "Mis anuncios",
        signOut: "Cerrar sesión",
        account: "Cuenta",
        manageAccount: "Administrar mi cuenta",
        signedOutToast: "Sesión cerrada correctamente",
        openMenu: "Abrir menú",
        closeMenu: "Cerrar menú",
        menu: "Menú",
      },
      en: {
        brandName: "Leonix Media",
        mas: "More",
        navAria: "Main navigation",
        langAria: "Language",
        signIn: "Sign in",
        createAccount: "Create account",
        myAccount: "My account",
        myListings: "My listings",
        signOut: "Sign out",
        account: "Account",
        manageAccount: "Manage account",
        signedOutToast: "Signed out successfully",
        openMenu: "Open menu",
        closeMenu: "Close menu",
        menu: "Menu",
      },
    }),
    []
  );

  const L = t[lang];

  const buildLink = (href: string) => {
    const cleanHref = href.split("?")[0];
    return `${cleanHref}?lang=${lang}`;
  };

  const isActive = (href: string) => {
    const cleanHref = href.split("?")[0];
    if (cleanHref === "/home") return pathname === "/home";
    return pathname === cleanHref || pathname.startsWith(`${cleanHref}/`);
  };

  const masActive = PUBLIC_NAV_MAS_ITEMS.some((item) => isActive(item.href));

  const switchLang = (target: Lang) => {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    next.set("lang", target);
    const q = next.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
  };

  const advertiseHref = `/login?mode=post&lang=${lang}&redirect=${encodeURIComponent(`/clasificados/publicar/en-venta?lang=${lang}`)}`;

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
      setAuthLoading(false);
      return;
    }

    async function loadSession() {
      try {
        const { data } = await withAuthTimeout(supabase!.auth.getUser(), AUTH_CHECK_TIMEOUT_MS);
        if (!mounted) return;
        const u = data.user;
        if (!u) {
          setUser(null);
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
        setAuthLoading(false);
      } catch {
        if (!mounted) return;
        setUser(null);
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

  const isPreviewSurface = pathname.endsWith("/preview") || pathname.includes("/preview/");
  const isServiciosPublicProfile = pathname.startsWith("/servicios/perfil");
  if (pathname === "/" || isPreviewSurface || isServiciosPublicProfile) return null;

  const navLinkClass = (active: boolean) =>
    cx(
      "whitespace-nowrap transition-colors",
      active
        ? "text-[#7A1E2C] underline decoration-[#7A1E2C] decoration-2 underline-offset-[0.3em]"
        : "text-[#3D3428] hover:text-[#7A1E2C]"
    );

  const langToggle = (
    <div
      className="flex rounded-md border border-[#D6C7AD] bg-[#FFFDF7] p-0.5 text-[0.6875rem] font-semibold sm:text-xs"
      role="group"
      aria-label={L.langAria}
    >
      {(["es", "en"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => switchLang(code)}
          aria-pressed={lang === code}
          className={cx(
            "min-h-[1.875rem] min-w-[2.5rem] rounded-sm px-2 py-1 transition-colors sm:min-h-[2rem] sm:min-w-[2.75rem]",
            lang === code ? "bg-[#7A1E2C] text-white" : "text-[#3D3428] hover:bg-[#EDE6D6]"
          )}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );

  const accountControlDesktop = (
    <div className="relative">
      {authLoading ? (
        <div className="h-9 w-20 rounded-md bg-[#D6C7AD]/30 animate-pulse" />
      ) : user ? (
        <>
          <button
            type="button"
            onClick={() => setAccountOpen((v) => !v)}
            className="flex items-center gap-2 rounded-md border border-[#D6C7AD] bg-[#FFFDF7] px-2.5 py-1.5 hover:bg-[#FBF7EF] transition"
            aria-label={L.myAccount}
            aria-expanded={accountOpen}
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt=""
                className="h-7 w-7 rounded-full border border-[#D6C7AD] object-cover"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#D6C7AD] bg-[#EDE6D6] text-xs font-bold text-[#1F241C]">
                {initials}
              </div>
            )}
            <span className="hidden max-w-[120px] truncate text-xs text-[#1F241C] lg:inline">
              {accountLabel}
            </span>
            <span className="text-[#3D3428]/60 text-xs">{accountOpen ? "▲" : "▼"}</span>
          </button>

          {accountOpen && (
            <div
              className="absolute right-0 mt-2 w-56 overflow-hidden rounded-lg border border-[#D6C7AD] bg-[#FFFDF7] shadow-[0_18px_48px_rgba(31,36,28,0.18)]"
              role="menu"
            >
              <div className="border-b border-[#D6C7AD]/60 px-4 py-3">
                <div className="truncate text-xs font-medium text-[#1F241C]">{displayName}</div>
                {user.email && (
                  <div className="mt-0.5 truncate text-xs text-[#3D3428]/75">{user.email}</div>
                )}
              </div>
              <Link
                href={`/dashboard?lang=${lang}`}
                className="block px-4 py-3 text-sm text-[#1F241C] hover:bg-[#FBF7EF]"
                onClick={() => setAccountOpen(false)}
              >
                {L.manageAccount}
              </Link>
              <Link
                href={`/dashboard/mis-anuncios?lang=${lang}`}
                className="block px-4 py-3 text-sm text-[#1F241C] hover:bg-[#FBF7EF]"
                onClick={() => setAccountOpen(false)}
              >
                {L.myListings}
              </Link>
              <button
                type="button"
                onClick={signOut}
                className="w-full border-t border-[#D6C7AD]/60 px-4 py-3 text-left text-sm text-[#3D3428] hover:bg-[#FBF7EF]"
              >
                {L.signOut}
              </button>
            </div>
          )}
        </>
      ) : (
        <button
          type="button"
          onClick={goToLogin}
          className="rounded-md border border-[#D6C7AD] bg-[#FFFDF7] px-3 py-1.5 text-xs font-semibold text-[#1F241C] hover:bg-[#FBF7EF] transition"
        >
          {L.signIn}
        </button>
      )}
    </div>
  );

  const advertiseCta = (
    <Link
      href={advertiseHref}
      className="inline-flex min-h-[2rem] shrink-0 items-center justify-center rounded-md bg-[#7A1E2C] px-3 py-1.5 text-[0.7rem] font-bold text-white shadow-[0_3px_10px_-3px_rgba(122,30,44,0.55)] transition hover:bg-[#5e1721] sm:min-h-[2.125rem] sm:px-3.5 sm:text-xs"
    >
      {publicNavLabel(PUBLIC_NAV_ADVERTISE, lang)}
    </Link>
  );

  return (
    <header className="fixed top-0 left-0 z-50 w-full" data-navbar-root>
      {showSignedOutToast && (
        <div
          className="fixed top-20 left-1/2 z-[1000] -translate-x-1/2 rounded-lg border border-[#2A4536]/30 bg-[#2A4536] px-4 py-2.5 text-sm font-medium text-[#F8F4EA] shadow-lg"
          role="status"
        >
          {L.signedOutToast}
        </div>
      )}

      <div className="border-b border-[#D6C7AD] bg-[#FAF6EE] shadow-[0_1px_0_0_rgba(201,168,74,0.35)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 py-2 lg:gap-x-4">
            {/* Brand */}
            <Link
              href={buildLink("/home")}
              className="flex shrink-0 items-center gap-1.5 sm:gap-2"
              aria-label={L.brandName}
            >
              <span className="inline-flex h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[#120f0c] ring-1 ring-[#C9A84A]/35 sm:h-9 sm:w-9">
                <Image
                  src={HEADER_LOGO_SRC}
                  alt=""
                  width={36}
                  height={36}
                  className="h-full w-full object-cover object-center"
                  priority
                  aria-hidden
                />
              </span>
              <span className="hidden font-serif text-xs font-bold leading-tight text-[#2A4536] sm:inline sm:text-sm">
                {L.brandName}
              </span>
            </Link>

            {/* Desktop nav */}
            <nav
              className="hidden min-w-0 items-center justify-center gap-x-3 text-[0.8125rem] font-medium lg:flex xl:gap-x-4 xl:text-[0.875rem]"
              aria-label={L.navAria}
            >
              {PUBLIC_NAV_PRIMARY.map((item) => (
                <Link
                  key={item.id}
                  href={buildLink(item.href)}
                  className={navLinkClass(isActive(item.href))}
                  aria-current={isActive(item.href) ? "page" : undefined}
                >
                  {publicNavLabel(item, lang)}
                </Link>
              ))}

              <div className="relative" ref={masRef}>
                <button
                  type="button"
                  onClick={() => setMasOpen((v) => !v)}
                  className={cx(navLinkClass(masActive), "inline-flex items-center gap-1")}
                  aria-expanded={masOpen}
                  aria-haspopup="true"
                >
                  {L.mas}
                  <span className="text-[0.65rem]">{masOpen ? "▲" : "▼"}</span>
                </button>
                {masOpen && (
                  <div className="absolute left-1/2 top-full z-50 mt-1 min-w-[10rem] -translate-x-1/2 overflow-hidden rounded-md border border-[#D6C7AD] bg-[#FFFDF7] py-1 shadow-[0_12px_32px_rgba(31,36,28,0.15)]">
                    {PUBLIC_NAV_MAS_ITEMS.map((item) => (
                      <Link
                        key={item.id}
                        href={buildLink(item.href)}
                        className="block px-4 py-2.5 text-sm text-[#3D3428] hover:bg-[#FBF7EF] hover:text-[#7A1E2C]"
                        onClick={() => setMasOpen(false)}
                      >
                        {publicNavLabel(item, lang)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </nav>

            {/* Right controls — desktop */}
            <div className="hidden items-center justify-end gap-2 sm:flex lg:gap-2.5">
              {langToggle}
              {accountControlDesktop}
              {advertiseCta}
            </div>

            {/* Mobile — lang + account + hamburger */}
            <div className="flex items-center justify-end gap-2 sm:hidden">
              {langToggle}
              {!authLoading && !user && (
                <button
                  type="button"
                  onClick={goToLogin}
                  className="rounded-md border border-[#D6C7AD] bg-[#FFFDF7] px-2 py-1 text-[0.65rem] font-semibold text-[#1F241C]"
                  aria-label={L.signIn}
                >
                  {L.signIn}
                </button>
              )}
              {!authLoading && user && (
                <Link
                  href={`/dashboard?lang=${lang}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#D6C7AD] bg-[#EDE6D6] text-xs font-bold text-[#1F241C]"
                  aria-label={L.myAccount}
                >
                  {initials}
                </Link>
              )}
              <button
                type="button"
                className="min-h-[44px] min-w-[44px] text-xl text-[#3D3428]"
                onClick={() => setMobileOpen(true)}
                aria-label={L.openMenu}
              >
                ☰
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[999] sm:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"
            onClick={() => setMobileOpen(false)}
            aria-label={L.closeMenu}
          />
          <div
            className="absolute top-0 right-0 flex h-[100dvh] max-h-[100dvh] w-[min(88vw,22rem)] flex-col overflow-hidden rounded-l-lg border-l border-[#D6C7AD] bg-[#FFFDF7] shadow-[0_0_22px_rgba(31,36,28,0.28)]"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-[#D6C7AD]/60 px-4 py-3">
              <span className="font-serif text-sm font-bold text-[#2A4536]">{L.menu}</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center text-2xl text-[#1F241C]"
                aria-label={L.closeMenu}
              >
                ×
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              <nav className="flex flex-col gap-0.5" aria-label={L.navAria}>
                {PUBLIC_NAV_PRIMARY.map((item) => (
                  <Link
                    key={item.id}
                    href={buildLink(item.href)}
                    onClick={() => setMobileOpen(false)}
                    className={cx(
                      "rounded-md px-2 py-2.5 text-[15px] font-semibold transition",
                      isActive(item.href)
                        ? "bg-[#7A1E2C]/10 text-[#7A1E2C]"
                        : "text-[#1F241C] hover:bg-[#FBF7EF]"
                    )}
                  >
                    {publicNavLabel(item, lang)}
                  </Link>
                ))}
                <p className="mt-3 px-2 text-[10px] font-bold uppercase tracking-wider text-[#556B3E]">
                  {L.mas}
                </p>
                {PUBLIC_NAV_MAS_ITEMS.map((item) => (
                  <Link
                    key={item.id}
                    href={buildLink(item.href)}
                    onClick={() => setMobileOpen(false)}
                    className={cx(
                      "rounded-md px-2 py-2.5 text-[15px] font-medium transition",
                      isActive(item.href)
                        ? "bg-[#7A1E2C]/10 text-[#7A1E2C]"
                        : "text-[#3D3428] hover:bg-[#FBF7EF]"
                    )}
                  >
                    {publicNavLabel(item, lang)}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="shrink-0 space-y-3 border-t border-[#D6C7AD]/60 px-4 py-4">
              <Link
                href={advertiseHref}
                onClick={() => setMobileOpen(false)}
                className="flex w-full items-center justify-center rounded-md bg-[#7A1E2C] px-4 py-3 text-sm font-bold text-white shadow-[0_8px_20px_-6px_rgba(122,30,44,0.5)]"
              >
                {publicNavLabel(PUBLIC_NAV_ADVERTISE, lang)}
              </Link>

              {user && (
                <div className="rounded-lg border border-[#D6C7AD] bg-[#FAF6EE] p-3">
                  <div className="truncate text-sm font-semibold text-[#1F241C]">{displayName}</div>
                  <div className="mt-2 flex flex-col gap-2">
                    <Link
                      href={`/dashboard?lang=${lang}`}
                      onClick={() => setMobileOpen(false)}
                      className="rounded-md bg-[#2A4536] px-3 py-2 text-center text-sm font-semibold text-[#F8F4EA]"
                    >
                      {L.manageAccount}
                    </Link>
                    <button
                      type="button"
                      onClick={() => void signOut()}
                      className="rounded-md border border-[#D6C7AD] px-3 py-2 text-sm text-[#3D3428]"
                    >
                      {L.signOut}
                    </button>
                  </div>
                </div>
              )}

              {!authLoading && !user && (
                <Link
                  href={`/login?mode=signup&lang=${lang}`}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-md border border-[#D6C7AD] px-3 py-2.5 text-center text-sm font-medium text-[#1F241C]"
                >
                  {L.createAccount}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={null}>
      <NavbarContent />
    </Suspense>
  );
}
