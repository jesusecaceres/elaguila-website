"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { LeonixDashboardShell } from "../components/LeonixDashboardShell";
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
  const v = (typeof raw === "string" ? raw : "").toLowerCase().trim();
  if (v === "pro" || v === "business_lite" || v === "business_premium") return "pro";
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
            emptyBody: "Cuando guardes un anuncio sin publicar, aparecerá aquí.",
            ctaPublish: "Publicar anuncio",
            ref: "Ref.",
            open: "Abrir espacio",
            edit: "Seguir editando",
            dup: "Duplicar",
            del: "Eliminar",
            pub: "Publicar",
            error: "No pudimos cargar los borradores.",
          }
        : {
            title: "Drafts",
            subtitle: "Continue editing, publish, or clean up drafts.",
            searchPh: "Search…",
            loading: "Loading…",
            emptyTitle: "No drafts yet",
            emptyBody: "When you save a listing without publishing, it will show up here.",
            ctaPublish: "Post an ad",
            ref: "Ref.",
            open: "Open workspace",
            edit: "Continue editing",
            dup: "Duplicate",
            del: "Delete",
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

  async function deleteDraft(id: string) {
    if (!confirm(lang === "es" ? "¿Eliminar este borrador?" : "Delete this draft?")) return;
    const sb = createSupabaseBrowserClient();
    setBusy(id);
    setErr(null);
    const { error } = await sb.from("listings").delete().eq("id", id);
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
              <h1 className="text-2xl font-bold tracking-tight text-[#1E1810] sm:text-3xl">{t.title}</h1>
              <p className="mt-2 text-sm text-[#5C5346]/95">{t.subtitle}</p>
            </div>
            <Link
              href={`/clasificados/publicar?${q}`}
              className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-5 py-2.5 text-sm font-semibold text-[#1E1810] shadow-md hover:brightness-[1.03]"
            >
              {t.ctaPublish}
            </Link>
          </header>

          <div className="relative mt-6 max-w-md">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchPh}
              className="w-full rounded-full border border-[#E8DFD0] bg-white py-2 pl-4 pr-10 text-sm text-[#1E1810] outline-none"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7A7164]">⌕</span>
          </div>

          {err ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-900">
              <strong>{t.error}</strong>
              <p className="mt-1 opacity-90">{err}</p>
            </div>
          ) : null}

          {visible.length === 0 ? (
            <div className="mt-10 rounded-3xl border border-[#E8DFD0]/90 bg-gradient-to-br from-[#FFFCF7] to-[#FAF4EA] p-10 text-center shadow-[0_12px_40px_-14px_rgba(42,36,22,0.1)]">
              <p className="text-lg font-bold text-[#1E1810]">{t.emptyTitle}</p>
              <p className="mt-2 text-sm text-[#5C5346]/95">{t.emptyBody}</p>
              <Link
                href={`/clasificados/publicar?${q}`}
                className="mt-6 inline-flex rounded-2xl bg-[#2A2620] px-6 py-2.5 text-sm font-semibold text-[#FAF7F2] hover:bg-[#1a1814]"
              >
                {t.ctaPublish}
              </Link>
            </div>
          ) : (
            <ul className="mt-8 flex flex-col gap-4">
              {visible.map((row) => {
                const st = resolveListingUiStatus(row);
                const b = busy === row.id;
                const editBase =
                  row.category === "en-venta"
                    ? `/dashboard/mis-anuncios/${row.id}/editar`
                    : `/dashboard/mis-anuncios/${row.id}/editar`;
                return (
                  <li
                    key={row.id}
                    className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-5 shadow-[0_10px_32px_-12px_rgba(42,36,22,0.1)]"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-bold text-[#1E1810]">{row.title?.trim() || "—"}</h2>
                          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${listingUiStatusChipClass(st)}`}>
                            {listingUiStatusLabel(st, lang)}
                          </span>
                        </div>
                        <p className="mt-1 font-mono text-[11px] text-[#7A7164]">
                          {t.ref} {shortListingRef(row.id)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/dashboard/mis-anuncios/${row.id}?${q}`}
                          className="rounded-xl border border-[#C9B46A]/40 bg-[#FBF7EF] px-3 py-2 text-xs font-semibold text-[#5C4E2E]"
                        >
                          {t.open}
                        </Link>
                        <Link
                          href={`${editBase}?${q}`}
                          className="rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-xs font-semibold text-[#2C2416]"
                        >
                          {t.edit}
                        </Link>
                        <button
                          type="button"
                          disabled={b}
                          onClick={() => {
                            void navigator.clipboard.writeText(row.id);
                          }}
                          className="rounded-xl border border-[#E8DFD0] bg-[#FAF7F2] px-3 py-2 text-xs font-semibold text-[#5C5346] disabled:opacity-50"
                        >
                          {t.dup}
                        </button>
                        <button
                          type="button"
                          disabled={b}
                          onClick={() => void publishDraft(row.id)}
                          className="rounded-xl bg-gradient-to-r from-[#E8D48A] to-[#C9A84A] px-3 py-2 text-xs font-bold text-[#1E1810] disabled:opacity-50"
                        >
                          {t.pub}
                        </button>
                        <button
                          type="button"
                          disabled={b}
                          onClick={() => void deleteDraft(row.id)}
                          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-900 disabled:opacity-50"
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

          <Link href={`/dashboard/mis-anuncios?${q}`} className="mt-10 inline-flex text-sm font-semibold text-[#2A2620] underline">
            ← {lang === "es" ? "Mis anuncios" : "My ads"}
          </Link>
        </>
      )}
    </LeonixDashboardShell>
  );
}
