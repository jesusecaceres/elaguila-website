"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { leonixLiveAnuncioPath } from "@/app/clasificados/lib/leonixRealEstateListingContract";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

type InventoryRow = {
  id: string;
  leonix_ad_id?: string | null;
  title?: string | null;
  inventory_role?: string | null;
  br_inventory_parent_listing_id?: string | null;
};

type SuccessSummary = {
  listingId: string;
  liveUrl: string;
  leonixAdId: string | null;
  title: string | null;
  children: Array<{ id: string; leonixAdId: string | null; title: string | null }>;
};

export function BrPagoExitoClient() {
  const sp = useSearchParams();
  const qs = sp ?? new URLSearchParams();
  const lang = qs.get("lang") === "en" ? "en" : "es";
  const sessionId = qs.get("session_id")?.trim() ?? "";
  const internal = qs.get("internal") === "1";
  const internalListingId = qs.get("listing_id")?.trim() ?? "";
  const [summary, setSummary] = useState<SuccessSummary | null>(null);
  const [err, setErr] = useState(false);

  async function loadInventorySummary(listingId: string, liveUrl: string): Promise<SuccessSummary> {
    const sb = createSupabaseBrowserClient();
    const { data: parent } = await sb
      .from("listings")
      .select("id, leonix_ad_id, title, inventory_role, br_inventory_group_id, br_inventory_parent_listing_id")
      .eq("id", listingId)
      .maybeSingle();
    const parentRow = parent as
      | (InventoryRow & { br_inventory_group_id?: string | null })
      | null;
    const groupId = String(parentRow?.br_inventory_group_id ?? "").trim() || listingId;
    let children: SuccessSummary["children"] = [];
    if (groupId) {
      const { data: sibs } = await sb
        .from("listings")
        .select("id, leonix_ad_id, title, inventory_role, br_inventory_parent_listing_id")
        .eq("category", "bienes-raices")
        .eq("br_inventory_group_id", groupId)
        .neq("id", listingId)
        .order("created_at", { ascending: true });
      children = ((sibs ?? []) as InventoryRow[])
        .filter((r) => String(r.inventory_role ?? "") === "inventory_property" || Boolean(r.br_inventory_parent_listing_id))
        .map((r) => ({
          id: r.id,
          leonixAdId: r.leonix_ad_id?.trim() || null,
          title: r.title?.trim() || null,
        }));
    }
    return {
      listingId,
      liveUrl,
      leonixAdId: parentRow?.leonix_ad_id?.trim() || null,
      title: parentRow?.title?.trim() || null,
      children,
    };
  }

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
        const j = (await r.json()) as { ok?: boolean; liveUrl?: string; listingId?: string };
        if (cancelled) return;
        if (r.ok && j.liveUrl) {
          const id = String(j.listingId ?? internalListingId).trim();
          const next = await loadInventorySummary(id, j.liveUrl);
          if (!cancelled) setSummary(next);
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
      const j = (await r.json()) as { ok?: boolean; liveUrl?: string; listingId?: string };
      if (cancelled) return;
      if (r.ok && j.liveUrl && j.listingId) {
        const next = await loadInventorySummary(j.listingId, j.liveUrl);
        if (!cancelled) setSummary(next);
        return;
      }
      setErr(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, lang, internal, internalListingId]);

  const title = lang === "es" ? "Publicación confirmada" : "Publication confirmed";
  const body =
    lang === "es"
      ? "Tu anuncio de Bienes Raíces quedó activo en Leonix."
      : "Your Bienes Raíces listing is now live on Leonix.";
  const lifecycle =
    lang === "es"
      ? "Ciclo de vida Bienes: activo mientras el plan/pago y el estado del anuncio lo permitan. Puedes pausar, marcar vendido o archivar desde Mi panel. Republicar crea una identidad nueva; refrescar (si aplica) mantiene el mismo ID Leonix."
      : "Bienes lifecycle: stays active while listing status and payment allow it. Pause, mark sold, or archive from My Listings. Republish creates a new identity; refresh (when available) keeps the same Leonix ID.";
  const safety =
    lang === "es"
      ? "Si ves algo ilegal o sospechoso en un anuncio público, usa Reportar anuncio. El equipo revisa en Admin → Reportes."
      : "If you see something illegal or unsafe on a public listing, use Report listing. Staff reviews it in Admin → Reports.";

  const dashHref = lang === "en" ? "/dashboard/mis-anuncios?lang=en&cat=bienes-raices" : "/dashboard/mis-anuncios?cat=bienes-raices";
  const publishHref = lang === "en" ? "/publicar/bienes-raices?lang=en" : "/publicar/bienes-raices";

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="font-serif text-2xl font-bold text-[#1E1810]">{title}</h1>
      {err ? (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {lang === "es"
            ? "No pudimos verificar el pago. Si ya pagaste, espera un momento o contacta a Leonix."
            : "We could not verify payment. If you already paid, wait a moment or contact Leonix."}
        </p>
      ) : summary ? (
        <>
          <p className="mt-4 text-sm text-[#5C5346]">{body}</p>
          {summary.title ? <p className="mt-3 text-sm font-semibold text-[#2C2416]">{summary.title}</p> : null}
          {summary.leonixAdId ? (
            <p className="mt-2 font-mono text-xs text-[#7A7164]">
              {lang === "es" ? "ID Leonix (principal)" : "Leonix ID (parent)"}: {summary.leonixAdId}
            </p>
          ) : (
            <p className="mt-2 font-mono text-[11px] text-[#7A7164]">
              {lang === "es" ? "UUID interno" : "Internal UUID"}: {summary.listingId}
            </p>
          )}
          {summary.children.length > 0 ? (
            <div className="mt-4 rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] px-4 py-3 text-left text-xs text-[#5C5346]">
              <p className="font-semibold text-[#2C2416]">
                {lang === "es"
                  ? `Inventario publicado (${summary.children.length})`
                  : `Published inventory (${summary.children.length})`}
              </p>
              <ul className="mt-2 space-y-1.5">
                {summary.children.map((c) => (
                  <li key={c.id}>
                    <span className="font-medium text-[#2C2416]">{c.title || c.id}</span>
                    {c.leonixAdId ? (
                      <span className="mt-0.5 block font-mono text-[11px] text-[#7A7164]">
                        {lang === "es" ? "ID Leonix" : "Leonix ID"}: {c.leonixAdId}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="mt-8 flex flex-col items-stretch gap-3">
            <Link
              href={summary.liveUrl}
              className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#1E1810] px-8 text-sm font-bold uppercase tracking-wide text-[#F9F6F1]"
            >
              {lang === "es" ? "Ver anuncio público" : "View public listing"}
            </Link>
            <Link
              href={dashHref}
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[#E8DFD0] bg-white px-6 text-sm font-semibold text-[#2C2416]"
            >
              {lang === "es" ? "Ir a Mi panel" : "Go to dashboard"}
            </Link>
            <Link
              href={publishHref}
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[#C9B46A]/50 bg-[#FFF8E8] px-6 text-sm font-semibold text-[#5C4A28]"
            >
              {lang === "es" ? "Publicar otra propiedad" : "Publish another property"}
            </Link>
          </div>
          <p className="mt-8 text-left text-xs leading-relaxed text-[#7A7164]">{lifecycle}</p>
          <p className="mt-3 text-left text-xs leading-relaxed text-[#7A7164]">{safety}</p>
        </>
      ) : (
        <p className="mt-4 text-sm text-[#5C5346]">{lang === "es" ? "Verificando pago…" : "Verifying payment…"}</p>
      )}
      {!summary && internalListingId ? (
        <p className="mt-6 text-xs text-[#7A7164]">
          ID: {internalListingId} · {leonixLiveAnuncioPath(internalListingId)}
        </p>
      ) : null}
    </div>
  );
}
