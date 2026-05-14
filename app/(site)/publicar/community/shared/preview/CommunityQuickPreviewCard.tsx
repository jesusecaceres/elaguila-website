"use client";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import type { ClasesQuickDraft, ComunidadQuickDraft } from "../types/communityQuickDraft";

import { ClasesQuickAdCanvas } from "@/app/(site)/publicar/clases/components/ClasesQuickAdCanvas";
import { ComunidadQuickAdCanvas } from "@/app/(site)/publicar/comunidad/components/ComunidadQuickAdCanvas";

export function ClasesQuickPreviewCard({ draft, lang }: { draft: ClasesQuickDraft; lang: Lang }) {
  return <ClasesQuickAdCanvas draft={draft} lang={lang} shell="standalone" />;
}

export function ComunidadQuickPreviewCard({ draft, lang }: { draft: ComunidadQuickDraft; lang: Lang }) {
  return <ComunidadQuickAdCanvas draft={draft} lang={lang} shell="standalone" />;
}
