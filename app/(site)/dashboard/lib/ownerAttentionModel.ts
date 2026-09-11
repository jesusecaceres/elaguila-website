/**
 * Owner Attention Truth Gate (2026-09) — the ONE canonical owner-safe attention contract.
 *
 * Every owner attention surface (Account Command Center `/dashboard`, Business Tools
 * `/dashboard/business-tools`) renders `OwnerAttentionItem[]`. This file holds no data-fetching
 * and no domain logic of its own — it is a thin normalization layer over two already-real,
 * already-persisted sources:
 *
 *  - `derivedDashboardFeed.ts` — the existing "derived notification" feed read from real listing/
 *    profile/message/entitlement tables (no notifications table). See mapDerivedFeedItemToAttention.
 *  - Concierge Advisor signals (`app/lib/business/advisor/*`, consumed via the Business Home
 *    bridge wired in the prior gate). See mapAdvisorSignalToAttention.
 *
 * No second interpretation of either source is allowed to exist — `/dashboard` and
 * `/dashboard/business-tools` both render through `OwnerAttentionItemCard` using items produced
 * only by the two mappers below.
 */
import type { Lang } from "./dashboardI18n";
import type { DerivedFeedItem, DerivedFeedKind } from "./derivedDashboardFeed";
import type { AdvisorSignal } from "./businessHomeClient";

export type OwnerAttentionSeverity = "critical" | "warning" | "opportunity" | "info";
export type OwnerAttentionProvenance = "PROVEN" | "PARTIAL" | "NEEDS_TRIAGE";

export type OwnerAttentionItem = {
  id: string;
  entityType: "listing" | "business" | "account" | "message" | "advisor_signal";
  entityId: string | null;
  businessId: string | null;
  listingId: string | null;
  category: string | null;
  /** Canonical kind key — a DerivedFeedKind or an AdvisorSignalType string. */
  type: string;
  title: string;
  reason: string;
  evidenceSummary: string | null;
  severity: OwnerAttentionSeverity;
  detectedAt: string | null;
  recommendedAction: string;
  actionHref: string;
  consequenceIfIgnored: string | null;
  provenanceState: OwnerAttentionProvenance;
};

/** Real per-listing moderation evidence when available — populated by derivedDashboardFeed.ts
 * from the owner-safe `/api/dashboard/listing-moderation-reasons` projection. `null` means the
 * listing is genuinely pending/flagged but no AI/human review row exists on file yet (PARTIAL,
 * never fabricated). */
export type ModerationEvidence = {
  decision: string;
  reasonCategory: string | null;
  reasonText: string | null;
  reviewedAt: string | null;
} | null;

const DERIVED_SEVERITY: Record<DerivedFeedKind, OwnerAttentionSeverity> = {
  payment_attention: "critical",
  moderation: "warning",
  expire_visibility: "warning",
  expire_listing: "warning",
  inbox: "opportunity",
  draft: "opportunity",
  low_views: "info",
  profile_city: "info",
};

