"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { LeonixDashboardShell } from "../components/LeonixDashboardShell";

type Lang = "es" | "en";
type Plan = "free" | "pro";

type MsgRow = {
  id: string;
  sender_id: string;
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

export default function MensajesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";

  const t = useMemo(
    () =>
      lang === "es"
        ? {
            title: "Mensajes",
            subtitle: "Consultas Leonix recibidas sobre tus anuncios.",
            empty: "Aún no tienes consultas.",
            loading: "Cargando…",
            listingId: "ID",
            from: "De",
            detail: "Ver mensaje completo",
            close: "Cerrar",
            viewListing: "Ver anuncio",
          }
        : {
            title: "Messages",
            subtitle: "Leonix inquiries received about your listings.",
            empty: "No inquiries yet.",
            loading: "Loading…",
            listingId: "ID",
            from: "From",
            detail: "View full message",
            close: "Close",
            viewListing: "View listing",
          },
    [lang]
  );

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<MsgRow[]>([]);
  const [senders, setSenders] = useState<Record<string, ProfileRow>>({});
  const [listingTitles, setListingTitles] = useState<Record<string, string>>({});
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan>("free");
  const [accountRef, setAccountRef] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent("/dashboard/mensajes")}`);
      return;
    }
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
      .select("id, sender_id, listing_id, message, created_at")
      .eq("receiver_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      setRows([]);
      setLoading(false);
      return;
    }

    const list = (msgs ?? []) as MsgRow[];
    setRows(list);

    const senderIds = [...new Set(list.map((m) => m.sender_id))];
    if (senderIds.length > 0) {
      const { data: profs } = await supabase.from("profiles").select("id, display_name, email").in("id", senderIds);
      const map: Record<string, ProfileRow> = {};
      for (const p of (profs ?? []) as ProfileRow[]) {
        map[p.id] = p;
      }
      setSenders(map);
    }

    const uuidIds = [...new Set(list.map((m) => m.listing_id).filter((id) => /^[0-9a-f-]{36}$/i.test(id)))];
    if (uuidIds.length > 0) {
      const { data: lst } = await supabase.from("listings").select("id, title").in("id", uuidIds);
      const tm: Record<string, string> = {};
      for (const L of (lst ?? []) as Array<{ id: string; title?: string | null }>) {
        if (L.title) tm[L.id] = String(L.title);
      }
      setListingTitles(tm);
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <LeonixDashboardShell
      lang={lang}
      activeNav="messages"
      plan={plan}
      userName={name}
      email={email}
      accountRef={accountRef}
    >
      {loading ? (
        <div className="rounded-3xl border border-[#E8DFD0] bg-[#FFFCF7]/90 p-10 text-center text-sm text-[#5C5346]">{t.loading}</div>
      ) : (
        <>
          <header>
            <h1 className="text-2xl font-bold tracking-tight text-[#1E1810] sm:text-3xl">{t.title}</h1>
            <p className="mt-2 text-sm text-[#5C5346]/95">{t.subtitle}</p>
          </header>

          {rows.length === 0 ? (
            <p className="mt-8 rounded-3xl border border-[#E8DFD0] bg-[#FFFCF7]/90 p-8 text-center text-sm text-[#5C5346]">{t.empty}</p>
          ) : (
            <ul className="mt-8 space-y-3">
              {rows.map((m) => {
                const sender = senders[m.sender_id];
                const fromLabel =
                  sender?.display_name?.trim() ||
                  sender?.email?.trim() ||
                  `${m.sender_id.slice(0, 8)}…`;
                const titleFromDb = listingTitles[m.listing_id];
                const titleParsed = parseListingTitleFromBody(m.message);
                const title = titleFromDb || titleParsed || "—";
                const idParsed = parseListingIdFromBody(m.message);
                const listingKey = idParsed || m.listing_id;
                const isUuid = /^[0-9a-f-]{36}$/i.test(m.listing_id);
                const preview = previewText(m.message);
                const dt = new Date(m.created_at);
                const dateStr = Number.isFinite(dt.getTime())
                  ? dt.toLocaleString(lang === "es" ? "es-US" : "en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : m.created_at;

                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => setExpandedId((id) => (id === m.id ? null : m.id))}
                      className="w-full rounded-2xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-4 text-left shadow-sm transition hover:border-[#C9B46A]/45"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{t.from}</p>
                          <p className="text-sm font-semibold text-[#1E1810]">{fromLabel}</p>
                          {sender?.email ? <p className="text-xs text-[#5C5346]/90">{sender.email}</p> : null}
                        </div>
                        <time className="text-xs text-[#7A7164]" dateTime={m.created_at}>
                          {dateStr}
                        </time>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-[#1E1810] line-clamp-2">{title}</p>
                      <p className="mt-1 font-mono text-[11px] text-[#5C5346]">
                        {t.listingId}: {listingKey}
                      </p>
                      <p className="mt-2 text-sm text-[#3D3428]/90 line-clamp-3">{preview}</p>
                      <p className="mt-2 text-xs font-semibold text-[#6B5B2E]">{t.detail}</p>
                    </button>

                    {expandedId === m.id ? (
                      <div className="mt-2 rounded-2xl border border-[#E8DFD0] bg-white p-4">
                        <pre className="whitespace-pre-wrap break-words text-sm text-[#2C2416]">{m.message}</pre>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {isUuid ? (
                            <Link
                              href={`/clasificados/anuncio/${m.listing_id}?lang=${lang}`}
                              className="inline-flex rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] px-4 py-2 text-sm font-semibold text-[#1E1810] hover:bg-[#FAF7F2]"
                            >
                              {t.viewListing}
                            </Link>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => setExpandedId(null)}
                            className="inline-flex rounded-xl border border-[#E8DFD0] px-4 py-2 text-sm font-semibold text-[#5C5346] hover:bg-[#FFFCF7]"
                          >
                            {t.close}
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </LeonixDashboardShell>
  );
}
