"use client";

/**
 * Recursos CTA truth: renders only actions the resource's own data actually supports (via
 * `resourceCtaAdapter.ts`), and only opens the already-proven, already-live `CtaActionSheet` —
 * no new sheet UI, no fake/disabled buttons. Mirrors the trigger-button + single-sheet-instance
 * pattern already used by `ServiciosActionPanel.tsx`.
 */
import { useCallback, useState } from "react";
import { CtaActionSheet } from "@/app/components/cta/CtaActionSheet";
import type { CtaSheetIntent } from "@/app/components/cta/types";
import {
  buildResourceApplyIntent,
  buildResourceCallIntent,
  buildResourceDirectionsIntent,
  buildResourceEmailIntent,
  buildResourceShareIntent,
  buildResourceTextIntent,
  buildResourceWebsiteIntent,
  buildResourceWhatsAppIntent,
} from "@/app/lib/recursos/resourceCtaAdapter";
import type { PublicResourceRecord, RecursosLang } from "@/app/lib/recursos/types";

const LABELS: Record<RecursosLang, Record<string, string>> = {
  es: {
    call: "Llamar",
    text: "Texto",
    whatsapp: "WhatsApp",
    website: "Visitar",
    apply: "Aplicar",
    directions: "Mapa",
    email: "Email",
    share: "Compartir",
  },
  en: {
    call: "Call",
    text: "Text",
    whatsapp: "WhatsApp",
    website: "Visit",
    apply: "Apply",
    directions: "Map",
    email: "Email",
    share: "Share",
  },
};

type ActionKey = "call" | "text" | "whatsapp" | "website" | "apply" | "directions" | "email" | "share";

const PRIMARY_ORDER: ActionKey[] = ["call", "text", "whatsapp", "directions", "website", "apply", "email"];
/** Compact card view: show at most the 2 most useful actions to keep cards scannable. */
const CARD_ORDER: ActionKey[] = ["call", "text", "directions", "website"];

export function ResourceQuickActions({
  resource,
  lang,
  layout = "full",
  publicUrl,
}: {
  resource: PublicResourceRecord;
  lang: RecursosLang;
  layout?: "compact" | "full";
  publicUrl?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [intent, setIntent] = useState<CtaSheetIntent | null>(null);
  const t = LABELS[lang];

  const openSheet = useCallback((next: CtaSheetIntent | null) => {
    if (!next) return;
    setIntent(next);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setIntent(null);
  }, []);

  const builders: Partial<Record<ActionKey, CtaSheetIntent | null>> = {
    call: buildResourceCallIntent(resource),
    text: buildResourceTextIntent(resource),
    whatsapp: buildResourceWhatsAppIntent(resource),
    website: buildResourceWebsiteIntent(resource),
    apply: buildResourceApplyIntent(resource),
    directions: buildResourceDirectionsIntent(resource),
    email: buildResourceEmailIntent(resource, lang),
    share: buildResourceShareIntent(resource, publicUrl ?? null),
  };

  const order = layout === "compact" ? CARD_ORDER : [...PRIMARY_ORDER, "share" as ActionKey];
  const available = order.filter((key) => Boolean(builders[key]));
  const shown = layout === "compact" ? available.slice(0, 2) : available;

  if (shown.length === 0) return null;

  const primaryBtn = "min-h-[44px] flex-1 rounded-full bg-[#7A1E2C] px-4 text-sm font-bold text-[#FFFDF7] transition hover:bg-[#5e1721]";
  const secondaryBtn =
    "min-h-[44px] flex-1 rounded-full border border-[#C9A84A]/60 bg-[#FFFDF7] px-4 text-sm font-bold text-[#2A4536] transition hover:border-[#C9A84A] hover:bg-[#FBF7EF]";

  return (
    <>
      <div className={`flex flex-wrap gap-2 ${layout === "full" ? "" : ""}`}>
        {shown.map((key, i) => (
          <button
            key={key}
            type="button"
            className={i === 0 ? primaryBtn : secondaryBtn}
            onClick={() => openSheet(builders[key] ?? null)}
          >
            {t[key]}
          </button>
        ))}
      </div>
      <CtaActionSheet open={open} onClose={close} intent={intent} lang={lang} />
    </>
  );
}