function derivedCopy(lang: Lang) {
  const es = lang === "es";
  return {
    reason: {
      payment_attention: es
        ? "Tu paquete comercial activo tiene un problema de pago o cancelación pendiente."
        : "Your active commercial package has a pending payment or cancellation issue.",
      moderation: es
        ? "Este anuncio está pendiente o marcado en revisión de moderación."
        : "This listing is pending or flagged for moderation review.",
      expire_visibility: es
        ? "La ventana de visibilidad prioritaria de este anuncio vence en los próximos 7 días."
        : "This listing's priority visibility window ends within the next 7 days.",
      expire_listing: es
        ? "Este anuncio vence en los próximos 7 días."
        : "This listing expires within the next 7 days.",
      inbox: es ? "Tienes mensajes sin leer de compradores/interesados." : "You have unread messages from buyers/leads.",
      draft: es ? "Tienes borradores sin publicar." : "You have unpublished drafts.",
      low_views: es
        ? "Este anuncio no ha registrado vistas desde su publicación."
        : "This listing has recorded no views since it was published.",
      profile_city: es
        ? "Tu perfil no tiene una ciudad guardada."
        : "Your profile has no saved city.",
    } satisfies Record<DerivedFeedKind, string>,
    evidence: {
      payment_attention: es
        ? "Estado de suscripción real reportado por el motor de facturación (Revenue OS)."
        : "Real subscription state reported by the billing engine (Revenue OS).",
      moderation: null as string | null,
      expire_visibility: es ? "Fecha real de fin de ventana de visibilidad republicada." : "Real republished-visibility window end date.",
      expire_listing: es ? "Fecha real de expiración del anuncio." : "Real listing expiration date.",
      inbox: es ? "Conteo real de mensajes con read_at nulo." : "Real count of messages with a null read_at.",
      draft: es ? "Conteo real de anuncios con estado borrador / sin publicar." : "Real count of listings with draft/unpublished status.",
      low_views: es ? "Resumen real de analíticas de anuncio: 0 vistas registradas." : "Real listing analytics summary: 0 recorded views.",
      profile_city: es ? "Campo home_city vacío en tu perfil." : "Empty home_city field on your profile.",
    },
    action: {
      payment_attention: es ? "Revisa el estado de tu paquete comercial en Mis anuncios." : "Check your commercial package status in My ads.",
      moderation: es ? "Revisa el estado de este anuncio en Mis anuncios." : "Check this listing's status in My ads.",
      expire_visibility: es ? "Republica o renueva la visibilidad del anuncio." : "Republish or renew the listing's visibility.",
      expire_listing: es ? "Renueva o reactiva el anuncio antes de que expire." : "Renew or reactivate the listing before it expires.",
      inbox: es ? "Responde tus mensajes en el buzón." : "Reply to your messages in the inbox.",
      draft: es ? "Publica o continúa editando tus borradores." : "Publish or continue editing your drafts.",
      low_views: es ? "Mejora fotos/título o comparte el enlace del anuncio." : "Improve photos/title or share the listing link.",
      profile_city: es ? "Completa tu ciudad en tu perfil." : "Add your city in your profile.",
    } satisfies Record<DerivedFeedKind, string>,
    consequence: {
      payment_attention: es
        ? "Si no se resuelve, el anuncio puede perder visibilidad pública o suspenderse."
        : "If unresolved, the listing may lose public visibility or be suspended.",
      moderation: es
        ? "Mientras esté en revisión, el anuncio puede no aparecer en resultados públicos."
        : "While under review, the listing may not appear in public results.",
      expire_visibility: es ? "El anuncio perderá su posición prioritaria al vencer la ventana." : "The listing will lose priority placement once the window ends.",
      expire_listing: es ? "El anuncio se ocultará de la búsqueda pública al expirar." : "The listing will be hidden from public search once it expires.",
      inbox: es ? "Un tiempo de respuesta más lento puede reducir la conversión." : "A slower reply time may reduce conversion.",
      draft: null as string | null,
      low_views: null as string | null,
      profile_city: null as string | null,
    },
  };
}

/** Fetches the owner-safe moderation-reason projection for a batch of listing ids the caller
 * owns. Fails closed to an empty map on any error — a missing reason never blocks rendering, it
 * just leaves that item PARTIAL instead of PROVEN. */
