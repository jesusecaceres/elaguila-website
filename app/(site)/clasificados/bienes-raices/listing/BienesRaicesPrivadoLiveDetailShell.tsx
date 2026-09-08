"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { FiHeart, FiShare2 } from "react-icons/fi";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { trackListingSaveToggleAuthed } from "@/app/lib/analytics/client/listingEngagementRecorder";
import { isSelfEngagement } from "@/app/lib/analytics/selfEngagementGuard";
import { copyToClipboard } from "@/app/components/cta";
import { BienesRaicesPrivadoPreviewView } from "@/app/clasificados/bienes-raices/preview/privado/BienesRaicesPrivadoPreviewView";
import { mapBrListingRowToPrivadoPreviewVm } from "./mapBrListingRowToPrivadoPreviewVm";
import type { BienesLiveListingLike } from "./BienesRaicesNegocioLiveDetailShell";

type Lang = "es" | "en";

/**
 * Gate I.5.4A — published Bienes Raíces Privado detail shell. Reuses the exact, approved
 * `BienesRaicesPrivadoPreviewView` renderer the seller already saw in their own preview (via
 * `mapBrListingRowToPrivadoPreviewVm`, the published-row equivalent of the draft-state mapper
 * preview already uses) — no duplicate JSX tree, no copy of `BienesRaicesNegocioLiveDetailShell`'s
 * agent-schema reconstruction. Structured identically to that sibling shell (same back-link/
 * save/share/Leonix-Ad-ID chrome pattern) so the two lanes stay visually consistent as siblings,
 * without sharing rendering logic that doesn't apply to Privado (no business inventory, no
 * sibling-portfolio rail — Privado never has parent/child inventory).
 */
function PrivadoPublicChromeActions({
  listingId,
  lang,
  ownerId,
}: {
  listingId: string;
  lang: Lang;
  ownerId?: string | null;
}) {
  const [saved, setSaved] = useState(false);
  const [copyHint, setCopyHint] = useState("");

  const save = useCallback(async () => {
    const sb = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) {
      const here = `${window.location.pathname}${window.location.search || ""}`;
      window.location.href = `/login?redirect=${encodeURIComponent(here)}`;
      return;
    }
    if (isSelfEngagement(user.id, ownerId)) return;
    if (saved) {
      await sb.from("saved_listings").delete().eq("user_id", user.id).eq("listing_id", listingId);
      setSaved(false);
      void trackListingSaveToggleAuthed(
        { sourceTable: "listings", sourceId: listingId, category: "bienes-raices" },
        false,
        { eventSource: "detail" },
      );
    } else {
      await sb.from("saved_listings").insert({ user_id: user.id, listing_id: listingId });
      setSaved(true);
      void trackListingSaveToggleAuthed(
        { sourceTable: "listings", sourceId: listingId, category: "bienes-raices" },
        true,
        { eventSource: "detail" },
      );
    }
  }, [listingId, ownerId, saved]);

  const share = useCallback(async () => {
    const ok = await copyToClipboard(window.location.href);
    setCopyHint(ok ? (lang === "en" ? "Copied" : "Copiado") : "");
    window.setTimeout(() => setCopyHint(""), 1800);
  }, [lang]);

  return (
    <div className="flex min-w-0 items-center justify-end gap-1.5">
      <button
        type="button"
        onClick={save}
        className="inline-flex min-h-9 items-center gap-1 rounded-full border bg-white/90 px-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#5C4A28] transition hover:bg-[#FFF6E7]"
        style={{ borderColor: "rgba(201, 180, 106, 0.42)" }}
      >
        <FiHeart className={saved ? "h-3.5 w-3.5 fill-current" : "h-3.5 w-3.5"} aria-hidden />
        <span className="hidden sm:inline">{saved ? (lang === "en" ? "Saved" : "Guardado") : lang === "en" ? "Save" : "Guardar"}</span>
      </button>
      <button
        type="button"
        onClick={share}
        className="inline-flex min-h-9 items-center gap-1 rounded-full border bg-white/90 px-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#5C4A28] transition hover:bg-[#FFF6E7]"
        style={{ borderColor: "rgba(201, 180, 106, 0.42)" }}
      >
        <FiShare2 className="h-3.5 w-3.5" aria-hidden />
        <span className="hidden sm:inline">{copyHint || (lang === "en" ? "Share" : "Compartir")}</span>
      </button>
    </div>
  );
}

export function BienesRaicesPrivadoLiveDetailShell({ listing, lang }: { listing: BienesLiveListingLike; lang: Lang }) {
  const vm = mapBrListingRowToPrivadoPreviewVm(listing, lang);

  return (
    <div className="bg-[#F9F6F1] pt-24 sm:pt-28">
      <div className="mx-auto max-w-[1140px] px-4 pb-4 sm:px-6 lg:px-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/clasificados/bienes-raices/resultados?lang=${lang}`}
            className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6E5418] underline-offset-4 hover:underline sm:text-xs"
          >
            {lang === "en" ? "Back to Real estate" : "Volver a Bienes Raíces"}
          </Link>
          <PrivadoPublicChromeActions listingId={listing.id} lang={lang} ownerId={listing.owner_id} />
        </div>
        {listing.leonix_ad_id ? (
          <p className="mt-2 text-[11px] font-medium text-[#7A7164]">
            {listing.leonix_ad_id} · {lang === "en" ? "Published listing" : "Anuncio publicado"}
          </p>
        ) : null}
      </div>
      <BienesRaicesPrivadoPreviewView vm={vm} lang={lang} />
    </div>
  );
}
