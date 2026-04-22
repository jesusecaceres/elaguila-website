"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { FiHeart, FiSearch } from "react-icons/fi";
import { createSupabaseBrowserClient, withAuthTimeout, AUTH_CHECK_TIMEOUT_MS } from "@/app/lib/supabase/browser";
import newLogo from "@/public/logo.png";
import type { ServiciosLang } from "../types/serviciosBusinessProfile";

function getInitials(input?: string | null) {
  const s = (input ?? "").trim();
  if (!s) return "U";
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function ServiciosTopBarInner({
  lang,
  editBackHref,
  beforeEditBackNavigate,
}: {
  lang: ServiciosLang;
  editBackHref?: string;
  beforeEditBackNavigate?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [accountOpen, setAccountOpen] = useState(false);

  const t = useMemo(
    () =>
      lang === "en"
        ? {
            servicios: "Services",
            search: "Search",
            favorites: "Saved",
            signIn: "Sign in",
            account: "Account",
            dashboard: "Dashboard",
            listings: "My listings",
            signOut: "Sign out",
            editBack: "Back to edit",
          }
        : {
            servicios: "Servicios",
            search: "Buscar",
            favorites: "Favoritos",
            signIn: "Iniciar sesión",
            account: "Cuenta",
            dashboard: "Panel",
            listings: "Mis anuncios",
            signOut: "Cerrar sesión",
            editBack: "Volver a editar",
          },
    [lang]
  );

  const withLang = useCallback(
    (href: string) => {
      const [path, query] = href.split("?");
      const q = new URLSearchParams(query ?? "");
      q.set("lang", lang);
      return `${path}?${q.toString()}`;
    },
    [lang]
  );

  const switchLang = (next: ServiciosLang) => {
    const q = new URLSearchParams(searchParams?.toString() ?? "");
    q.set("lang", next);
    router.push(`${pathname}?${q.toString()}`);
  };

  useEffect(() => {
    let mounted = true;
    let supabase: ReturnType<typeof createSupabaseBrowserClient> | null = null;
    try {
      supabase = createSupabaseBrowserClient();
    } catch {
      setAuthLoading(false);
      return;
    }

    async function load() {
      try {
        const { data } = await withAuthTimeout(supabase!.auth.getUser(), AUTH_CHECK_TIMEOUT_MS);
        if (!mounted) return;
        const u = data.user;
        if (!u) {
          setUserName(null);
          setUserEmail(null);
          setAvatarUrl(null);
          setAuthLoading(false);
          return;
        }
        const fullName =
          (u.user_metadata?.full_name as string | undefined) ||
          (u.user_metadata?.name as string | undefined) ||
          null;
        const av =
          (u.user_metadata?.avatar_url as string | undefined) ||
          (u.user_metadata?.picture as string | undefined) ||
          null;
        setUserName(fullName || u.email?.split("@")[0] || null);
        setUserEmail(u.email ?? null);
        setAvatarUrl(av);
      } catch {
        if (!mounted) return;
        setUserName(null);
      } finally {
        if (mounted) setAuthLoading(false);
      }
    }
    void load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => void load());
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!accountOpen) return;
    const onDoc = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (!el.closest("[data-sv-account]")) setAccountOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [accountOpen]);

  const initials = getInitials(userName || userEmail);

  return (
    <header
      className="sticky top-0 z-50 border-b border-black/[0.06] backdrop-blur-md"
      style={{ backgroundColor: "rgba(249, 248, 246, 0.92)" }}
    >
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 md:px-6">
        {editBackHref ? (
          <Link
            href={editBackHref}
            onClick={() => beforeEditBackNavigate?.()}
            className="shrink-0 py-2 text-[11px] font-semibold leading-snug text-[color:var(--lx-muted)] underline-offset-4 hover:text-[#3B66AD] hover:underline sm:py-0"
          >
            {t.editBack}
          </Link>
        ) : null}
        <Link href={withLang("/home")} className="flex min-w-0 shrink-0 items-center gap-3 no-underline">
          <span className="relative block h-9 w-[120px] shrink-0 md:h-10 md:w-[140px]">
            <Image src={newLogo} alt="Leonix" className="object-contain object-left" fill sizes="140px" priority />
          </span>
          <span
            className="hidden h-8 w-px shrink-0 bg-black/10 sm:block"
            aria-hidden
          />
          <span className="hidden min-w-0 flex-col leading-none sm:flex">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3B66AD]">Leonix</span>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--lx-text-2)]">
              {t.servicios}
            </span>
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full text-[color:var(--lx-text-2)] transition hover:bg-black/[0.04]"
            aria-label={t.search}
          >
            <FiSearch className="h-[1.15rem] w-[1.15rem]" />
          </button>
          <button
            type="button"
            className="hidden h-10 w-10 items-center justify-center rounded-full text-[color:var(--lx-text-2)] transition hover:bg-black/[0.04] sm:flex"
            aria-label={t.favorites}
          >
            <FiHeart className="h-[1.15rem] w-[1.15rem]" />
          </button>

          <div className="mx-1 hidden h-6 w-px bg-black/10 sm:block" aria-hidden />

          <div className="flex items-center gap-1 text-[11px] font-semibold sm:text-xs">
            <button
              type="button"
              onClick={() => switchLang("es")}
              className={lang === "es" ? "text-[#3B66AD]" : "text-[color:var(--lx-muted)] hover:text-[color:var(--lx-text)]"}
            >
              ES
            </button>
            <span className="text-black/20">|</span>
            <button
              type="button"
              onClick={() => switchLang("en")}
              className={lang === "en" ? "text-[#3B66AD]" : "text-[color:var(--lx-muted)] hover:text-[color:var(--lx-text)]"}
            >
              EN
            </button>
          </div>

          <div className="relative ml-1" data-sv-account>
            {authLoading ? (
              <div className="h-9 w-24 animate-pulse rounded-full bg-black/[0.06]" />
            ) : userName || userEmail ? (
              <>
                <button
                  type="button"
                  onClick={() => setAccountOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-2 py-1.5 pr-3 shadow-sm transition hover:border-black/12"
                >
                  {avatarUrl ? (
                     
                    <img src={avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3B66AD]/12 text-xs font-bold text-[#3B66AD]">
                      {initials}
                    </span>
                  )}
                  <span className="max-w-[100px] truncate text-xs font-semibold text-[color:var(--lx-text)] sm:max-w-[140px]">
                    {t.servicios}
                  </span>
                  <span className="text-[10px] text-[color:var(--lx-muted)]">{accountOpen ? "▲" : "▼"}</span>
                </button>
                {accountOpen ? (
                  <div className="absolute right-0 mt-2 w-52 rounded-xl border border-black/10 bg-white py-1 shadow-lg">
                    <Link
                      href={`/dashboard?lang=${lang}`}
                      className="block px-4 py-2.5 text-sm text-[color:var(--lx-text)] hover:bg-black/[0.03]"
                      onClick={() => setAccountOpen(false)}
                    >
                      {t.dashboard}
                    </Link>
                    <Link
                      href={`/dashboard/mis-anuncios?lang=${lang}`}
                      className="block px-4 py-2.5 text-sm text-[color:var(--lx-text)] hover:bg-black/[0.03]"
                      onClick={() => setAccountOpen(false)}
                    >
                      {t.listings}
                    </Link>
                    <button
                      type="button"
                      className="w-full px-4 py-2.5 text-left text-sm text-[color:var(--lx-text-2)] hover:bg-black/[0.03]"
                      onClick={async () => {
                        setAccountOpen(false);
                        try {
                          const sb = createSupabaseBrowserClient();
                          await sb.auth.signOut();
                        } catch {
                          /* noop */
                        }
                        router.refresh();
                        router.push(`/home?lang=${lang}`);
                      }}
                    >
                      {t.signOut}
                    </button>
                  </div>
                ) : null}
              </>
            ) : (
              <Link
                href={`/login?mode=login&lang=${lang}`}
                className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-xs font-semibold text-[color:var(--lx-text)] shadow-sm transition hover:border-[#3B66AD]/40"
              >
                {t.signIn}
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export function ServiciosTopBar({
  lang,
  editBackHref,
  beforeEditBackNavigate,
}: {
  lang: ServiciosLang;
  editBackHref?: string;
  beforeEditBackNavigate?: () => void;
}) {
  return (
    <Suspense fallback={<div className="h-[57px] border-b border-black/5 bg-[#F9F8F6]" />}>
      <ServiciosTopBarInner lang={lang} editBackHref={editBackHref} beforeEditBackNavigate={beforeEditBackNavigate} />
    </Suspense>
  );
}
