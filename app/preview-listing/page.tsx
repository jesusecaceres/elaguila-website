"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import { getPreviewDraft } from "@/app/lib/previewListingDraft";
import ListingView, { type ListingData } from "@/app/clasificados/components/ListingView";
import { mapListingToViewModel } from "@/app/clasificados/lib/mapListingToViewModel";
import { categoryConfig } from "@/app/clasificados/config/categoryConfig";

const RULES_CONFIRMED_KEY = "leonix_publish_rules_confirmed";

export default function PreviewListingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = (searchParams?.get("lang") || "es") === "en" ? "en" : "es";
  const [draft, setDraft] = useState<ReturnType<typeof getPreviewDraft>>(null);
  const [rulesConfirmed, setRulesConfirmed] = useState(false);
  const [infoConfirmed, setInfoConfirmed] = useState(false);

  useEffect(() => {
    setDraft(getPreviewDraft());
  }, []);

  // Single source: draft from publish page. Do not reconstruct media from partial/stale fields.
  const draftListingData = useMemo((): ListingData | null => {
    if (!draft) return null;
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
    const categoryLabel = draft.category ? (categoryConfig as Record<string, { label: { es: string; en: string } }>)[draft.category]?.label[draft.lang] : undefined;
    return { ...data, categoryLabel: categoryLabel ?? undefined, sellerName: data.sellerName ?? draft.sellerName ?? undefined };
  }, [draft]);

  const t = useMemo(
    () =>
      lang === "es"
        ? {
            backToEdit: "Volver a editar",
            noPreview: "No hay vista previa disponible.",
            goToClassifieds: "Ir a Clasificados",
            previewSubtitle: "Vista previa (como la verán los compradores)",
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

  const L = draft.lang;

  return (
    <main className="min-h-screen bg-[#D9D9D9] text-[#111111]">
      <Navbar />
      {/* Back to edit — single top bar; bottom actions are primary */}
      <div className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 py-3 border-b border-black/10 bg-[#F5F5F5] shadow-sm">
        <button
          type="button"
          onClick={() => (draft?.backToEditUrl ? router.push(draft.backToEditUrl) : router.back())}
          className="rounded-xl border border-[#C9B46A]/50 bg-[#F8F6F0] px-4 py-2.5 text-sm font-semibold text-[#111111] hover:bg-[#EFE7D8] transition"
        >
          ← {t.backToEdit}
        </button>
        <span className="text-xs text-[#111111]/50">{t.previewSubtitle}</span>
      </div>

      <section className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 w-full max-w-full">
        {draftListingData ? (
          <ListingView listing={draftListingData} previewMode={true} />
        ) : null}
      </section>

      {/* Preview confirm bar: community rules + confirm info + Editar anuncio + Confirmar y publicar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-black/10 bg-[#F5F5F5] p-4 safe-area-pb">
        <div className="max-w-md mx-auto space-y-3">
          <label className="flex items-start gap-2 cursor-pointer text-sm text-[#111111]">
            <input
              type="checkbox"
              checked={rulesConfirmed}
              onChange={(e) => setRulesConfirmed(e.target.checked)}
              className="mt-0.5 rounded border-[#C9B46A]/60 text-[#C9B46A] focus:ring-[#C9B46A]/40"
            />
            <span>
              {t.rulesCheckbox}
              {" "}
              <Link
                href={draft?.backToEditUrl ? `/clasificados/reglas?lang=${lang}&return=${encodeURIComponent(draft.backToEditUrl)}` : `/clasificados/reglas?lang=${lang}`}
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
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => (draft?.backToEditUrl ? router.push(draft.backToEditUrl) : router.back())}
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
      <div className="h-28" aria-hidden />
    </main>
  );
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
