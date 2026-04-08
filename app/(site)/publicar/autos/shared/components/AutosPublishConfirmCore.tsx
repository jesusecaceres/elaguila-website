"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import type { AutosClassifiedsLane } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";
import type { AutosPublishFlowLang } from "@/app/clasificados/autos/lib/autosPublishFlowCopy";
import { getAutosPublishFlowCopy } from "@/app/clasificados/autos/lib/autosPublishFlowCopy";

function sessionKey(lane: AutosClassifiedsLane) {
  return `lx-autos-publish-listing-${lane}`;
}

export function AutosPublishConfirmCore({
  lane,
  lang,
  listing,
  hydrated,
  flushDraft,
  editHref,
}: {
  lane: AutosClassifiedsLane;
  lang: AutosPublishFlowLang;
  listing: AutoDealerListing;
  hydrated: boolean;
  flushDraft: () => Promise<void>;
  editHref: string;
}) {
  const c = getAutosPublishFlowCopy(lang, lane);
  const [listingId, setListingId] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "preparing" | "ready" | "error">("idle");
  const [checks, setChecks] = useState([false, false, false]);
  const [payBusy, setPayBusy] = useState(false);
  const [sessionMissing, setSessionMissing] = useState(false);
  const listingRef = useRef(listing);
  listingRef.current = listing;

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    setPhase("preparing");
    void (async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (cancelled) return;
      if (!token) {
        setSessionMissing(true);
        setPhase("ready");
        return;
      }
      setSessionMissing(false);
      const sk = sessionKey(lane);
      const cached = typeof window !== "undefined" ? window.sessionStorage.getItem(sk) : null;
      if (cached) {
        const r = await fetch(`/api/clasificados/autos/listings/${cached}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        if (r.ok) {
          const j = (await r.json()) as { status?: string };
          if (j.status === "draft" || j.status === "pending_payment") {
            setListingId(cached);
            setPhase("ready");
            return;
          }
        }
        window.sessionStorage.removeItem(sk);
      }
      await flushDraft();
      if (cancelled) return;
      const res = await fetch("/api/clasificados/autos/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ listing: listingRef.current, lane, lang }),
      });
      const j = (await res.json()) as { ok?: boolean; id?: string };
      if (cancelled) return;
      if (!res.ok || !j.id) {
        setPhase("error");
        return;
      }
      window.sessionStorage.setItem(sk, j.id);
      setListingId(j.id);
      setPhase("ready");
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, lane, lang, flushDraft]);

  const allChecked = checks.every(Boolean);
  const loginHref =
    typeof window !== "undefined"
      ? `/clasificados/login?lang=${lang}&redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`
      : `/clasificados/login?lang=${lang}`;

  if (!hydrated || phase === "preparing" || phase === "idle") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center text-[color:var(--lx-text)]">
        <p className="text-sm font-semibold">{c.preparing}</p>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-[color:var(--lx-text)]">
        <p className="font-semibold">{c.createError}</p>
        <Link href={editHref} className="mt-6 inline-block text-sm font-bold text-[color:var(--lx-gold)]">
          {c.backEdit}
        </Link>
      </div>
    );
  }

  if (sessionMissing) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-[color:var(--lx-text)]">
        <h1 className="text-2xl font-bold">{c.loginRequiredTitle}</h1>
        <p className="mt-2 text-sm text-[color:var(--lx-text-2)]">{c.loginRequiredBody}</p>
        <a
          href={loginHref}
          className="mt-8 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[color:var(--lx-cta-dark)] px-6 text-sm font-bold text-[#FFFCF7]"
        >
          {c.loginCta}
        </a>
        <div className="mt-6">
          <Link href={editHref} className="text-sm font-semibold text-[color:var(--lx-gold)]">
            {c.backEdit}
          </Link>
        </div>
      </div>
    );
  }

  async function startCheckout() {
    if (!listingId || !allChecked) return;
    const supabase = createSupabaseBrowserClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return;
    setPayBusy(true);
    const res = await fetch("/api/clasificados/autos/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ listingId, lang }),
    });
    const j = (await res.json()) as { ok?: boolean; url?: string };
    setPayBusy(false);
    if (res.ok && j.url) {
      window.location.href = j.url;
      return;
    }
    setPhase("error");
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10 text-[color:var(--lx-text)]">
      <h1 className="text-2xl font-bold">{c.title}</h1>
      <p className="mt-2 text-sm text-[color:var(--lx-text-2)]">{c.subtitle}</p>
      <dl className="mt-8 space-y-2 rounded-[16px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-[color:var(--lx-muted)]">{c.laneLine}</dt>
          <dd className="font-semibold text-right">{c.laneValue}</dd>
        </div>
      </dl>
      <ul className="mt-8 space-y-4">
        {[0, 1, 2].map((i) => (
          <li key={i}>
            <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed">
              <input
                type="checkbox"
                className="mt-1 rounded border-[color:var(--lx-nav-border)]"
                checked={checks[i]!}
                onChange={(e) => {
                  const next = [...checks];
                  next[i] = e.target.checked;
                  setChecks(next);
                }}
              />
              <span>{[c.checks.accurate, c.checks.rules, c.checks.paid][i]}</span>
            </label>
          </li>
        ))}
      </ul>
      {!allChecked ? <p className="mt-4 text-xs text-[color:var(--lx-muted)]">{c.mustCheck}</p> : null}
      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          disabled={!listingId || !allChecked || payBusy}
          onClick={() => void startCheckout()}
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[color:var(--lx-cta-dark)] px-6 text-sm font-bold text-[#FFFCF7] disabled:opacity-50"
        >
          {payBusy ? c.payBusy : c.payCta}
        </button>
        <Link
          href={editHref}
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-[color:var(--lx-nav-border)] px-6 text-sm font-bold text-[color:var(--lx-text)]"
        >
          {c.backEdit}
        </Link>
      </div>
    </div>
  );
}
