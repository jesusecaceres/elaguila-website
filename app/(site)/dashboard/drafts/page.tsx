"use client";

/**
 * Server-side drafts: `listings` rows owned by the user with `is_published === false` or draft-like `status`.
 * Category publish flows may still keep additional state in browser storage or separate tables — those are not listed here.
 */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { OWNER_LISTING_SOFT_ARCHIVE_PATCH } from "../lib/ownerListingsLifecycleClient";
import { LeonixDashboardShell } from "../components/LeonixDashboardShell";
import { DashboardAutosPaidDraftsBand } from "../components/DashboardAutosPaidDraftsBand";
import { LX_DASH } from "../lib/dashboardLeonixTheme";
import { resolveListingUiStatus, listingUiStatusLabel, listingUiStatusChipClass, shortListingRef } from "../lib/listingDisplayStatus";
import type { Lang } from "../lib/listingDisplayStatus";

type Plan = "free" | "pro";

type ListingRow = {
  id: string;
  title?: string | null;
  status?: string | null;
  created_at?: string | null;
  is_published?: boolean | null;
  category?: string | null;
};

function accountRefFromId(id: string): string {
  const s = (id ?? "").replace(/-/g, "").trim();
  if (s.length < 8) return "—";
  return `${s.slice(0, 4).toUpperCase()}-${s.slice(-4).toUpperCase()}`;
}

function normalizePlanFromMembershipTier(raw: unknown): Plan {
  void raw;
  return "free";
}

function isDraftRow(row: ListingRow): boolean {
  if (row.is_published === false) return true;
  const st = String(row.status ?? "").toLowerCase();
  return st === "draft" || st === "unpublished";
}

