"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { leonixLiveAnuncioPath } from "@/app/clasificados/lib/leonixRealEstateListingContract";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

export function BrPagoExitoClient() {
  const sp = useSearchParams();
  const qs = sp ?? new URLSearchParams();
  const lang = qs.get("lang") === "en" ? "en" : "es";
  const sessionId = qs.get("session_id")?.trim() ?? "";
  const internal = qs.get("internal") === "1";
  const internalListingId = qs.get("listing_id")?.trim() ?? "";
  const [liveUrl, setLiveUrl] = useState<string | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (internal && internalListingId) {
      let cancelled = false;
      void (async () => {
        const sb = createSupabaseBrowserClient();
        const { data } = await sb.auth.getSession();
        const token = data.session?.access_token;
        if (!token) {
          if (!cancelled) setErr(true);
          return;
        }
        const r = await fetch("/api/clasificados/leonix/stripe/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ listingId: internalListingId, lang }),
        });
        const j = (await r.json()) as { ok?: boolean; liveUrl?: string; successUrl?: string };
        if (cancelled) return;
        if (r.ok && j.liveUrl) {
          setLiveUrl(j.liveUrl);
          return;
        }
        setErr(true);
      })();
      return () => {
        cancelled = true;
      };
    }

    if (!sessionId) {
      setErr(true);
      return;
    }
    let cancelled = false;
    void (async () => {
      const r = await fetch(
        `/api/clasificados/leonix/stripe/checkout/verify?session_id=${encodeURIComponent(sessionId)}&lang=${lang}`,
      );
      const j = (await r.json()) as { ok?: boolean; liveUrl?: string };
      if (cancelled) return;
      if (r.ok && j.liveUrl) {
        setLiveUrl(j.liveUrl);
        return;
      }
      setErr(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, lang, internal, internalListingId]);

  const title = lang === "es" ? "Pago confirmado" : "Payment confirmed";
  const body =
    lang === "es"
      ? "Tu anuncio de Bienes Raíces está activo."
      : "Your Bienes Raíces listing is now live.";

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="font-serif text-2xl font-bold text-[#1E1810]">{title}</h1>
      {err ? (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {lang === "es"
            ? "No pudimos verificar el pago. Si ya pagaste, espera un momento o contacta a Leonix."
            : "We could not verify payment. If you already paid, wait a moment or contact Leonix."}
        </p>
      ) : liveUrl ? (
        <>
          <p className="mt-4 text-sm text-[#5C5346]">{body}</p>
          <Link
            href={liveUrl}
            className="mt-8 inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#1E1810] px-8 text-sm font-bold uppercase tracking-wide text-[#F9F6F1]"
          >
            {lang === "es" ? "Ver anuncio publicado" : "View live listing"}
          </Link>
        </>
      ) : (
        <p className="mt-4 text-sm text-[#5C5346]">{lang === "es" ? "Verificando pago…" : "Verifying payment…"}</p>
      )}
      {!liveUrl && internalListingId ? (
        <p className="mt-6 text-xs text-[#7A7164]">
          ID: {internalListingId} · {leonixLiveAnuncioPath(internalListingId)}
        </p>
      ) : null}
    </div>
  );
}
