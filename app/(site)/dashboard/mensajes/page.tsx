"use client";

import Link from "next/link";
import {useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { LeonixDashboardShell } from "../components/LeonixDashboardShell";
import { LX_DASH } from "../lib/dashboardLeonixTheme";

export const dynamic = "force-dynamic";

type Lang = "es" | "en";
type Plan = "free" | "pro";

function accountRefFromId(id: string): string {
  const s = (id ?? "").replace(/-/g, "").trim();
  if (s.length < 8) return "—";
  return `${s.slice(0, 4).toUpperCase()}-${s.slice(-4).toUpperCase()}`;
}

function normalizePlanFromMembershipTier(raw: unknown): Plan {
  void raw;
  return "free";
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Package E Build E2, Gate 5 — real message row; no reply capability exists in the underlying
 * `messages` table's application code (buyer-to-seller "contact," never symmetric), so this page
 * is intentionally read-only. Do not add a send/reply UI without a real backend to support it. */
type MessageRow = {
  id: string;
  sender_id: string;
  listing_id: string;
  message: string;
  created_at: string;
  read_at: string | null;
};

type ListingContext = { title: string; href: string } | null;

function MensajesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";
  const q = `lang=${lang}`;

  const t = useMemo(
    () =>
      lang === "es"
        ? {
            title: "Mensajes",
            subtitle: "Contactos reales recibidos en tus anuncios.",
            back: "Volver al resumen",
            next: "Ir a Mis anuncios",
            loading: "Cargando…",
            empty: "No has recibido mensajes todavía.",
            emptyHint: "Cuando alguien te contacte desde uno de tus anuncios, aparecerá aquí.",
            unread: "No leído",
            viewListing: "Ver anuncio",
            unknownListing: "Anuncio de Leonix",
            noReplyNote:
              "Por ahora esta bandeja es de solo lectura. Responde usando el teléfono, WhatsApp o correo visibles en tu anuncio.",
          }
        : {
            title: "Messages",
            subtitle: "Real contact messages received on your listings.",
            back: "Back to overview",
            next: "Go to My listings",
            loading: "Loading…",
            empty: "You haven't received any messages yet.",
            emptyHint: "When someone contacts you from one of your listings, it will show up here.",
            unread: "Unread",
            viewListing: "View listing",
            unknownListing: "Leonix listing",
            noReplyNote:
              "This inbox is read-only for now. Reply using the phone, WhatsApp, or email shown on your listing.",
          },
    [lang]
  );

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan>("free");
  const [accountRef, setAccountRef] = useState<string | null>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [listingContext, setListingContext] = useState<Record<string, ListingContext>>({});
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function run() {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!mounted) return;
      if (!user) {
        router.replace(`/login?redirect=${encodeURIComponent(`/dashboard/mensajes?${q}`)}`);
        return;
      }
      setOwnerId(user.id);
      setAccountRef(accountRefFromId(user.id));
      setEmail(user.email ?? null);
      const meta = user.user_metadata as Record<string, unknown> | undefined;
      setName(
        (typeof meta?.full_name === "string" && meta.full_name.trim()) ||
          (typeof meta?.name === "string" && meta.name.trim()) ||
          null
      );
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, email, membership_tier")
          .eq("id", user.id)
          .maybeSingle();
        const pr = profile as {
          display_name?: string | null;
          email?: string | null;
          membership_tier?: string | null;
        } | null;
        if (pr?.display_name?.trim()) setName(pr.display_name.trim());
        if (pr?.email?.trim()) setEmail(pr.email.trim());
        setPlan(normalizePlanFromMembershipTier(pr?.membership_tier));
      } catch {
        /* ignore */
      }

      // Package E Build E2, Gate 5 — real received messages, RLS-scoped to this receiver.
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("id, sender_id, listing_id, message, created_at, read_at")
          .eq("receiver_id", user.id)
          .order("created_at", { ascending: false })
          .limit(100);
        if (error) throw error;
        const rows = (data ?? []) as MessageRow[];
        if (mounted) setMessages(rows);

        // Best-effort listing context: only resolvable for real UUIDs against the shared
        // `listings` table (the only table any live sender writes against) — synthetic/
        // placeholder ids and other-category rows are shown with a generic label, never a
        // broken/fabricated link.
        const uuidIds = [...new Set(rows.map((m) => m.listing_id).filter((id) => UUID_RE.test(id)))];
        if (uuidIds.length > 0) {
          const { data: listingRows } = await supabase
            .from("listings")
            .select("id, title, category")
            .in("id", uuidIds);
          const ctx: Record<string, ListingContext> = {};
          for (const row of (listingRows ?? []) as Array<{ id: string; title?: string | null; category?: string | null }>) {
            ctx[row.id] = {
              title: row.title?.trim() || t.unknownListing,
              href: `/clasificados/anuncio/${row.id}`,
            };
          }
          if (mounted) setListingContext(ctx);
        }
      } catch {
        if (mounted) setLoadError(true);
      }

      setLoading(false);
    }
    void run();
    return () => {
      mounted = false;
    };
  }, [router, q]);

  const markAsRead = useCallback(async (messageId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId && !m.read_at ? { ...m, read_at: new Date().toISOString() } : m)),
    );
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("id", messageId).is("read_at", null);
    } catch {
      /* best-effort; local state already reflects the read view */
    }
  }, []);

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return "";
    return d.toLocaleString(lang === "es" ? "es-US" : "en-US", { dateStyle: "medium", timeStyle: "short" });
  };

  return (
    <LeonixDashboardShell lang={lang} activeNav="messages" plan={plan} userName={name} email={email} accountRef={accountRef} ownerId={ownerId}>
      {loading ? (
        <div className={`${LX_DASH.panel} p-10 text-center text-sm text-[#5C5346]`}>{t.loading}</div>
      ) : (
        <>
          <header>
            <p className={LX_DASH.contextLabel}>{lang === "es" ? "Bandeja de entrada" : "Inbox"}</p>
            <h1 className={`mt-2 ${LX_DASH.pageTitle}`}>{t.title}</h1>
            <p className={`mt-2 ${LX_DASH.bodyMuted}`}>{t.subtitle}</p>
          </header>

          <p className={`mt-4 ${LX_DASH.notice}`}>{t.noReplyNote}</p>

          {loadError ? (
            <p className={`mt-6 ${LX_DASH.notice}`} role="status">
              {lang === "es" ? "No se pudieron cargar tus mensajes." : "We couldn't load your messages."}
            </p>
          ) : messages.length === 0 ? (
            <div className={`mt-8 ${LX_DASH.disabledPanel}`} role="status">
              <p className="mx-auto max-w-lg text-sm leading-relaxed text-[#3D3428]">{t.empty}</p>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[#5C5346]">{t.emptyHint}</p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link href={`/dashboard/mis-anuncios?${q}`} className={LX_DASH.btnPrimary}>
                  {t.next}
                </Link>
                <Link href={`/dashboard?${q}`} className={LX_DASH.btnSecondary}>
                  {t.back}
                </Link>
              </div>
            </div>
          ) : (
            <ul className="mt-6 space-y-3">
              {messages.map((m) => {
                const ctx = listingContext[m.listing_id];
                const unread = !m.read_at;
                return (
                  <li
                    key={m.id}
                    className={`${LX_DASH.panelCompact} ${unread ? "ring-2 ring-[#C9A84A]/40" : ""}`}
                    onClick={() => unread && void markAsRead(m.id)}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {unread ? (
                          <span className="inline-flex rounded-full bg-[#7A1E2C] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                            {t.unread}
                          </span>
                        ) : null}
                        <span className="text-xs text-[#7A7164]">{fmtDate(m.created_at)}</span>
                      </div>
                      {ctx ? (
                        <Link
                          href={`${ctx.href}?${q}`}
                          className="text-xs font-semibold text-[#7A1E2C] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {t.viewListing}: {ctx.title}
                        </Link>
                      ) : (
                        <span className="text-xs text-[#7A7164]">{t.unknownListing}</span>
                      )}
                    </div>
                    <p className="mt-2 whitespace-pre-line break-words text-sm leading-relaxed text-[#1F241C]">{m.message}</p>
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

export default function MensajesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <MensajesPageContent />
    </Suspense>
  );
}
