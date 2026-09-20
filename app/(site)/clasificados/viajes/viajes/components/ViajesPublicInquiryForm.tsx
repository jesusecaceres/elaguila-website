"use client";

import { useState } from "react";

import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

import type { ViajesUi } from "../data/viajesUiCopy";

type Props = {
  stagedListingId: string;
  copy: ViajesUi["offerDetail"]["inquiry"];
};

export function ViajesPublicInquiryForm({ stagedListingId, copy }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setErr(null);
    setDone(null);
    try {
      const sb = createSupabaseBrowserClient();
      const { data } = await sb.auth.getSession();
      const token = data.session?.access_token;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch("/api/clasificados/viajes/inquiry", {
        method: "POST",
        headers,
        body: JSON.stringify({
          stagedListingId,
          message: message.trim(),
          buyerName: name.trim(),
          buyerEmail: email.trim(),
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        if (json.error === "missing_buyer_identity") {
          setErr(copy.errMissingIdentity);
        } else {
          setErr(json.error ?? copy.errGeneric);
        }
        return;
      }
      setDone(copy.success);
      setMessage("");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2.5 text-sm text-[color:var(--lx-text)] outline-none focus:border-[color:var(--lx-gold)]/50";

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-lg font-bold text-[color:var(--lx-text)]">{copy.title}</h3>
        <p className="mt-1 text-sm text-[color:var(--lx-muted)]">{copy.subline}</p>
      </div>
      {done ? <p className="text-sm font-semibold text-emerald-800">{done}</p> : null}
      {err ? <p className="text-sm font-semibold text-red-800">{err}</p> : null}
      <label className="block text-xs font-semibold text-[color:var(--lx-text-2)]">
        {copy.nameLabel}
        <input
          className={field}
          data-testid="viajes-inquiry-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
        />
      </label>
      <label className="block text-xs font-semibold text-[color:var(--lx-text-2)]">
        {copy.emailLabel}
        <input
          className={field}
          data-testid="viajes-inquiry-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </label>
      <label className="block text-xs font-semibold text-[color:var(--lx-text-2)]">
        {copy.messageLabel}
        <textarea
          className={`${field} min-h-[100px]`}
          data-testid="viajes-inquiry-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </label>
      <p className="text-xs text-[color:var(--lx-muted)]">{copy.signedInHint}</p>
      <button
        type="button"
        data-testid="viajes-inquiry-submit"
        onClick={() => void submit()}
        disabled={busy}
        className="inline-flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-2xl bg-[color:var(--lx-gold)] px-5 py-3 text-sm font-bold text-[color:var(--lx-text)] shadow-sm transition hover:brightness-95 disabled:opacity-60"
      >
        {busy ? copy.sending : copy.submit}
      </button>
    </div>
  );
}
