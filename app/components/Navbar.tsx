"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, Suspense, useCallback, useRef } from "react";
import { createSupabaseBrowserClient, withAuthTimeout, AUTH_CHECK_TIMEOUT_MS } from "../lib/supabase/browser";
import {
  PUBLIC_NAV_ADVERTISE,
  PUBLIC_NAV_COMPACT_OVERFLOW,
  PUBLIC_NAV_COMPACT_OVERFLOW_LABEL,
  PUBLIC_NAV_MOBILE,
  PUBLIC_NAV_PRIMARY_AFTER_RECURSOS,
  PUBLIC_NAV_PRIMARY_BEFORE_RECURSOS,
  PUBLIC_NAV_RECURSOS_DROPDOWN,
  PUBLIC_NAV_RECURSOS_TRIGGER,
  publicNavDropdownLabel,
  publicNavItemLabel,
  publicNavLabel,
  type PublicNavLang,
} from "../lib/publicNavConfig";
import { AdvertiseDropdown } from "./AdvertiseDropdown";
import { LeonixHeaderLanguageSelector } from "@/app/(site)/magazine/components/LeonixHeaderLanguageSelector";
import { leonixNavCopyLang } from "@/app/lib/lang";
import { resolveRouteLang } from "@/app/lib/language";

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

  const routeLang = resolveRouteLang(searchParams?.get("lang"));
  const navLang: Lang = leonixNavCopyLang(routeLang);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [recursosOpen, setRecursosOpen] = useState(false);
  const [compactOverflowOpen, setCompactOverflowOpen] = useState(false);
  const recursosRef = useRef<HTMLDivElement>(null);
  const compactOverflowRef = useRef<HTMLDivElement>(null);

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
    setMobileOpen(false);
    setAccountOpen(false);
    setRecursosOpen(false);
    setCompactOverflowOpen(false);
  }, [pathname, routeLang, searchParams?.toString()]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!recursosOpen && !compactOverflowOpen) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (recursosRef.current && !recursosRef.current.contains(t)) setRecursosOpen(false);
      if (compactOverflowRef.current && !compactOverflowRef.current.contains(t)) setCompactOverflowOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [recursosOpen, compactOverflowOpen]);

  const t = useMemo(
    () => ({
      es: {
        brandName: "Leonix Media",
        navAria: "Navegación principal",
        recursosMenu: "Recursos Comunitarios",
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
        navAria: "Main navigation",
        recursosMenu: "Community Resources",
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

  const L = t[navLang];

  const buildLink = (href: string) => `${href.split("?")[0]}?lang=${routeLang}`;

  const isActive = (href: string) => {
    const cleanHref = href.split("?")[0];
    if (cleanHref === "/home") return pathname === "/home";
    return pathname === cleanHref || pathname.startsWith(`${cleanHref}/`);
  };

  const recursosDropdownActive = PUBLIC_NAV_RECURSOS_DROPDOWN.some((item) => isActive(item.href));
  const recursosTriggerActive =
    isActive(PUBLIC_NAV_RECURSOS_TRIGGER.href) || recursosDropdownActive;
  const compactOverflowActive = PUBLIC_NAV_COMPACT_OVERFLOW.some((item) => isActive(item.href));

  const currentPathWithQuery = useMemo(() => {
    const q = searchParams?.toString() ?? "";
    return q ? `${pathname}?${q}` : pathname;
  }, [pathname, searchParams]);

  const goToLogin = useCallback(() => {
    const onPublicar = currentPathWithQuery?.startsWith("/clasificados/publicar");
    if (onPublicar) {
      const redirect = encodeURIComponent(
        currentPathWithQuery || `/clasificados/publicar?lang=${routeLang}`
      );
      router.push(`/login?mode=post&lang=${routeLang}&redirect=${redirect}`);
    } else {
      router.push(`/login?mode=login&lang=${routeLang}`);
    }
  }, [currentPathWithQuery, routeLang, router]);

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
      router.replace(`/home?lang=${routeLang}&signed_out=1`);
    }
  }, [router, routeLang, user?.id]);

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

  const langToggle = () => <LeonixHeaderLanguageSelector variant="compact" />;

  const accountControl = (variant: "desktop" | "mobile-bar") => {
    if (authLoading) {
      return (
        <div
          className={cx(
            "animate-pulse rounded-full bg-[#D6C7AD]/40",
            variant === "desktop" ? "hidden h-[2.125rem] w-16 lg:block" : "hidden"
          )}
        />
      );
    }

    if (user) {
      return (
        <div className={cx("relative", variant === "desktop" ? "hidden shrink-0 lg:block" : "hidden")}>
          <button
            type="button"
            onClick={() => setAccountOpen((v) => !v)}
            className="inline-flex max-w-[6.5rem] min-h-[2rem] items-center gap-1.5 rounded-full border border-[#D6C7AD] bg-[#FFFDF7] px-2 py-1 transition-colors hover:bg-[#EDE6D6] sm:min-h-[2.125rem] sm:max-w-[7.5rem] sm:px-2.5 2xl:max-w-[8rem]"
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
                  {accountBadgeLabel(navLang)}
                </div>
              </div>
              <Link
                href={`/dashboard?lang=${routeLang}`}
                className="block px-4 py-3 text-sm text-[#1F241C] hover:bg-[#FBF7EF]"
                onClick={() => setAccountOpen(false)}
              >
                {L.manageAccount}
              </Link>
              <Link
                href={`/dashboard/mis-anuncios?lang=${routeLang}`}
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
          variant === "desktop" ? "hidden lg:inline-flex" : "hidden"
        )}
      >
        {L.signIn}
      </button>
    );
  };

  const advertiseCta = (
    <AdvertiseDropdown
      lang={navLang}
      variant="navbar"
      align="right"
      buttonLabel={publicNavLabel(PUBLIC_NAV_ADVERTISE, navLang)}
      className="hidden lg:block"
      onNavigate={() => setMobileOpen(false)}
    />
  );

  return (
    <header className="fixed top-0 left-0 z-50 w-full" data-navbar-root>
      {showSignedOutToast && (
        <div
          className="fixed top-20 left-1/2 z-[1000] -translate-x-1/2 rounded-xl bg-green-600/95 px-4 py-2.5 text-sm font-medium text-white shadow-lg border border-green-500/30"
          role="status"
        >
          {L.signedOutToast}
        </div>
      )}

      <div className="border-b border-[#D6C7AD] bg-[#FAF6EE]/95 shadow-[0_1px_0_0_rgba(201,168,74,0.35)] backdrop-blur-sm supports-[backdrop-filter]:bg-[#FAF6EE]/90">
        <div className="w-full px-3 sm:px-4 lg:px-5 xl:px-6">
          <div className="flex flex-nowrap items-center justify-between gap-x-2 py-1.5 sm:gap-x-3 sm:py-2 lg:gap-x-4">
            {/* ZONE 1 — brand (left) */}
            <div className="flex shrink-0 items-center pe-3 sm:pe-4 lg:pe-5 xl:pe-6">
              <Link
                href={buildLink("/home")}
                className="flex shrink-0 items-center gap-2.5 sm:gap-3"
                aria-label={L.brandName}
              >
                <span className="inline-flex h-[34px] w-[34px] shrink-0 overflow-hidden rounded-full bg-[#120f0c] ring-1 ring-[#C9A84A]/35 sm:h-9 sm:w-9 lg:h-10 lg:w-10">
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
                <span className="hidden font-serif text-base font-bold leading-none text-[#2A4536] lg:inline lg:whitespace-nowrap">
                  {L.brandName}
                </span>
              </Link>
            </div>

            {/* ZONE 2 — primary nav (lg+); one row, no clip, no generic Más on wide desktop */}
            <nav
              className="hidden min-w-0 flex-1 items-center overflow-visible lg:flex"
              aria-label={L.navAria}
            >
              <div className="flex w-full min-w-0 flex-nowrap items-center gap-x-2.5 text-[0.75rem] font-medium text-[#3D3428] sm:gap-x-3 lg:text-[0.8125rem] xl:gap-x-3.5 xl:text-[0.875rem] 2xl:gap-x-4">
                {PUBLIC_NAV_PRIMARY_BEFORE_RECURSOS.map((item) => (
                  <Link
                    key={item.id}
                    href={buildLink(item.href)}
                    className={cx(navLinkClass(isActive(item.href)), "shrink-0")}
                    aria-current={isActive(item.href) ? "page" : undefined}
                  >
                    {publicNavLabel(item, navLang)}
                  </Link>
                ))}

                <div className="relative shrink-0" ref={recursosRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setCompactOverflowOpen(false);
                      setRecursosOpen((v) => !v);
                    }}
                    className={cx(
                      navLinkClass(recursosTriggerActive),
                      "inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap"
                    )}
                    aria-expanded={recursosOpen}
                    aria-haspopup="true"
                    aria-label={L.recursosMenu}
                  >
                    {publicNavLabel(PUBLIC_NAV_RECURSOS_TRIGGER, navLang)}
                    <span className="text-[0.6rem] leading-none" aria-hidden>
                      {recursosOpen ? "▲" : "▼"}
                    </span>
                  </button>
                  {recursosOpen ? (
                    <div
                      className="absolute left-0 top-full z-[60] mt-1 min-w-[14rem] overflow-visible rounded-xl border border-[#D6C7AD] bg-[#FFFDF7] py-1 shadow-[0_12px_32px_rgba(31,36,28,0.18)]"
                      role="menu"
                    >
                      {PUBLIC_NAV_RECURSOS_DROPDOWN.map((item) => (
                        <Link
                          key={item.id}
                          href={buildLink(item.href)}
                          role="menuitem"
                          className={cx(
                            "block whitespace-nowrap px-4 py-2.5 text-sm text-[#3D3428] hover:bg-[#FBF7EF] hover:text-[#7A1E2C]",
                            isActive(item.href) && "bg-[#7A1E2C]/8 font-semibold text-[#7A1E2C]"
                          )}
                          onClick={() => setRecursosOpen(false)}
                        >
                          {publicNavDropdownLabel(item, navLang)}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>

                {PUBLIC_NAV_PRIMARY_AFTER_RECURSOS.map((item) => {
                  if (item.id === "productos-promocionales") {
                    return (
                      <span key={item.id} className="hidden shrink-0 xl:contents 2xl:contents">
                        <Link
                          href={buildLink(item.href)}
                          className={cx(navLinkClass(isActive(item.href)), "shrink-0 xl:inline 2xl:hidden")}
                          aria-current={isActive(item.href) ? "page" : undefined}
                        >
                          {publicNavItemLabel(item, navLang, { short: true })}
                        </Link>
                        <Link
                          href={buildLink(item.href)}
                          className={cx(navLinkClass(isActive(item.href)), "hidden shrink-0 2xl:inline")}
                          aria-current={isActive(item.href) ? "page" : undefined}
                        >
                          {publicNavLabel(item, navLang)}
                        </Link>
                      </span>
                    );
                  }
                  return (
                    <Link
                      key={item.id}
                      href={buildLink(item.href)}
                      className={cx(navLinkClass(isActive(item.href)), "hidden shrink-0 xl:inline")}
                      aria-current={isActive(item.href) ? "page" : undefined}
                    >
                      {publicNavLabel(item, navLang)}
                    </Link>
                  );
                })}

                <div className="relative shrink-0 xl:hidden" ref={compactOverflowRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setRecursosOpen(false);
                      setCompactOverflowOpen((v) => !v);
                    }}
                    className={cx(
                      navLinkClass(compactOverflowActive),
                      "inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap"
                    )}
                    aria-expanded={compactOverflowOpen}
                    aria-haspopup="true"
                  >
                    {navLang === "es"
                      ? PUBLIC_NAV_COMPACT_OVERFLOW_LABEL.labelEs
                      : PUBLIC_NAV_COMPACT_OVERFLOW_LABEL.labelEn}
                    <span className="text-[0.6rem] leading-none" aria-hidden>
                      {compactOverflowOpen ? "▲" : "▼"}
                    </span>
                  </button>
                  {compactOverflowOpen ? (
                    <div
                      className="absolute left-0 top-full z-[60] mt-1 min-w-[12rem] rounded-xl border border-[#D6C7AD] bg-[#FFFDF7] py-1 shadow-[0_12px_32px_rgba(31,36,28,0.18)]"
                      role="menu"
                    >
                      {PUBLIC_NAV_COMPACT_OVERFLOW.map((item) => (
                        <Link
                          key={`compact-${item.id}`}
                          href={buildLink(item.href)}
                          role="menuitem"
                          className="block whitespace-nowrap px-4 py-2.5 text-sm text-[#3D3428] hover:bg-[#FBF7EF] hover:text-[#7A1E2C]"
                          onClick={() => setCompactOverflowOpen(false)}
                        >
                          {publicNavItemLabel(item, navLang, { short: true })}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </nav>

            {/* ZONE 3 — right controls */}
            <div className="flex shrink-0 flex-nowrap items-center justify-end gap-2 ps-2 sm:gap-2.5 lg:gap-3 lg:ps-3">
              {langToggle()}
              {accountControl("desktop")}
              {advertiseCta}
              <button
                type="button"
                className="inline-flex min-h-[2rem] min-w-[2rem] shrink-0 items-center justify-center text-lg text-[#3D3428] lg:hidden"
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
        <div className="fixed inset-0 z-[999] lg:hidden">
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
                    {publicNavLabel(item, navLang)}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="shrink-0 space-y-3 border-t border-[#D6C7AD]/60 px-4 py-4">
              <AdvertiseDropdown
                lang={navLang}
                variant="primary"
                fullWidth
                buttonLabel={publicNavLabel(PUBLIC_NAV_ADVERTISE, navLang)}
                onNavigate={() => setMobileOpen(false)}
              />

              {authLoading ? (
                <div className="h-10 animate-pulse rounded-xl bg-[#D6C7AD]/30" />
              ) : user ? (
                <div className="rounded-2xl border border-[#D6C7AD] bg-[#FAF6EE] p-3">
                  <div className="truncate text-sm font-semibold text-[#1F241C]">{displayName}</div>
                  <div className="mt-2 flex flex-col gap-2">
                    <Link
                      href={`/dashboard?lang=${routeLang}`}
                      onClick={() => setMobileOpen(false)}
                      className="rounded-xl bg-[#7A1E2C] px-3 py-2.5 text-center text-sm font-semibold text-white"
                    >
                      {L.manageAccount}
                    </Link>
                    <Link
                      href={`/dashboard/mis-anuncios?lang=${routeLang}`}
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
                    href={`/login?mode=signup&lang=${routeLang}`}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-xl border border-[#D6C7AD] bg-[#FFFDF7] px-3 py-2.5 text-center text-sm font-medium text-[#1F241C]"
                  >
                    {L.createAccount}
                  </Link>
                </div>
              )}

              <div className="flex justify-center">{langToggle()}</div>
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
