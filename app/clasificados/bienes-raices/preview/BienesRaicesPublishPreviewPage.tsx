"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import { getPreviewDraft, type PreviewListingDraft } from "@/app/clasificados/lib/previewListingDraft";
import ListingView, { type BusinessRailData, type ListingData } from "@/app/clasificados/components/ListingView";
import { mapListingToViewModel } from "@/app/clasificados/lib/mapListingToViewModel";
import { categoryConfig } from "@/app/clasificados/config/categoryConfig";

/** Canonical BR full-page publish preview — category-owned route `/clasificados/bienes-raices/preview`. */

const RULES_CONFIRMED_KEY = "leonix_publish_rules_confirmed";

/** Last-resort rail so ListingView BR premium gate + BienesRaicesPreviewNegocioFresh always get a truthy `businessRail`. */
function minimalBusinessRailFromDraft(draft: PreviewListingDraft): BusinessRailData {
  const L = draft.lang === "en" ? "en" : "es";
  const name = (draft.sellerName ?? "").trim() || (L === "es" ? "Negocio" : "Business");
  return {
    name,
    agent: name,
    role: "",
    officePhone: draft.contactPhone?.trim() ?? "",
    agentEmail: draft.contactEmail?.trim() || null,
    website: null,
    socialLinks: [],
    rawSocials: "",
    logoUrl: null,
    agentPhotoUrl: null,
    languages: "",
    hours: "",
    virtualTourUrl: null,
    plusMoreListings: false,
  };
}

/**
 * BR Negocio preview: ListingView requires `category === "bienes-raices"` and
 * (`businessRailTier === "business_plus"` || `businessRail`). URL may carry `branch=negocio` while `draft.branch` is unset (older sessions).
 * Premium detail also requires a truthy `businessRail`.
 */
function normalizeBrNegocioListingDataForPremiumGate(
  listing: ListingData,
  draft: PreviewListingDraft,
  branchFromUrl: string | undefined
): ListingData {
  const isBrNegocio =
    draft.category === "bienes-raices" && (draft.branch === "negocio" || branchFromUrl === "negocio");
  if (!isBrNegocio) return listing;

  const railMerged = listing.businessRail ?? draft.businessRail ?? null;
  const tierMerged = listing.businessRailTier ?? draft.businessRailTier ?? null;

  return {
    ...listing,
    category: "bienes-raices",
    businessRail: railMerged ?? minimalBusinessRailFromDraft(draft),
    businessRailTier: tierMerged ?? "business_plus",
  };
}

export default function BienesRaicesPublishPreviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = (searchParams?.get("lang") || "es") === "en" ? "en" : "es";
  const branchFromUrl = searchParams?.get("branch")?.trim().toLowerCase();
  const [draft, setDraft] = useState<ReturnType<typeof getPreviewDraft>>(null);
  const [rulesConfirmed, setRulesConfirmed] = useState(false);
  const [infoConfirmed, setInfoConfirmed] = useState(false);
  const confirmSectionRef = useRef<HTMLDivElement | null>(null);

  const scrollToConfirmSection = () => {
    confirmSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /** So publish flow can set `previewViewed` when seller returns after full-page “Ver anuncio”. */
  const pushBackToEditWithPreviewSeen = () => {
    if (!draft?.backToEditUrl) {
      router.back();
      return;
    }
    const url = new URL(draft.backToEditUrl, window.location.origin);
    url.searchParams.set("fromPreview", "1");
    router.push(url.pathname + "?" + url.searchParams.toString());
  };

  useEffect(() => {
    setDraft(getPreviewDraft());
  }, []);

  // Single source: draft from publish page. Do not reconstruct media from partial/stale fields.
  const draftListingData = useMemo((): ListingData | null => {
    if (!draft) return null;

    let built: ListingData | null = null;
    const rawJson = draft.fullListingDataJson?.trim();
    if (rawJson) {
      try {
        const parsed = JSON.parse(rawJson) as ListingData;
        if (
          parsed &&
          typeof parsed === "object" &&
          typeof (parsed as ListingData).title === "string" &&
          Array.isArray((parsed as ListingData).images)
        ) {
          /** Ensure `category` is set when JSON omits it (ListingView BR gate uses `listing.category`). */
          const cat = parsed.category ?? (draft.category === "bienes-raices" ? ("bienes-raices" as const) : parsed.category);
          built = { ...parsed, ...(cat ? { category: cat } : {}) };
        }
      } catch {
        /* fall through to legacy mapping */
      }
    }

    if (!built) {
      const imageUrls = draft.imageUrls ?? [];
      const row = {
        ...draft,
        images: imageUrls,
        image_urls: imageUrls,
        contact_phone: draft.contactPhone ?? "",
        contact_email: draft.contactEmail ?? "",
        is_free: draft.isFree,
        price: draft.price?.trim() ? draft.price.trim() : (draft.isFree ? "0" : null),
        sellerName: draft.sellerName ?? undefined,
      };
      const data = mapListingToViewModel(row, draft.lang);
      if (!data) return null;
      const categoryLabel = draft.category
        ? (categoryConfig as Record<string, { label: { es: string; en: string } }>)[draft.category]?.label[draft.lang]
        : undefined;
      const brCat =
        data.category ??
        (draft.category === "bienes-raices" ? ("bienes-raices" as const) : data.category);
      built = {
        ...data,
        ...(brCat ? { category: brCat } : {}),
        categoryLabel: categoryLabel ?? undefined,
        sellerName: data.sellerName ?? draft.sellerName ?? undefined,
      };
    }

    return normalizeBrNegocioListingDataForPremiumGate(built, draft, branchFromUrl);
  }, [draft, branchFromUrl]);

  /** BR Negocio: deterministic from route/draft context. No fallback to generic shell when category=bienes-raices and branch=negocio. */
  const isBrNegocioFromContext =
    draft?.category === "bienes-raices" &&
    (draft?.branch === "negocio" || branchFromUrl === "negocio");

  /** BR Privado: full-page owner preview — parity with negocio route (`branch=privado`). */
  const isBrPrivadoFromContext =
    draft?.category === "bienes-raices" &&
    (draft?.branch === "privado" || branchFromUrl === "privado");

  const t = useMemo(
    () =>
      lang === "es"
        ? {
            backToEdit: "Volver a editar",
            noPreview: "No hay vista previa disponible.",
            goToClassifieds: "Ir a Clasificados",
            previewSubtitle: "Vista previa (como la verán los compradores)",
            brandTitle: "Leonix Clasificados",
            publishGoToReview: "Publicar",
            backToEditListing: "Volver a editar anuncio",
            editListing: "Editar anuncio",
            confirmPublish: "Confirmar y publicar",
            rulesCheckbox: "Confirmo que mi anuncio cumple con las reglas de la comunidad.",
            infoCheckbox: "Confirmo que la información es correcta.",
          }
        : {
            backToEdit: "Back to edit",
            noPreview: "No preview available.",
            goToClassifieds: "Go to Classifieds",
            previewSubtitle: "Preview (as buyers will see it)",
            brandTitle: "Leonix Clasificados",
            publishGoToReview: "Publish",
            backToEditListing: "Back to edit listing",
            editListing: "Edit listing",
            confirmPublish: "Confirm & Publish",
            rulesCheckbox: "I confirm my listing complies with the community rules.",
            infoCheckbox: "I confirm the information is correct.",
          },
    [lang]
  );

  const handleConfirmPublish = () => {
    if (!draft?.backToEditUrl || !rulesConfirmed || !infoConfirmed) return;
    if (typeof window !== "undefined") {
      sessionStorage.setItem(RULES_CONFIRMED_KEY, "1");
    }
    const url = new URL(draft.backToEditUrl, window.location.origin);
    url.searchParams.set("confirmPublish", "1");
    router.push(url.pathname + "?" + url.searchParams.toString());
  };

  if (!draft) {
    return (
      <main className="min-h-screen bg-[#F5F5F5] text-[#111111]">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 pt-28 pb-16 text-center">
          <p className="text-lg text-[#111111]/80">{t.noPreview}</p>
          <Link
            href={`/clasificados?lang=${lang}`}
            className="mt-4 inline-block rounded-xl bg-[#C9B46A] text-[#111111] font-semibold px-5 py-2.5 hover:opacity-90"
          >
            {t.goToClassifieds}
          </Link>
        </div>
      </main>
    );
  }

  const confirmSection = (
    <div
      ref={confirmSectionRef}
      id="preview-confirm-section"
      className="mt-8 max-w-md mx-auto w-full rounded-2xl border border-[#C9B46A]/35 bg-[#F5F5F5] p-4 sm:p-5 shadow-sm"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-[#111111]/55 mb-3">
        {lang === "es" ? "Revisión final" : "Final review"}
      </p>
      <div className="space-y-3">
        <label className="flex items-start gap-2 cursor-pointer text-sm text-[#111111]">
          <input
            type="checkbox"
            checked={rulesConfirmed}
            onChange={(e) => setRulesConfirmed(e.target.checked)}
            className="mt-0.5 rounded border-[#C9B46A]/60 text-[#C9B46A] focus:ring-[#C9B46A]/40"
          />
          <span>
            {t.rulesCheckbox}{" "}
            <Link
              href={
                draft?.backToEditUrl
                  ? `/clasificados/reglas?lang=${lang}&return=${encodeURIComponent(draft.backToEditUrl)}`
                  : `/clasificados/reglas?lang=${lang}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#A98C2A] hover:text-[#8f7a24] underline font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              {lang === "es" ? "Ver reglas" : "View rules"}
            </Link>
          </span>
        </label>
        <label className="flex items-start gap-2 cursor-pointer text-sm text-[#111111]">
          <input
            type="checkbox"
            checked={infoConfirmed}
            onChange={(e) => setInfoConfirmed(e.target.checked)}
            className="mt-0.5 rounded border-[#C9B46A]/60 text-[#C9B46A] focus:ring-[#C9B46A]/40"
          />
          <span>{t.infoCheckbox}</span>
        </label>
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <button
            type="button"
            onClick={pushBackToEditWithPreviewSeen}
            className="flex-1 w-full max-w-full rounded-xl border border-[#C9B46A]/55 bg-[#F5F5F5] text-[#111111] font-semibold py-3.5 text-center hover:bg-[#E8E8E8] transition"
          >
            {t.editListing}
          </button>
          <button
            type="button"
            onClick={handleConfirmPublish}
            disabled={!rulesConfirmed || !infoConfirmed}
            className={cx(
              "flex-1 w-full max-w-full rounded-xl font-semibold py-3.5 text-center transition",
              rulesConfirmed && infoConfirmed
                ? "bg-[#111111] text-[#F5F5F5] hover:opacity-95"
                : "bg-[#D9D9D9] text-[#111111]/60 cursor-not-allowed"
            )}
          >
            {t.confirmPublish}
          </button>
        </div>
      </div>
    </div>
  );

  if (isBrNegocioFromContext && draftListingData) {
    return (
      <main className="min-h-screen bg-[#F1EDE6] text-[#111111] overflow-x-hidden">
        <Navbar />
        <div className="sticky top-0 z-30 border-b border-[#C9B46A]/35 bg-[#F8F6F0]/95 backdrop-blur-md shadow-sm">
          <div className="max-w-[min(100%,92rem)] mx-auto flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3">
            <button
              type="button"
              onClick={pushBackToEditWithPreviewSeen}
              className="rounded-xl border border-[#C9B46A]/50 bg-[#FFFCF7] px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#111111] hover:bg-[#EFE7D8] transition"
            >
              ← {t.backToEdit}
            </button>
            <span className="text-[11px] sm:text-sm text-[#111111]/50 text-center flex-1 min-w-0 px-1 leading-snug">{t.previewSubtitle}</span>
            <button
              type="button"
              onClick={scrollToConfirmSection}
              className="shrink-0 rounded-xl border border-[#3F5A43]/60 bg-[#3F5A43] px-4 py-2 text-sm font-semibold text-[#F7F4EC] shadow-sm hover:bg-[#36503A] transition"
            >
              {t.publishGoToReview}
            </button>
          </div>
        </div>
        <div className="max-w-[min(100%,92rem)] mx-auto px-4 sm:px-8 lg:px-12 py-6 pb-10 w-full">
          <ListingView
            listing={draftListingData}
            previewMode
            hideProComparisonUI
            brNegocioPreviewVariant="full"
          />
        </div>
        <div className="max-w-[min(100%,92rem)] mx-auto px-4 sm:px-6 pb-14 w-full">{confirmSection}</div>
      </main>
    );
  }

  if (isBrPrivadoFromContext && draftListingData) {
    return (
      <main className="min-h-screen bg-[#F0F4F1] text-[#111111] overflow-x-hidden">
        <Navbar />
        <div className="sticky top-0 z-30 border-b border-emerald-900/15 bg-[#F7FAF7]/95 backdrop-blur-md shadow-sm">
          <div className="max-w-[min(100%,92rem)] mx-auto flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3">
            <button
              type="button"
              onClick={pushBackToEditWithPreviewSeen}
              className="rounded-xl border border-emerald-800/25 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#111111] hover:bg-emerald-50/90 transition"
            >
              ← {t.backToEdit}
            </button>
            <span className="text-[11px] sm:text-sm text-[#111111]/50 text-center flex-1 min-w-0 px-1 leading-snug">{t.previewSubtitle}</span>
            <button
              type="button"
              onClick={scrollToConfirmSection}
              className="shrink-0 rounded-xl border border-[#2D5016]/80 bg-[#2D5016] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#244012] transition"
            >
              {t.publishGoToReview}
            </button>
          </div>
        </div>
        <div className="max-w-[min(100%,92rem)] mx-auto px-4 sm:px-8 lg:px-12 py-6 pb-10 w-full">
          <ListingView
            listing={draftListingData}
            previewMode
            hideProComparisonUI
            brNegocioPreviewVariant="full"
          />
        </div>
        <div className="max-w-[min(100%,92rem)] mx-auto px-4 sm:px-6 pb-14 w-full">{confirmSection}</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#D9D9D9] text-[#111111] overflow-x-hidden">
      <Navbar />
      <div className="max-w-[min(100%,80rem)] mx-auto w-full px-4 sm:px-6 py-6 pb-12">
        <div className="rounded-[1.35rem] border border-stone-200/90 bg-gradient-to-b from-[#FFFCF6] to-[#F2EBDD] shadow-[0_12px_40px_-28px_rgba(17,17,17,0.35)] ring-1 ring-[#C9B46A]/18 overflow-x-hidden">
          <header className="border-b border-[#C9B46A]/28 bg-[#F8F6F0]/95">
            <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3.5">
              <p className="text-[0.95rem] sm:text-base font-semibold tracking-tight text-[#111111] min-w-0">{t.brandTitle}</p>
              <button
                type="button"
                onClick={scrollToConfirmSection}
                className="shrink-0 rounded-xl border border-[#3F5A43]/60 bg-[#3F5A43] px-4 py-2 text-sm font-semibold text-[#F7F4EC] shadow-sm hover:bg-[#36503A] transition"
              >
                {t.publishGoToReview}
              </button>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 sm:px-6 py-2.5 border-t border-[#C9B46A]/15 bg-[#FFFCF7]/60">
              <button
                type="button"
                onClick={pushBackToEditWithPreviewSeen}
                className="self-start rounded-xl border border-[#C9B46A]/50 bg-[#FFFCF7] px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#111111] hover:bg-[#EFE7D8] transition"
              >
                ← {t.backToEdit}
              </button>
              <span className="text-[11px] sm:text-xs text-[#111111]/45 sm:text-right">{t.previewSubtitle}</span>
            </div>
          </header>

          <section className="w-full p-3 sm:p-5 pt-4 sm:pt-5">
            {draftListingData ? (
              <ListingView
                listing={draftListingData}
                previewMode
                hideProComparisonUI={draftListingData.category === "bienes-raices"}
              />
            ) : null}
          </section>
        </div>

        {confirmSection}
      </div>
    </main>
  );
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
