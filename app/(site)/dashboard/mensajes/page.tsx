"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { LeonixDashboardShell } from "../components/LeonixDashboardShell";

type Lang = "es" | "en";
type Plan = "free" | "pro";
type MsgTab = "all" | "buying" | "selling" | "unread" | "archived";

type MsgRow = {
  id: string;
  sender_id: string;
  receiver_id: string;
  listing_id: string;
  message: string;
  created_at: string;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  email: string | null;
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

function parseListingTitleFromBody(body: string): string | null {
  const m = body.match(/\[Anuncio:\s*([^\]]+)\]/);
  return m ? m[1].trim() : null;
}

function parseListingIdFromBody(body: string): string | null {
  const m = body.match(/\[Listing ID:\s*([^\]]+)\]/);
  return m ? m[1].trim() : null;
}

function previewText(body: string, max = 160): string {
  const lines = body.split(/\n/).filter((l) => l.trim());
  const last = lines[lines.length - 1] ?? body;
  const t = last.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

const PLACEHOLDER_THUMB = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Crect fill='%23EDE6DC' width='56' height='56' rx='12'/%3E%3C/svg%3E";

export default function MensajesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";
  const q = `lang=${lang}`;

  const t = useMemo(
    () =>
      lang === "es"
        ? {
            title: "Mensajes",
            subtitle: "Bandeja Leonix — compras, ventas y consultas por anuncio.",
            empty: "Aún no hay conversaciones en esta vista.",
            loading: "Cargando…",
            listingId: "ID",
            from: "De",
            detail: "Ver mensaje completo",
            close: "Cerrar",
            viewListing: "Ver anuncio",
            tabs: { all: "Todos", buying: "Comprando", selling: "Vendiendo", unread: "Sin leer", archived: "Archivado" },
            pick: "Selecciona una conversación",
            archivedPh: "Archivo próximamente — podrás silenciar hilos aquí.",
            unreadPh: "Sin estado “leído” en servidor — mostramos recientes como prioridad.",
            new: "Nuevo",
          }
        : {
            title: "Messages",
            subtitle: "Leonix inbox — buying, selling, and per-listing threads.",
            empty: "No conversations in this view yet.",
            loading: "Loading…",
            listingId: "ID",
            from: "From",
            detail: "View full message",
            close: "Close",
            viewListing: "View listing",
            tabs: { all: "All", buying: "Buying", selling: "Selling", unread: "Unread", archived: "Archived" },
            pick: "Select a conversation",
            archivedPh: "Archiving soon — mute threads here.",
            unreadPh: 'No server-side "read" yet — we surface recent threads first.',
            new: "New",
          },
    [lang]
  );

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<MsgRow[]>([]);
  const [senders, setSenders] = useState<Record<string, ProfileRow>>({});
  const [receivers, setReceivers] = useState<Record<string, ProfileRow>>({});
  const [listingTitles, setListingTitles] = useState<Record<string, string>>({});
  const [listingThumbs, setListingThumbs] = useState<Record<string, string | null>>({});
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan>("free");
  const [accountRef, setAccountRef] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [tab, setTab] = useState<MsgTab>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent("/dashboard/mensajes")}`);
      return;
    }
    setUserId(user.id);
    setAccountRef(accountRefFromId(user.id));
    setEmail(user.email ?? null);
    const meta = user.user_metadata as Record<string, unknown> | undefined;
    setName(
      (typeof meta?.full_name === "string" && meta.full_name.trim()) ||
        (typeof meta?.name === "string" && meta.name.trim()) ||
        null
    );

    const { data: profile } = await supabase.from("profiles").select("display_name, email, membership_tier").eq("id", user.id).maybeSingle();
    const pr = profile as { display_name?: string | null; email?: string | null; membership_tier?: string | null } | null;
    if (pr?.display_name?.trim()) setName(pr.display_name.trim());
    if (pr?.email?.trim()) setEmail(pr.email.trim());
    setPlan(normalizePlanFromMembershipTier(pr?.membership_tier));

    const { data: msgs, error } = await supabase
      .from("messages")
      .select("id, sender_id, receiver_id, listing_id, message, created_at")
      .or(`receiver_id.eq.${user.id},sender_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) {
      setRows([]);
      setLoading(false);
      return;
    }

    const list = (msgs ?? []) as MsgRow[];
    setRows(list);

    const otherIds = [...new Set(list.map((m) => (m.sender_id === user.id ? m.receiver_id : m.sender_id)))];
    if (otherIds.length > 0) {
      const { data: profs } = await supabase.from("profiles").select("id, display_name, email").in("id", otherIds);
      const map: Record<string, ProfileRow> = {};
      for (const p of (profs ?? []) as ProfileRow[]) {
        map[p.id] = p;
      }
      setSenders(map);
      setReceivers(map);
    }

    const uuidIds = [...new Set(list.map((m) => m.listing_id).filter((id) => /^[0-9a-f-]{36}$/i.test(id)))];
    if (uuidIds.length > 0) {
      const { data: lst } = await supabase.from("listings").select("id, title, images").in("id", uuidIds);
      const tm: Record<string, string> = {};
      const th: Record<string, string | null> = {};
      for (const L of (lst ?? []) as Array<{ id: string; title?: string | null; images?: unknown }>) {
        if (L.title) tm[L.id] = String(L.title);
        const im = L.images;
        if (Array.isArray(im) && im.length > 0) {
          const first = im[0];
          if (typeof first === "string" && first.trim()) th[L.id] = first.trim();
          else if (first && typeof first === "object") {
            const u = (first as Record<string, unknown>).url ?? (first as Record<string, unknown>).src;
            if (typeof u === "string" && u.trim()) th[L.id] = u.trim();
          }
        }
      }
      setListingTitles(tm);
      setListingThumbs(th);
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!userId) return [];
    const weekMs = 7 * 24 * 3600 * 1000;
    return rows.filter((m) => {
      if (tab === "archived") return false;
      if (tab === "all") return true;
      if (tab === "buying") return m.sender_id === userId;
      if (tab === "selling") return m.receiver_id === userId;
      if (tab === "unread") {
        const t0 = new Date(m.created_at).getTime();
        return Number.isFinite(t0) && Date.now() - t0 < weekMs;
      }
      return true;
    });
  }, [rows, tab, userId]);

  const selected = selectedId ? rows.find((x) => x.id === selectedId) : null;

  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !filtered.some((x) => x.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const tabBtn = (id: MsgTab, label: string) => (
    <button
      type="button"
      key={id}
      onClick={() => setTab(id)}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold sm:text-sm ${
        tab === id
          ? "bg-gradient-to-r from-[#FBF7EF] to-[#F3EBDD] text-[#1E1810] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-[#C9B46A]/35"
          : "text-[#5C5346] hover:bg-[#FFFCF7]/80"
      }`}
    >
      {label}
    </button>
  );

  function rowLabel(m: MsgRow) {
    if (!userId) return "—";
    const other = m.sender_id === userId ? m.receiver_id : m.sender_id;
    const prof = senders[other] ?? receivers[other];
    return (
      prof?.display_name?.trim() ||
      prof?.email?.trim() ||
      `${other.slice(0, 8)}…`
    );
  }

  return (
    <LeonixDashboardShell lang={lang} activeNav="messages" plan={plan} userName={name} email={email} accountRef={accountRef}>
      {loading ? (
        <div className="rounded-3xl border border-[#E8DFD0] bg-[#FFFCF7]/90 p-10 text-center text-sm text-[#5C5346]">{t.loading}</div>
      ) : (
        <>
          <header>
            <h1 className="text-2xl font-bold tracking-tight text-[#1E1810] sm:text-3xl">{t.title}</h1>
            <p className="mt-2 text-sm text-[#5C5346]/95">{t.subtitle}</p>
          </header>

          <div className="mt-6 flex flex-wrap gap-2 border-b border-[#E8DFD0]/70 pb-4">
            {tabBtn("all", t.tabs.all)}
            {tabBtn("buying", t.tabs.buying)}
            {tabBtn("selling", t.tabs.selling)}
            {tabBtn("unread", t.tabs.unread)}
            {tabBtn("archived", t.tabs.archived)}
          </div>

          {tab === "archived" ? (
            <p className="mt-8 rounded-3xl border border-dashed border-[#E8DFD0] bg-[#FAF7F2]/80 p-8 text-center text-sm text-[#5C5346]">{t.archivedPh}</p>
          ) : filtered.length === 0 ? (
            <p className="mt-8 rounded-3xl border border-[#E8DFD0] bg-[#FFFCF7]/90 p-8 text-center text-sm text-[#5C5346]">{t.empty}</p>
          ) : (
            <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-stretch">
              <div className="w-full shrink-0 lg:max-w-md">
                <ul className="max-h-[min(70vh,560px)] space-y-2 overflow-y-auto pr-1">
                  {filtered.map((m) => {
                    const titleFromDb = listingTitles[m.listing_id];
                    const titleParsed = parseListingTitleFromBody(m.message);
                    const title = titleFromDb || titleParsed || "—";
                    const preview = previewText(m.message);
                    const dt = new Date(m.created_at);
                    const dateStr = Number.isFinite(dt.getTime())
                      ? dt.toLocaleString(lang === "es" ? "es-US" : "en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : m.created_at;
                    const thumb =
                      /^[0-9a-f-]{36}$/i.test(m.listing_id) && listingThumbs[m.listing_id]
                        ? listingThumbs[m.listing_id]
                        : PLACEHOLDER_THUMB;
                    const isNew =
                      tab === "unread" ||
                      (Number.isFinite(dt.getTime()) && Date.now() - dt.getTime() < 72 * 3600 * 1000);
                    const active = selectedId === m.id;

                    return (
                      <li key={m.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(m.id)}
                          className={`flex w-full gap-3 rounded-2xl border p-3 text-left transition ${
                            active
                              ? "border-[#C9B46A]/55 bg-gradient-to-br from-[#FFFCF7] to-[#FAF4EA] shadow-sm"
                              : "border-[#E8DFD0]/90 bg-[#FFFCF7]/95 hover:border-[#C9B46A]/35"
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={thumb ?? PLACEHOLDER_THUMB} alt="" className="h-14 w-14 shrink-0 rounded-xl border border-[#E8DFD0] object-cover" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="line-clamp-2 text-sm font-semibold text-[#1E1810]">{title}</p>
                              {isNew ? (
                                <span className="shrink-0 rounded-full bg-[#C9A84A]/25 px-2 py-0.5 text-[10px] font-extrabold uppercase text-[#4A3F26]">
                                  {t.new}
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-0.5 text-xs font-medium text-[#5C5346]/90">{rowLabel(m)}</p>
                            <p className="mt-1 line-clamp-2 text-xs text-[#3D3428]/90">{preview}</p>
                            <time className="mt-1 block text-[10px] text-[#7A7164]" dateTime={m.created_at}>
                              {dateStr}
                            </time>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="min-h-[320px] min-w-0 flex-1 rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6 shadow-inner">
                {!selected ? (
                  <p className="text-sm text-[#5C5346]/95">{t.pick}</p>
                ) : (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{t.from}</p>
                        <p className="text-lg font-semibold text-[#1E1810]">{rowLabel(selected)}</p>
                      </div>
                      <time className="text-xs text-[#7A7164]" dateTime={selected.created_at}>
                        {new Date(selected.created_at).toLocaleString()}
                      </time>
                    </div>
                    <p className="mt-4 text-sm font-semibold text-[#1E1810]">
                      {listingTitles[selected.listing_id] || parseListingTitleFromBody(selected.message) || "—"}
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-[#5C5346]">
                      {t.listingId}: {parseListingIdFromBody(selected.message) || selected.listing_id}
                    </p>
                    {tab === "unread" ? <p className="mt-3 text-xs text-[#7A7164]/95">{t.unreadPh}</p> : null}
                    <pre className="mt-4 max-h-[min(50vh,420px)] overflow-y-auto whitespace-pre-wrap break-words rounded-2xl border border-[#E8DFD0] bg-white p-4 text-sm text-[#2C2416]">
                      {selected.message}
                    </pre>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {/^[0-9a-f-]{36}$/i.test(selected.listing_id) ? (
                        <Link
                          href={`/clasificados/anuncio/${selected.listing_id}?${q}`}
                          className="inline-flex rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] px-4 py-2 text-sm font-semibold text-[#1E1810] hover:bg-[#FAF7F2]"
                        >
                          {t.viewListing}
                        </Link>
                      ) : null}
                      <Link
                        href={`/dashboard/mis-anuncios?${q}`}
                        className="inline-flex rounded-xl border border-[#C9B46A]/35 bg-[#FBF7EF] px-4 py-2 text-sm font-semibold text-[#5C4E2E]"
                      >
                        {lang === "es" ? "Gestionar anuncios →" : "Manage ads →"}
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </LeonixDashboardShell>
  );
}