export async function fetchModerationEvidenceMap(
  listingIds: readonly string[],
  accessToken: string | null | undefined,
): Promise<Record<string, ModerationEvidence>> {
  if (listingIds.length === 0 || !accessToken?.trim()) return {};
  try {
    const res = await fetch("/api/dashboard/listing-moderation-reasons", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken.trim()}` },
      body: JSON.stringify({ listingIds }),
    });
    if (!res.ok) return {};
    const json = (await res.json()) as {
      reasons?: Record<string, { decision: string; reasonCategory: string | null; reasonText: string | null; reviewedAt: string | null }>;
    };
    return json.reasons ?? {};
  } catch {
    return {};
  }
}

/** PROVEN unless the kind is `moderation` and no real review row exists on file (PARTIAL). */
export function mapDerivedFeedItemToAttention(
  item: DerivedFeedItem,
  lang: Lang,
  moderationEvidence?: ModerationEvidence,
): OwnerAttentionItem {
  const copy = derivedCopy(lang);
  const es = lang === "es";
  const listingId = item.listingId ?? null;

  let reason = copy.reason[item.kind];
  let evidenceSummary = copy.evidence[item.kind] ?? item.detail ?? null;
  if (item.sourceKey && (item.kind === "expire_visibility" || item.kind === "expire_listing")) {
    evidenceSummary = es ? `Fecha real: ${item.sourceKey}` : `Real date: ${item.sourceKey}`;
  }
  let provenanceState: OwnerAttentionProvenance = "PROVEN";

  if (item.kind === "moderation") {
    if (moderationEvidence) {
      reason = es
        ? `Motivo registrado: ${moderationEvidence.reasonCategory ?? moderationEvidence.decision}`
        : `Recorded reason: ${moderationEvidence.reasonCategory ?? moderationEvidence.decision}`;
      evidenceSummary = moderationEvidence.reasonText ?? moderationEvidence.reasonCategory ?? moderationEvidence.decision;
      provenanceState = "PROVEN";
    } else {
      reason = es
        ? "El anuncio está pendiente/marcado, pero no hay un motivo de revisión registrado todavía."
        : "The listing is pending/flagged, but no review reason is on file yet.";
      evidenceSummary = null;
      provenanceState = "PARTIAL";
    }
  }

  return {
    id: `df:${item.id}`,
    entityType: "listing",
    entityId: listingId,
    businessId: null,
    listingId,
    category: item.category ?? null,
    type: item.kind,
    title: item.title,
    reason,
    evidenceSummary,
    severity: DERIVED_SEVERITY[item.kind],
    detectedAt: null,
    recommendedAction: copy.action[item.kind],
    actionHref: item.href,
    consequenceIfIgnored: copy.consequence[item.kind],
    provenanceState,
  };
}

const ADVISOR_SEVERITY: Record<string, OwnerAttentionSeverity> = {
  blocked: "critical",
  priority: "warning",
  opportunity: "opportunity",
  information: "info",
};

const ADVISOR_ACTION_COPY: Record<string, { es: string; en: string; consequenceEs: string | null; consequenceEn: string | null }> = {
  COMMITMENT_DUE: {
    es: "Revisa tus compromisos pendientes en Trabajar con Leonix.",
    en: "Review your pending commitments in Work With Leonix.",
    consequenceEs: "Un compromiso vencido puede retrasar tu plan de acción.",
    consequenceEn: "An overdue commitment may delay your action plan.",
  },
  COMMITMENT_BLOCKED: {
    es: "Revisa qué está bloqueando este compromiso.",
    en: "Review what is blocking this commitment.",
    consequenceEs: "El bloqueo puede detener el progreso de tu plan de acción.",
    consequenceEn: "The block may stall your action plan's progress.",
  },
  POSTPONED_RECOMMENDATION_REVIEW_DUE: {
    es: "Vuelve a revisar la recomendación que pospusiste.",
    en: "Revisit the recommendation you postponed.",
    consequenceEs: null,
    consequenceEn: null,
  },
  CREATIVE_AWAITING_REVIEW: {
    es: "Revisa el material creativo en espera de tu aprobación.",
    en: "Review the creative material awaiting your approval.",
    consequenceEs: null,
    consequenceEn: null,
  },
  PROPOSAL_AWAITING_OWNER: {
    es: "Revisa la propuesta que espera tu decisión en Trabajar con Leonix.",
    en: "Review the proposal awaiting your decision in Work With Leonix.",
    consequenceEs: "La propuesta permanece sin efecto hasta que decidas.",
    consequenceEn: "The proposal stays inactive until you decide.",
  },
  UNRESOLVED_CONTRADICTION: {
    es: "Ayuda a resolver información contradictoria sobre tu negocio.",
    en: "Help resolve contradictory information about your business.",
    consequenceEs: "Leonix no puede recomendar con confianza mientras esto no se resuelva.",
    consequenceEn: "Leonix cannot recommend confidently while this is unresolved.",
  },
  STALE_CRITICAL_TRUTH: {
    es: "Confirma si esta información de tu negocio sigue siendo correcta.",
    en: "Confirm whether this business information is still accurate.",
    consequenceEs: null,
    consequenceEn: null,
  },
  OUTCOME_REVIEW_DUE: {
    es: "Revisa el resultado que está listo para evaluación.",
    en: "Review the outcome that is ready for evaluation.",
    consequenceEs: null,
    consequenceEn: null,
  },
  CAPACITY_STRETCHED: {
    es: "Tu capacidad operativa está al límite — revisa tu plan de acción.",
    en: "Your operating capacity is stretched — review your action plan.",
    consequenceEs: null,
    consequenceEn: null,
  },
};

/** Concierge Advisor signals are deterministic, evidence-backed detections — always PROVEN. */
export function mapAdvisorSignalToAttention(signal: AdvisorSignal, lang: Lang, businessId: string): OwnerAttentionItem {
  const es = lang === "es";
  const copy = ADVISOR_ACTION_COPY[signal.signalType];
  return {
    id: `adv:${signal.id}`,
    entityType: "advisor_signal",
    entityId: signal.id,
    businessId,
    listingId: null,
    category: null,
    type: signal.signalType,
    title: es ? signal.titleEs : signal.titleEn,
    reason: es ? signal.explanationEs : signal.explanationEn,
    evidenceSummary: es ? signal.explanationEs : signal.explanationEn,
    severity: ADVISOR_SEVERITY[signal.severity] ?? "info",
    detectedAt: signal.detectedAt,
    recommendedAction: copy ? (es ? copy.es : copy.en) : es ? "Revisa este aviso en Trabajar con Leonix." : "Review this notice in Work With Leonix.",
    actionHref: "/dashboard/business-tools",
    consequenceIfIgnored: copy ? (es ? copy.consequenceEs : copy.consequenceEn) : null,
    provenanceState: "PROVEN",
  };
}

/** Composes the full canonical Account Command Center attention list from a raw derived feed:
 * fetches real moderation evidence for every moderation item, then maps everything through
 * mapDerivedFeedItemToAttention. The single place `/dashboard` should call. */
export async function buildAccountAttentionItems(
  feed: DerivedFeedItem[],
  lang: Lang,
  accessToken: string | null | undefined,
): Promise<OwnerAttentionItem[]> {
  const moderationListingIds = feed
    .filter((i) => i.kind === "moderation" && i.listingId)
    .map((i) => i.listingId as string);
  const evidenceMap = await fetchModerationEvidenceMap(moderationListingIds, accessToken);
  return dedupeOwnerAttentionItems(
    feed.map((item) => mapDerivedFeedItemToAttention(item, lang, item.listingId ? evidenceMap[item.listingId] ?? null : null))
  );
}

/** Sort by severity (critical first), then keep each source's own recency/priority ordering. */
const SEVERITY_RANK: Record<OwnerAttentionSeverity, number> = { critical: 3, warning: 2, opportunity: 1, info: 0 };

export function sortOwnerAttentionItems(items: OwnerAttentionItem[]): OwnerAttentionItem[] {
  return items.slice().sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);
}

/** Dedupe by canonical id — the two source namespaces (`df:`/`adv:`) never collide, but a
 * defensive dedupe keeps this the single choke point if a future source reuses an id. */
export function dedupeOwnerAttentionItems(items: OwnerAttentionItem[]): OwnerAttentionItem[] {
  const seen = new Set<string>();
  const out: OwnerAttentionItem[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}