export default function DraftsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname() ?? "/dashboard/drafts";
  const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";
  const q = `lang=${lang}`;

  const t = useMemo(
    () =>
      lang === "es"
        ? {
            title: "Borradores",
            subtitle: "Continúa, publica o limpia borradores.",
            searchPh: "Buscar…",
            loading: "Cargando…",
            emptyTitle: "Sin borradores por ahora",
            emptyBody:
              "Cuando guardes un anuncio sin publicar, aparecerá aquí. Los borradores de Bienes Raíces (Privado/Negocio) en vista previa viven en el navegador hasta que pulses Publicar; no aparecen aquí hasta que exista una fila `listings` con is_published=false.",
            ctaPublish: "Publicar anuncio",
            ref: "Ref.",
            open: "Abrir borrador",
            edit: "Seguir editando",
            copyId: "Copiar ID",
            del: "Archivar",
            pub: "Publicar",
            error: "No pudimos cargar los borradores.",
          }
        : {
            title: "Drafts",
            subtitle: "Continue editing, publish, or clean up drafts.",
            searchPh: "Search…",
            loading: "Loading…",
            emptyTitle: "No drafts yet",
            emptyBody:
              "When you save a listing without publishing, it will show up here. BR preview drafts (private/business) stay in the browser until you publish; they do not appear here until a `listings` row exists with is_published=false.",
            ctaPublish: "Post an ad",
            ref: "Ref.",
            open: "Open draft",
            edit: "Continue editing",
            copyId: "Copy ID",
            del: "Archive",
            pub: "Publish",
            error: "We couldn’t load drafts.",
          },
    [lang]
  );

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan>("free");
  const [userId, setUserId] = useState<string | null>(null);
  const [rows, setRows] = useState<ListingRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

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
        const { data: p } = await sb.from("profiles").select("display_name, email, membership_tier").eq("id", u.id).maybeSingle();
        const row = p as { display_name?: string | null; email?: string | null; membership_tier?: string | null } | null;
        if (row?.display_name?.trim()) setName(row.display_name.trim());
        if (row?.email?.trim()) setEmail(row.email.trim());
        setPlan(normalizePlanFromMembershipTier(row?.membership_tier));
      } catch {
        /* ignore */
      }

      setErr(null);
      const { data: list, error } = await sb
        .from("listings")
        .select("id,title,status,created_at,is_published,category")
        .eq("owner_id", u.id)
        .order("created_at", { ascending: false });

      if (!mounted) return;
      if (error) {
        setErr(error.message);
        setRows([]);
      } else {
        const all = (list as ListingRow[]) ?? [];
        setRows(all.filter(isDraftRow));
      }
      setLoading(false);
    }
    void run();
    return () => {
      mounted = false;
    };
  }, [router, pathname]);

  const accountRef = userId ? accountRefFromId(userId) : null;
  const needle = search.trim().toLowerCase();
  const visible = useMemo(() => {
    if (!needle) return rows;
    return rows.filter((r) => (r.title ?? "").toLowerCase().includes(needle));
  }, [rows, needle]);

  async function publishDraft(id: string) {
    const sb = createSupabaseBrowserClient();
    setBusy(id);
    setErr(null);
    const { error } = await sb.from("listings").update({ status: "active", is_published: true }).eq("id", id);
    if (error) setErr(error.message);
    else setRows((prev) => prev.filter((x) => x.id !== id));
    setBusy(null);
  }

  async function archiveDraft(id: string) {
    if (!confirm(lang === "es" ? "¿Archivar este borrador?" : "Archive this draft?")) return;
    const sb = createSupabaseBrowserClient();
    setBusy(id);
    setErr(null);
    const now = new Date().toISOString();
    const patch = { ...OWNER_LISTING_SOFT_ARCHIVE_PATCH, updated_at: now };
    const { error } = await sb.from("listings").update(patch).eq("id", id);
    if (error) setErr(error.message);
    else setRows((prev) => prev.filter((x) => x.id !== id));
    setBusy(null);
  }

  return (
    <LeonixDashboardShell lang={lang} activeNav="drafts" plan={plan} userName={name} email={email} accountRef={accountRef}>
      {loading ? (
        <div className="rounded-3xl border border-[#E8DFD0] bg-[#FFFCF7]/90 p-10 text-center text-sm text-[#5C5346]">{t.loading}</div>
      ) : (
        <>
          <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className={LX_DASH.contextLabel}>{lang === "es" ? "Trabajo en progreso" : "Work in progress"}</p>
              <h1 className={`mt-2 ${LX_DASH.pageTitle}`}>{t.title}</h1>
              <p className={`mt-2 ${LX_DASH.bodyMuted}`}>{t.subtitle}</p>
            </div>
            <Link href={`/clasificados/publicar?${q}`} className={`inline-flex shrink-0 ${LX_DASH.btnPrimary} px-5 py-2.5 text-sm`}>
              {t.ctaPublish}
            </Link>
          </header>

          <div className="relative mt-6 max-w-md">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchPh}
              className="w-full rounded-xl border border-[#D6C7AD]/70 bg-white py-2.5 pl-4 pr-10 text-sm text-[#1F241C] outline-none focus:border-[#C9A84A]/55 focus:ring-2 focus:ring-[#C9A84A]/15"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7A7164]">⌕</span>
          </div>

          {err ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-900">
              <strong>{t.error}</strong>
              <p className="mt-1 opacity-90">{err}</p>
            </div>
          ) : null}

          <DashboardAutosPaidDraftsBand lang={lang} />

          {visible.length === 0 ? (
            <div className={`mt-10 ${LX_DASH.disabledPanel}`}>
              <p className="text-lg font-serif font-semibold text-[#1F241C]">{t.emptyTitle}</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#5C5346]">{t.emptyBody}</p>
              <Link href={`/clasificados/publicar?${q}`} className={`mt-6 inline-flex ${LX_DASH.btnPrimary} px-6 py-2.5 text-sm`}>
                {t.ctaPublish}
              </Link>
            </div>
          ) : (
            <ul className="mt-8 flex flex-col gap-4">
              {visible.map((row) => {
                const st = resolveListingUiStatus(row);
                const b = busy === row.id;
                const editBase = `/dashboard/mis-anuncios/${row.id}/editar`;
                return (
                  <li key={row.id} className={LX_DASH.panel}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-semibold text-[#1F241C]">{row.title?.trim() || "—"}</h2>
                          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${listingUiStatusChipClass(st)}`}>
                            {listingUiStatusLabel(st, lang)}
                          </span>
                        </div>
                        <p className="mt-1 font-mono text-[11px] text-[#7A7164]">
                          {t.ref} {shortListingRef(row.id)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/dashboard/mis-anuncios/${row.id}?${q}`} className={LX_DASH.btnSecondary}>
                          {t.open}
                        </Link>
                        <Link href={`${editBase}?${q}`} className={LX_DASH.btnManage}>
                          {t.edit}
                        </Link>
                        <button
                          type="button"
                          disabled={b}
                          onClick={() => {
                            void navigator.clipboard.writeText(row.id);
                          }}
                          className={LX_DASH.btnManage}
                        >
                          {t.copyId}
                        </button>
                        <button
                          type="button"
                          disabled={b}
                          onClick={() => void publishDraft(row.id)}
                          className={LX_DASH.btnPrimary}
                        >
                          {t.pub}
                        </button>
                        <button
                          type="button"
                          disabled={b}
                          onClick={() => void archiveDraft(row.id)}
                          className="rounded-xl border border-[#D6C7AD]/70 bg-[#FAF7F2] px-4 py-2 text-xs font-semibold text-[#5C5346] transition hover:bg-[#F3EBDD] disabled:opacity-50"
                        >
                          {t.del}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <Link href={`/dashboard/mis-anuncios?${q}`} className="mt-10 inline-flex text-sm font-semibold text-[#7A1E2C] underline decoration-[#C9A84A]/40 underline-offset-4">
            ← {lang === "es" ? "Mis anuncios" : "My ads"}
          </Link>
        </>
      )}
    </LeonixDashboardShell>
  );
}
