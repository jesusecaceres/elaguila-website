"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FiHeart, FiShare2 } from "react-icons/fi";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { trackListingSaveToggleAuthed } from "@/app/lib/analytics/client/listingEngagementRecorder";
import { isSelfEngagement } from "@/app/lib/analytics/selfEngagementGuard";
import { copyToClipboard } from "@/app/components/cta";
import { listingsQueryWithSelectShrink } from "@/app/(site)/clasificados/lib/listingsSelectShrink";
import { BrAgenteResidencialLocaleProvider } from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/application/BrAgenteResidencialLocaleContext";
import { AgenteIndividualResidencialPreviewPage } from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewPage";
import { brAnalyticsContextFromListing } from "@/app/lib/clasificados/bienes-raices/brGlobalAnalytics";
import type { AgenteIndividualResidencialFormState } from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteIndividualResidencialFormState";
import { parseBienesAgenteResidencialPublishedState } from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/parseBienesAgenteResidencialPublishedState";
import { RelatedBrAgentProperties } from "@/app/clasificados/bienes-raices/components/RelatedBrAgentProperties";
import { fetchBrRelatedInventoryListingsForDetail } from "@/app/clasificados/bienes-raices/lib/fetchBrRelatedInventoryListingsBrowser";
import type { BrNegocioListing } from "@/app/clasificados/bienes-raices/resultados/cards/listingTypes";

type Lang = "es" | "en";

export type BienesLiveListingLike = {
  id: string;
  title: { es: string; en: string };
  priceLabel: { es: string; en: string };
  city: string;
  blurb: { es: string; en: string };
  images?: string[] | null;
  businessName?: string | null;
  business_name?: string | null;
  business_meta?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  detailPairs?: unknown;
  owner_id?: string | null;
  leonix_ad_id?: string | null;
  br_inventory_group_id?: string | null;
  br_inventory_parent_listing_id?: string | null;
  inventory_role?: string | null;
  zip?: string | null;
};

type ParentIdentityRow = {
  id: string;
  business_name?: string | null;
  business_meta?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
};

const PARENT_SELECT =
  "id, business_name, business_meta, contact_phone, contact_email, status, is_published, category, seller_type";


function PublicChromeActions({
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

export function BienesRaicesNegocioLiveDetailShell({
  listing,
  lang,
}: {
  listing: BienesLiveListingLike;
  lang: Lang;
}) {
  const [parentIdentity, setParentIdentity] = useState<ParentIdentityRow | null>(null);
  const [portfolio, setPortfolio] = useState<BrNegocioListing[]>([]);
  const parentId = listing.br_inventory_parent_listing_id?.trim() || null;
  const groupId = listing.br_inventory_group_id?.trim() || listing.id;
  const isChild = listing.inventory_role === "inventory_property" && Boolean(parentId);

  useEffect(() => {
    let cancelled = false;
    if (!parentId) {
      setParentIdentity(null);
      return;
    }
    void (async () => {
      const sb = createSupabaseBrowserClient();
      const result = await listingsQueryWithSelectShrink<Record<string, unknown> | null>(PARENT_SELECT, async (cols) => {
        const res = await sb
          .from("listings")
          .select(cols)
          .eq("id", parentId)
          .eq("category", "bienes-raices")
          .eq("status", "active")
          .eq("is_published", true)
          .maybeSingle();
        return { data: (res.data as Record<string, unknown> | null) ?? null, error: res.error ? { message: res.error.message } : null };
      });
      if (!cancelled) setParentIdentity(result.data ? (result.data as ParentIdentityRow) : null);
    })();
    return () => {
      cancelled = true;
    };
  }, [parentId]);

  useEffect(() => {
    let cancelled = false;
    void fetchBrRelatedInventoryListingsForDetail({
      currentListingId: listing.id,
      ownerId: listing.owner_id,
      brInventoryGroupId: groupId,
      brInventoryParentListingId: listing.br_inventory_parent_listing_id,
      currentInventoryRole: listing.inventory_role,
      lang,
      limit: 4,
    }).then((rows) => {
      if (!cancelled) setPortfolio(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [groupId, lang, listing.br_inventory_parent_listing_id, listing.id, listing.inventory_role, listing.owner_id]);

  const data = useMemo(
    () => parseBienesAgenteResidencialPublishedState({ listing, parentIdentity, lang }),
    [lang, listing, parentIdentity],
  );
  // Package D Build D2, Gate 6A — real listing identity so the contact sidebar's CTAs track
  // truthfully on this live, published detail render only.
  const analyticsContext = useMemo(
    () => brAnalyticsContextFromListing({ id: listing.id, leonix_ad_id: listing.leonix_ad_id }),
    [listing.id, listing.leonix_ad_id],
  );

  return (
    <BrAgenteResidencialLocaleProvider>
      <div className="bg-[#F9F6F1]">
        <AgenteIndividualResidencialPreviewPage
          data={data}
          analyticsContext={analyticsContext}
          ownerId={listing.owner_id}
          publicChrome={{
            eyebrow: (
              <Link
                href={`/clasificados/bienes-raices/resultados?lang=${lang}`}
                className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6E5418] underline-offset-4 hover:underline sm:text-xs"
              >
                {lang === "en" ? "Back to Real estate" : "Volver a Bienes Raíces"}
              </Link>
            ),
            meta: listing.leonix_ad_id ? `${listing.leonix_ad_id} · ${lang === "en" ? "Published listing" : "Anuncio publicado"}` : null,
            headerRight: <PublicChromeActions listingId={listing.id} lang={lang} ownerId={listing.owner_id} />,
          }}
        />
        {!isChild && portfolio.length ? (
          <div className="mx-auto max-w-[1140px] px-4 pb-16 sm:px-6 lg:px-7">
            <RelatedBrAgentProperties listings={portfolio} lang={lang} groupId={groupId} />
          </div>
        ) : null}
      </div>
    </BrAgenteResidencialLocaleProvider>
  );
}
