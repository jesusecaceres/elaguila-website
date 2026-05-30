"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, Suspense, useCallback, useRef } from "react";
import { createSupabaseBrowserClient, withAuthTimeout, AUTH_CHECK_TIMEOUT_MS } from "../lib/supabase/browser";
import {
  PUBLIC_NAV_ADVERTISE,
  PUBLIC_NAV_DESKTOP,
  PUBLIC_NAV_MAS_ITEMS,
  PUBLIC_NAV_MOBILE,
  publicNavLabel,
  type PublicNavLang,
} from "../lib/publicNavConfig";

type Lang = PublicNavLang;

const HEADER_LOGO_SRC = "/logo.png";

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

  const buildLink = (href: string) => `${href.split("?")[0]}?lang=${lang}`;

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
    active
      ? "whitespace-nowrap text-[#7A1E2C] underline decoration-[#7A1E2C] decoration-2 underline-offset-[0.3em]"
      : "whitespace-nowrap text-[#3D3428] hover:text-[#7A1E2C]";

  const langToggle = (compact?: boolean) => (
    <div
      className="flex shrink-0 rounded-full border border-[#D6C7AD] bg-[#FFFDF7] p-0.5 text-[0.6875rem] font-semibold sm:text-xs"
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
            "min-h-[1.875rem] rounded-full px-2 py-1 transition-colors sm:min-h-[2rem] sm:px-2.5",
            compact ? "min-w-[2.5rem] sm:min-w-[2.75rem]" : "min-w-[3.25rem] sm:min-w-[3.5rem]",
            lang === code ? "bg-[#7A1E2C] text-[#FFFDF7]" : "text-[#3D3428] hover:bg-[#EDE6D6]"
          )}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );

  const accountControl = (variant: "desktop" | "mobile-bar") => {
    if (authLoading) {
      return (
        <div
          className={cx(
            "animate-pulse rounded-full bg-[#D6C7AD]/40",
            variant === "desktop" ? "hidden h-[2.125rem] w-16 xl:block" : "hidden"
          )}
        />
      );
    }

    if (user) {
      return (
        <div className={cx("relative", variant === "desktop" ? "hidden shrink-0 xl:block" : "hidden")}>
          <button
            type="button"
            onClick={() => setAccountOpen((v) => !v)}
            className="inline-flex max-w-[6.5rem] min-h-[2rem] items-center gap-1.5 rounded-full border border-[#D6C7AD] bg-[#FFFDF7] px-2 py-1 transition-colors hover:bg-[#EDE6D6] sm:min-h-[2.125rem] sm:max-w-[7.5rem] sm:px-2.5 xl:max-w-[8rem]"
            aria-label={L.myAccount}
            aria-expanded={accountOpen}
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt=""
                className="h-6 w-6 shrink-0 rounded-full border border-[#D6C7AD] object-cover sm:h-7 sm:w-7"
              />
            ) : (
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EDE6D6] text-[0.65rem] font-bold text-[#1F241C] sm:h-7 sm:w-7 sm:text-xs">
                {initials}
              </span>
            )}
            <span className="truncate text-[0.65rem] font-semibold text-[#3D3428] sm:text-xs">{accountLabel}</span>
          </button>

          {accountOpen && (
            <div
              className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] shadow-[0_18px_48px_rgba(31,36,28,0.18)]"
              role="menu"
            >
              <div className="border-b border-[#D6C7AD]/60 px-4 py-3">
                <div className="truncate text-xs font-medium text-[#1F241C]">{displayName}</div>
                {user.email && (
                  <div className="mt-0.5 truncate text-xs text-[#3D3428]/75">{user.email}</div>
                )}
                <div className="mt-1.5 inline-flex items-center rounded-full border border-[#D6C7AD] bg-[#EDE6D6] px-2 py-0.5 text-[10px] text-[#1F241C]">
                  {accountBadgeLabel(lang)}
                </div>
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
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={goToLogin}
        className={cx(
          "inline-flex shrink-0 min-h-[2rem] items-center justify-center rounded-full border border-[#D6C7AD] bg-[#FFFDF7] px-3 py-1 text-[0.7rem] font-semibold text-[#3D3428] transition-colors hover:bg-[#EDE6D6] sm:min-h-[2.125rem] sm:px-3.5 sm:text-xs",
          variant === "desktop" ? "hidden xl:inline-flex" : "hidden"
        )}
      >
        {L.signIn}
      </button>
    );
  };

  const advertiseCta = (
    <Link
      href={advertiseHref}
      className="hidden shrink-0 min-h-[2rem] items-center justify-center rounded-full bg-[#7A1E2C] px-3 py-1.5 text-[0.7rem] font-bold text-white shadow-[0_3px_10px_-3px_rgba(122,30,44,0.55)] transition-colors hover:bg-[#5e1721] sm:min-h-[2.125rem] sm:px-3.5 sm:text-xs xl:inline-flex"
    >
      {publicNavLabel(PUBLIC_NAV_ADVERTISE, lang)}
    </Link>
  );

  return (
    <header className="fixed top-0 left-0 z-50 w-full overflow-x-hidden" data-navbar-root>
      {showSignedOutToast && (
        <div
          className="fixed top-20 left-1/2 z-[1000] -translate-x-1/2 rounded-xl bg-green-600/95 px-4 py-2.5 text-sm font-medium text-white shadow-lg border border-green-500/30"
          role="status"
        >
          {L.signedOutToast}
        </div>
      )}

      <div className="border-b border-[#D6C7AD] bg-[#FAF6EE]/95 shadow-[0_1px_0_0_rgba(201,168,74,0.35)] backdrop-blur-sm supports-[backdrop-filter]:bg-[#FAF6EE]/90">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div
            className="grid items-center py-1.5 sm:py-2"
            style={{ gridTemplateColumns: "auto minmax(0, 1fr) auto" }}
          >
            {/* ZONE 1 — brand (protected, no overlap into center) */}
            <div className="col-start-1 min-w-0 w-max max-w-[9.5rem] shrink-0 sm:max-w-[10.5rem] xl:max-w-[12rem]">
              <Link
                href={buildLink("/home")}
                className="flex min-w-0 items-center gap-2.5 sm:gap-3"
                aria-label={L.brandName}
              >
                <span className="inline-flex h-[34px] w-[34px] shrink-0 overflow-hidden rounded-full bg-[#120f0c] ring-1 ring-[#C9A84A]/35 sm:h-9 sm:w-9 xl:h-10 xl:w-10">
                  <Image
                    src={HEADER_LOGO_SRC}
                    alt=""
                    width={40}
                    height={40}
                    className="h-full w-full object-contain object-center"
                    priority
                    aria-hidden
                  />
                </span>
                <span className="hidden truncate font-serif text-base font-bold leading-none text-[#2A4536] xl:inline xl:whitespace-nowrap">
                  {L.brandName}
                </span>
              </Link>
            </div>

            {/* ZONE 2 — center nav (xl+ only; isolated column) */}
            <nav
              className="col-start-2 hidden min-w-0 justify-self-center xl:flex xl:max-w-full xl:px-4"
              aria-label={L.navAria}
            >
              <div className="flex min-w-0 max-w-full items-center justify-center gap-x-[1.375rem] text-[0.8125rem] font-medium text-[#3D3428] 2xl:gap-x-7 2xl:text-[0.875rem]">
                {PUBLIC_NAV_DESKTOP.map((item) => (
                  <Link
                    key={item.id}
                    href={buildLink(item.href)}
                    className={navLinkClass(isActive(item.href))}
                    aria-current={isActive(item.href) ? "page" : undefined}
                  >
                    {publicNavLabel(item, lang)}
                  </Link>
                ))}

                <div className="relative shrink-0" ref={masRef}>
                  <button
                    type="button"
                    onClick={() => setMasOpen((v) => !v)}
                    className={cx(navLinkClass(masActive), "inline-flex items-center gap-0.5")}
                    aria-expanded={masOpen}
                    aria-haspopup="true"
                  >
                    {L.mas}
                    <span className="text-[0.6rem] leading-none">{masOpen ? "▲" : "▼"}</span>
                  </button>
                  {masOpen && (
                    <div className="absolute left-1/2 top-full z-50 mt-1 min-w-[12rem] -translate-x-1/2 overflow-hidden rounded-xl border border-[#D6C7AD] bg-[#FFFDF7] py-1 shadow-[0_12px_32px_rgba(31,36,28,0.15)]">
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
              </div>
            </nav>

            {/* ZONE 3 — right controls (protected, no overlap into center) */}
            <div className="col-start-3 flex w-max shrink-0 items-center justify-end gap-2.5 sm:gap-3">
              {langToggle(true)}
              {accountControl("desktop")}
              {advertiseCta}
              <button
                type="button"
                className="inline-flex min-h-[2rem] min-w-[2rem] shrink-0 items-center justify-center text-lg text-[#3D3428] xl:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label={L.openMenu}
              >
                ☰
              </button>
            </div>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-[999] xl:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"
            onClick={() => setMobileOpen(false)}
            aria-label={L.closeMenu}
          />
          <div
            className="absolute top-0 right-0 flex h-[100dvh] max-h-[100dvh] w-[min(88vw,22rem)] flex-col overflow-hidden rounded-l-2xl border-l border-[#D6C7AD] bg-[#FFFDF7] shadow-[0_0_22px_rgba(31,36,28,0.28)]"
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

            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-3">
              <nav className="flex flex-col gap-1" aria-label={L.navAria}>
                {PUBLIC_NAV_MOBILE.map((item) => (
                  <Link
                    key={item.id}
                    href={buildLink(item.href)}
                    onClick={() => setMobileOpen(false)}
                    className={cx(
                      "rounded-xl px-2 py-2.5 text-[15px] font-semibold transition",
                      isActive(item.href)
                        ? "bg-[#7A1E2C]/10 text-[#7A1E2C]"
                        : "text-[#1F241C] hover:bg-[#FBF7EF]"
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
                className="flex w-full items-center justify-center rounded-full bg-[#7A1E2C] px-4 py-3 text-sm font-bold text-white shadow-[0_3px_10px_-3px_rgba(122,30,44,0.55)]"
              >
                {publicNavLabel(PUBLIC_NAV_ADVERTISE, lang)}
              </Link>

              {authLoading ? (
                <div className="h-10 animate-pulse rounded-xl bg-[#D6C7AD]/30" />
              ) : user ? (
                <div className="rounded-2xl border border-[#D6C7AD] bg-[#FAF6EE] p-3">
                  <div className="truncate text-sm font-semibold text-[#1F241C]">{displayName}</div>
                  <div className="mt-2 flex flex-col gap-2">
                    <Link
                      href={`/dashboard?lang=${lang}`}
                      onClick={() => setMobileOpen(false)}
                      className="rounded-xl bg-[#7A1E2C] px-3 py-2.5 text-center text-sm font-semibold text-white"
                    >
                      {L.manageAccount}
                    </Link>
                    <Link
                      href={`/dashboard/mis-anuncios?lang=${lang}`}
                      onClick={() => setMobileOpen(false)}
                      className="rounded-xl border border-[#D6C7AD] bg-[#FFFDF7] px-3 py-2.5 text-center text-sm font-medium text-[#1F241C]"
                    >
                      {L.myListings}
                    </Link>
                    <button
                      type="button"
                      onClick={() => void signOut()}
                      className="rounded-xl border border-[#D6C7AD] px-3 py-2 text-sm text-[#3D3428]"
                    >
                      {L.signOut}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      goToLogin();
                    }}
                    className="rounded-xl bg-[#7A1E2C] px-3 py-2.5 text-sm font-semibold text-white"
                  >
                    {L.signIn}
                  </button>
                  <Link
                    href={`/login?mode=signup&lang=${lang}`}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-xl border border-[#D6C7AD] bg-[#FFFDF7] px-3 py-2.5 text-center text-sm font-medium text-[#1F241C]"
                  >
                    {L.createAccount}
                  </Link>
                </div>
              )}

              <div className="flex justify-center">{langToggle(true)}</div>
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
