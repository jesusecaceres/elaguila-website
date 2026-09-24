"use client";

/**
 * The staff bar that appears inside a category's OWN intake when — and only when — the server says
 * an assisted custody context is live for that category.
 *
 * ONE bar, eight categories. This is what "do not duplicate the eight canonical intakes" looks like
 * in practice: the intake keeps building the ad exactly as it does for a customer, and this strip
 * adds the two staff actions (save the draft for the client, get a private preview link to show
 * them) without the intake having to know anything about custody, tokens or audit.
 *
 * IT DECIDES NOTHING. Visibility comes from a server read, the save goes to the category's real
 * assisted endpoint, and the canonical row id it shows is the one the SERVER returned. A customer
 * loading the same intake gets 401 on that read and never sees this strip — and even if they
 * somehow rendered it, every button behind it is refused server-side.
 */
import { useCallback, useEffect, useState } from "react";
import {
  handleAssistedSaveClick,
  readAssistedCustodyContext,
  type AssistedCustodyContext,
  type AssistedSavePayload,
} from "@/app/lib/sales/assistedSaveForClientClient";
import type { QuickSalesCategory } from "@/app/lib/sales/quickSalesCategories";

export function AssistedSaveForClientBar({
  category,
  lang = "es",
  buildPayload,
}: {
  category: QuickSalesCategory;
  lang?: "es" | "en";
  /** Returns the category's current intake state, or null when it is not saveable yet. */
  buildPayload: (ctx: AssistedCustodyContext) => AssistedSavePayload | null;
}) {
  const [ctx, setCtx] = useState<AssistedCustodyContext | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const next = await readAssistedCustodyContext();
    setCtx(next && next.category === category ? next : null);
  }, [category]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onSave = useCallback(async () => {
    if (!ctx) return;
    const payload = buildPayload(ctx);
    if (!payload) {
      setNote(lang === "en" ? "The ad is not complete enough to save yet." : "El anuncio aún no está listo para guardar.");
      return;
    }
    setBusy(true);
    setNote(null);
    const result = await handleAssistedSaveClick({ category, ctx, payload });
    if (!result.ok) {
      setBusy(false);
      setNote(
        lang === "en"
          ? `Not saved${result.status ? ` (${result.status})` : ""}: ${result.error}`
          : `No se guardó${result.status ? ` (${result.status})` : ""}: ${result.error}`,
      );
      return;
    }
    await refresh();
    setBusy(false);
    setNote(
      lang === "en"
        ? `Saved for the client — draft ${result.listingId ?? ""} (not published)`
        : `Guardado para el cliente — borrador ${result.listingId ?? ""} (sin publicar)`,
    );
  }, [ctx, buildPayload, lang, category, refresh]);

  const onPreview = useCallback(async () => {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/admin/sales-preview/preview-link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
        cache: "no-store",
      });
      const json = (await res.json()) as { ok?: boolean; previewPath?: string; error?: string };
      if (!res.ok || json.ok !== true || !json.previewPath) {
        setNote(lang === "en" ? `No preview link: ${json.error ?? res.status}` : `Sin enlace: ${json.error ?? res.status}`);
        return;
      }
      const url = `${window.location.origin}${json.previewPath}`;
      setPreviewUrl(url);
      try {
        await navigator.clipboard?.writeText(url);
        setNote(lang === "en" ? "Preview link copied." : "Enlace de vista previa copiado.");
      } catch {
        setNote(lang === "en" ? "Preview link ready." : "Enlace de vista previa listo.");
      }
    } finally {
      setBusy(false);
    }
  }, [lang]);

  if (!ctx) return null;

  return (
    <div className="my-4 rounded-xl border border-[#B8860B] bg-[#FFF6E7] p-3 text-sm text-[#2F2A1F]">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#8B6914]">
        Leonix — Venta asistida / Assisted sale
      </p>
      <p className="mb-2 text-xs">
        {lang === "en"
          ? "Saving for the client never publishes the ad."
          : "Guardar para el cliente nunca publica el anuncio."}{" "}
        {ctx.listingId ? (
          <>
            {lang === "en" ? "Canonical draft: " : "Borrador canónico: "}
            <span className="font-mono">{ctx.listingId}</span>
          </>
        ) : null}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          data-staff-save-for-client="true"
          data-staff-save-category={category}
          disabled={busy}
          onClick={() => void onSave()}
          className="min-h-[44px] rounded-full bg-[#3B66AD] px-4 py-2 text-xs font-bold text-white disabled:opacity-45"
        >
          {lang === "en" ? "Save for Client" : "Guardar para Cliente"}
        </button>
        <button
          type="button"
          data-staff-preview-link="true"
          disabled={busy || !ctx.listingId}
          onClick={() => void onPreview()}
          className="min-h-[44px] rounded-full border border-[#B8860B] px-4 py-2 text-xs font-bold disabled:opacity-45"
        >
          {lang === "en" ? "Copy preview link" : "Copiar enlace de vista previa"}
        </button>
      </div>
      {previewUrl ? <code className="mt-2 block break-all text-[11px]">{previewUrl}</code> : null}
      {note ? <p className="mt-2 text-xs">{note}</p> : null}
    </div>
  );
}
