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
  /** Present when `messages.read_at` migration applied */
  read_at?: string | null;
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

function threadKey(m: MsgRow, userId: string): string {
  const other = m.sender_id === userId ? m.receiver_id : m.sender_id;
  return `${m.listing_id}::${other}`;
}

type MsgThread = {
  key: string;
  listing_id: string;
  other_id: string;
  messages: MsgRow[];
  latest: MsgRow;
  unreadCount: number;
};

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
            unreadPh:
              "Con columna read_at: solo hilos con mensajes entrantes sin leer. Sin ella, priorizamos conversaciones recientes.",
            new: "Nuevo",
            threadMeta: "mensajes en este hilo",
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
            unreadPh:
              'With read_at: threads with unread inbound messages. Without it, we still surface recent threads.',
            new: "New",
            threadMeta: "messages in this thread",
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
  const [selectedThreadKey, setSelectedThreadKey] = useState<string | null>(null);

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

    const selFull = "id, sender_id, receiver_id, listing_id, message, created_at, read_at";
    const selLegacy = "id, sender_id, receiver_id, listing_id, message, created_at";
    let list: MsgRow[] = [];
    const first = await supabase
      .from("messages")
      .select(selFull)
      .or(`receiver_id.eq.${user.id},sender_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(300);
    if (first.error) {
      const second = await supabase
        .from("messages")
        .select(selLegacy)
        .or(`receiver_id.eq.${user.id},sender_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(300);
      if (second.error) {
        setRows([]);
        setLoading(false);
        return;
      }
      list = (second.data ?? []) as MsgRow[];
    } else {
      list = (first.data ?? []) as MsgRow[];
    }

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

  const filteredRows = useMemo(() => {
    if (!userId) return [];
    const weekMs = 7 * 24 * 3600 * 1000;
    return rows.filter((m) => {
      if (tab === "archived") return false;
      if (tab === "all") return true;
      if (tab === "buying") return m.sender_id === userId;
      if (tab === "selling") return m.receiver_id === userId;
      if (tab === "unread") {
        if (m.receiver_id === userId && m.read_at == null) return true;
        const t0 = new Date(m.created_at).getTime();
        return Number.isFinite(t0) && Date.now() - t0 < weekMs;
      }
      return true;
    });
  }, [rows, tab, userId]);

  const threads = useMemo(() => {
    if (!userId) return [];
    const map = new Map<string, MsgRow[]>();
    for (const m of filteredRows) {
      const k = threadKey(m, userId);
      const arr = map.get(k) ?? [];
      arr.push(m);
      map.set(k, arr);
    }
    const out: MsgThread[] = [];
    for (const [, msgs] of map) {
      msgs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const latest = msgs[0];
      const other = latest.sender_id === userId ? latest.receiver_id : latest.sender_id;
      const unreadCount = msgs.filter((x) => x.receiver_id === userId && x.read_at == null).length;
      out.push({
        key: threadKey(latest, userId),
        listing_id: latest.listing_id,
        other_id: other,
        messages: msgs,
        latest,
        unreadCount,
      });
    }
    out.sort((a, b) => new Date(b.latest.created_at).getTime() - new Date(a.latest.created_at).getTime());
    return out;
  }, [filteredRows, userId]);

  const selectedThread = selectedThreadKey ? threads.find((x) => x.key === selectedThreadKey) : null;

  useEffect(() => {
    if (threads.length === 0) {
      setSelectedThreadKey(null);
      return;
    }
    if (!selectedThreadKey || !threads.some((x) => x.key === selectedThreadKey)) {
      setSelectedThreadKey(threads[0].key);
    }
  }, [threads, selectedThreadKey]);

  useEffect(() => {
    if (!selectedThreadKey || !userId || !selectedThread) return;
    const inboundUnread = selectedThread.messages.filter(
      (m) => m.receiver_id === userId && m.read_at == null
    );
    if (inboundUnread.length === 0) return;
    const sb = createSupabaseBrowserClient();
    const ts = new Date().toISOString();
    const ids = inboundUnread.map((m) => m.id);
    void (async () => {
      const { error } = await sb.from("messages").update({ read_at: ts }).in("id", ids).eq("receiver_id", userId);
      if (!error) {
        setRows((prev) => prev.map((r) => (ids.includes(r.id) ? { ...r, read_at: ts } : r)));
      }
    })();
  }, [selectedThreadKey, userId, selectedThread]);

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

  function rowLabelForOther(other: string) {
    const prof = senders[other] ?? receivers[other];
    return prof?.display_name?.trim() || prof?.email?.trim() || `${other.slice(0, 8)}…`;
  }

  function rowLabel(m: MsgRow) {
    if (!userId) return "—";
    const other = m.sender_id === userId ? m.receiver_id : m.sender_id;
    return rowLabelForOther(other);
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
          ) : threads.length === 0 ? (
            <p className="mt-8 rounded-3xl border border-[#E8DFD0] bg-[#FFFCF7]/90 p-8 text-center text-sm text-[#5C5346]">{t.empty}</p>
          ) : (
            <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-stretch">
              <div className="w-full shrink-0 lg:max-w-md">
                <ul className="max-h-[min(70vh,560px)] space-y-2 overflow-y-auto pr-1">
                  {threads.map((th) => {
                    const m = th.latest;
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
                    const isNew = th.unreadCount > 0;
                    const active = selectedThreadKey === th.key;

                    return (
                      <li key={th.key}>
                        <button
                          type="button"
                          onClick={() => setSelectedThreadKey(th.key)}
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
                                  {th.unreadCount > 1 ? `${th.unreadCount}` : t.new}
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-0.5 text-xs font-medium text-[#5C5346]/90">{rowLabelForOther(th.other_id)}</p>
                            <p className="mt-1 line-clamp-2 text-xs text-[#3D3428]/90">{preview}</p>
                            <p className="mt-0.5 text-[10px] text-[#7A7164]/90">
                              {th.messages.length} {t.threadMeta}
                            </p>
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
                {!selectedThread ? (
                  <p className="text-sm text-[#5C5346]/95">{t.pick}</p>
                ) : (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{t.from}</p>
                        <p className="text-lg font-semibold text-[#1E1810]">{rowLabelForOther(selectedThread.other_id)}</p>
                      </div>
                      <p className="text-xs text-[#7A7164]">
                        {selectedThread.messages.length}{" "}
                        {lang === "es" ? "mensajes" : "messages"}
                      </p>
                    </div>
                    <p className="mt-4 text-sm font-semibold text-[#1E1810]">
                      {listingTitles[selectedThread.listing_id] ||
                        parseListingTitleFromBody(selectedThread.latest.message) ||
                        "—"}
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-[#5C5346]">
                      {t.listingId}: {parseListingIdFromBody(selectedThread.latest.message) || selectedThread.listing_id}
                    </p>
                    {tab === "unread" ? <p className="mt-3 text-xs text-[#7A7164]/95">{t.unreadPh}</p> : null}
                    <div className="mt-4 max-h-[min(50vh,420px)] space-y-3 overflow-y-auto">
                      {[...selectedThread.messages]
                        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                        .map((msg) => {
                          const mine = userId && msg.sender_id === userId;
                          return (
                            <div
                              key={msg.id}
                              className={`rounded-2xl border px-4 py-3 text-sm ${
                                mine
                                  ? "ml-4 border-[#C9B46A]/35 bg-[#FBF7EF] text-[#2C2416]"
                                  : "mr-4 border-[#E8DFD0] bg-white text-[#2C2416]"
                              }`}
                            >
                              <time className="text-[10px] text-[#7A7164]" dateTime={msg.created_at}>
                                {new Date(msg.created_at).toLocaleString()}
                              </time>
                              <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-[#2C2416]">{msg.message}</pre>
                            </div>
                          );
                        })}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {/^[0-9a-f-]{36}$/i.test(selectedThread.listing_id) ? (
                        <Link
                          href={`/clasificados/anuncio/${selectedThread.listing_id}?${q}`}
                          className="inline-flex rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] px-4 py-2 text-sm font-semibold text-[#1E1810] hover:bg-[#FAF7F2]"
                        >
                          {t.viewListing}
                        </Link>
                      ) : null}
                      <Link
                        href={`/dashboard/mis-anuncios/${selectedThread.listing_id}?${q}`}
                        className="inline-flex rounded-xl border border-[#C9B46A]/35 bg-[#FBF7EF] px-4 py-2 text-sm font-semibold text-[#5C4E2E]"
                      >
                        {lang === "es" ? "Espacio del anuncio →" : "Listing workspace →"}
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
