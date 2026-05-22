/**
 * En Venta family-safe text moderation (deterministic guardrails).
 *
 * - No external AI in this gate; integration point for a future provider gate.
 * - Do not weaken family-safe policy without product approval.
 */

import type { EnVentaFreeApplicationState } from "@/app/clasificados/publicar/en-venta/free/application/schema/enVentaFreeFormState";
import { normalizeEnVentaSearchText } from "../taxonomy/synonyms";

export type EnVentaSafetyDestination =
  | "autos"
  | "empleos"
  | "rentas"
  | "servicios"
  | "comunidad"
  | "mascotas-future"
  | "other";

export type EnVentaFamilySafetyStatus = "safe" | "needs_review" | "blocked";

export type EnVentaFamilySafetySeverity = "low" | "medium" | "high";

export type EnVentaFamilySafetyResult = {
  status: EnVentaFamilySafetyStatus;
  reasons: string[];
  userMessage: string;
  suggestedDestination?: EnVentaSafetyDestination;
  severity: EnVentaFamilySafetySeverity;
};

export type EnVentaModerationPayload = {
  title: string;
  description: string;
  department?: string;
  subcategory?: string;
  itemType?: string;
  condition?: string;
  extraNotes?: string[];
};

type RuleHit = {
  id: string;
  status: Exclude<EnVentaFamilySafetyStatus, "safe">;
  severity: EnVentaFamilySafetySeverity;
  reason: string;
  destination?: EnVentaSafetyDestination;
  unless?: RegExp[];
  patterns: RegExp[];
};

const ALLOW_CONTEXT: RegExp[] = [
  /\bcuchillo de cocina\b/,
  /\bkitchen knife\b/,
  /\bsilla de masaje\b/,
  /\bmassage chair\b/,
  /\bmasaje chair\b/,
  /\bpet bed\b/,
  /\bjaula para (perro|gato|mascota)\b/,
  /\bdog crate\b/,
  /\baccesorios? (de )?mascotas?\b/,
  /\bpet supplies\b/,
  /\b(llantas?|rines?|rims?|tires?|autopartes?|car audio|refacciones?|partes? de auto)\b/,
  /\blibros infantiles\b/,
  /\bchildren'?s books\b/,
];

const RULES: RuleHit[] = [
  {
    id: "adult-explicit",
    status: "blocked",
    severity: "high",
    reason: "adult_or_sexual_content",
    patterns: [
      /\b(juguete sexual|sex toy|dildo|vibrador|porn|porno|xxx|onlyfans|escort|acompañante|acompanante)\b/,
      /\b(masaje (privado|sensual|erotico|erótico)|happy ending|servicio sexual|contenido adulto|adult toy)\b/,
      /\b(nude|desnudo|stripper|prostitut)\b/,
    ],
  },
  {
    id: "weapons",
    status: "blocked",
    severity: "high",
    reason: "weapons_or_ammunition",
    patterns: [
      /\b(firearm|firearms|pistol|rifle|shotgun|revolver|gun for sale|guns for sale)\b/,
      /\b(arma(s)? de fuego|escopeta|pistola|rifle|revolver)\b/,
      /\b(ammunition|ammo|municion|municiones|cartuchos?)\b/,
      /\b(cuchillo tactico|tactical knife|navaja automatica)\b/,
    ],
    unless: [/\bcuchillo de cocina\b/, /\bkitchen knife\b/],
  },
  {
    id: "drugs",
    status: "blocked",
    severity: "high",
    reason: "drugs_or_controlled_substances",
    patterns: [
      /\b(cocaine|heroin|meth|fentanyl|weed for sale|marijuana for sale|cannabis for sale)\b/,
      /\b(drogas|marihuana en venta|vendo weed|vendo mota)\b/,
    ],
  },
  {
    id: "stolen-counterfeit",
    status: "blocked",
    severity: "high",
    reason: "stolen_or_counterfeit",
    patterns: [/\b(stolen|robado|hot item|sin papeles)\b/, /\b(counterfeit|falsificad[oa]|replica rolex)\b/],
    unless: [/\breplica\b/],
  },
  {
    id: "live-animals",
    status: "blocked",
    severity: "high",
    reason: "live_animal_sale",
    destination: "comunidad",
    patterns: [
      /\b(vendo cachorros?|puppies for sale|kittens for sale|gatitos en venta|perros en venta)\b/,
      /\b(live animal|animal vivo|vendo perro|vendo gato)\b/,
    ],
    unless: ALLOW_CONTEXT,
  },
  {
    id: "pets-community",
    status: "blocked",
    severity: "high",
    reason: "pet_adoption_or_lost_found",
    destination: "comunidad",
    patterns: [
      /\b(pet adoption|adopcion de mascota|adopcion mascota|rehome my pet)\b/,
      /\b(perro perdido|gato perdido|lost dog|lost cat|found dog|found cat|mascota perdida|mascota encontrada)\b/,
    ],
  },
  {
    id: "full-vehicle",
    status: "blocked",
    severity: "high",
    reason: "full_vehicle_sale",
    destination: "autos",
    patterns: [
      /\b(vendo (mi )?(troca|camioneta|carro|auto|truck|suv|pickup|van))\b/,
      /\b(truck for sale|suv for sale|car for sale|vehicle for sale|selling my (car|truck|suv))\b/,
      /\b(camioneta en venta|auto en venta|carro en venta)\b/,
    ],
    unless: [
      /\b(llantas?|rines?|rims?|tires?|autopartes?|car audio|refacciones?|partes? de auto)\b/,
    ],
  },
  {
    id: "jobs",
    status: "blocked",
    severity: "high",
    reason: "employment_listing",
    destination: "empleos",
    patterns: [
      /\b(busco jale|busco chamba|looking for work|hiring now|empleo disponible|job opening)\b/,
      /\b(trabajo desde casa|work from home job)\b/,
    ],
  },
  {
    id: "rentals",
    status: "blocked",
    severity: "high",
    reason: "housing_rental",
    destination: "rentas",
    patterns: [
      /\b(cuarto en renta|room for rent|depa en renta|apartamento en renta|renta de cuarto)\b/,
      /\b(se renta|for rent|alquiler de)\b/,
    ],
  },
  {
    id: "services",
    status: "blocked",
    severity: "high",
    reason: "service_listing",
    destination: "servicios",
    patterns: [
      /\b(servicio de (limpieza|plomeria|plomería|electricidad|jardineria|jardinería) a domicilio)\b/,
      /\b(offering (cleaning|plumbing|handyman) service|hire me for)\b/,
    ],
  },
  {
    id: "replica-review",
    status: "needs_review",
    severity: "medium",
    reason: "possible_counterfeit",
    patterns: [/\breplica\b/, /\breplic\b/],
    unless: [/\breplica rolex\b/, /\bfalsificad/],
  },
  {
    id: "airsoft-review",
    status: "needs_review",
    severity: "medium",
    reason: "restricted_item_review",
    patterns: [/\b(airsoft|paintball gun|bb gun)\b/],
  },
  {
    id: "massage-device-review",
    status: "needs_review",
    severity: "low",
    reason: "ambiguous_massage_item",
    patterns: [/\b(masajeador|massage gun|percussion massager)\b/],
    unless: [/\bsilla de masaje\b/, /\bmassage chair\b/],
  },
];

function normalizeModerationText(raw: string): string {
  return normalizeEnVentaSearchText(
    raw
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
  );
}

export function buildEnVentaModerationBlob(payload: EnVentaModerationPayload): string {
  const parts = [
    payload.title,
    payload.description,
    payload.department ?? "",
    payload.subcategory ?? "",
    payload.itemType ?? "",
    payload.condition ?? "",
    ...(payload.extraNotes ?? []),
  ];
  return normalizeModerationText(parts.filter(Boolean).join(" "));
}

export function enVentaModerationPayloadFromState(state: EnVentaFreeApplicationState): EnVentaModerationPayload {
  return {
    title: state.title,
    description: [
      state.description,
      state.wearNotes,
      state.accessoriesNotes,
      state.itemExtraDetails,
      state.shippingNotes,
      state.pickupDetailNotes,
      state.meetupDetailNotes,
      state.localDeliveryDetailNotes,
    ]
      .filter(Boolean)
      .join("\n"),
    department: state.rama,
    subcategory: state.evSub,
    itemType: state.itemType,
    condition: state.condition,
    extraNotes: [state.brand, state.model, state.displayName].filter(Boolean),
  };
}

const DESTINATION_COPY: Record<
  EnVentaSafetyDestination,
  { es: string; en: string }
> = {
  autos: {
    es: "Los vehículos completos se publican en Autos.",
    en: "Full vehicles should be posted under Autos.",
  },
  empleos: {
    es: "Las ofertas de trabajo se publican en Empleos.",
    en: "Job posts belong under Empleos.",
  },
  rentas: {
    es: "Los cuartos o depas en renta se publican en Rentas.",
    en: "Rooms and rentals belong under Rentas.",
  },
  servicios: {
    es: "Los servicios se publican en Servicios.",
    en: "Services belong under Servicios.",
  },
  comunidad: {
    es: "Adopción o mascotas perdidas/encontradas va en Comunidad.",
    en: "Pet adoption or lost/found posts belong under Comunidad.",
  },
  "mascotas-future": {
    es: "Este tipo de anuncio no va en Varios.",
    en: "This type of listing does not belong in For Sale.",
  },
  other: {
    es: "Prueba otra categoría de Leonix.",
    en: "Try another Leonix category.",
  },
};

function buildUserMessage(
  status: Exclude<EnVentaFamilySafetyStatus, "safe">,
  lang: "es" | "en",
  destination?: EnVentaSafetyDestination
): string {
  const base =
    lang === "es"
      ? "No podemos continuar con este anuncio en Varios porque no cumple con nuestras reglas de contenido familiar."
      : "We can't continue this listing in For Sale because it does not meet our family-safe content rules.";
  const reviewNote =
    lang === "es"
      ? " Nuestro equipo debe revisarlo antes de publicarse."
      : " Our team must review it before it can be published.";
  const dest = destination ? DESTINATION_COPY[destination][lang] : "";
  if (status === "needs_review") {
    return [base + reviewNote, dest].filter(Boolean).join(" ");
  }
  return [base, dest].filter(Boolean).join(" ");
}

function ruleMatches(blob: string, rule: RuleHit): boolean {
  if (rule.unless?.some((re) => re.test(blob))) return false;
  return rule.patterns.some((re) => re.test(blob));
}

export function evaluateEnVentaFamilySafety(
  payload: EnVentaModerationPayload,
  lang: "es" | "en" = "es"
): EnVentaFamilySafetyResult {
  const blob = buildEnVentaModerationBlob(payload);
  if (!blob) {
    return { status: "safe", reasons: [], userMessage: "", severity: "low" };
  }

  const blocked = RULES.filter((r) => r.status === "blocked" && ruleMatches(blob, r));
  if (blocked.length) {
    const top = blocked[0];
    return {
      status: "blocked",
      reasons: blocked.map((r) => r.reason),
      userMessage: buildUserMessage("blocked", lang, top.destination),
      suggestedDestination: top.destination,
      severity: top.severity,
    };
  }

  const review = RULES.filter((r) => r.status === "needs_review" && ruleMatches(blob, r));
  if (review.length) {
    const top = review[0];
    return {
      status: "needs_review",
      reasons: review.map((r) => r.reason),
      userMessage: buildUserMessage("needs_review", lang, top.destination),
      suggestedDestination: top.destination,
      severity: top.severity,
    };
  }

  return { status: "safe", reasons: [], userMessage: "", severity: "low" };
}

export function evaluateEnVentaFamilySafetyFromState(
  state: EnVentaFreeApplicationState,
  lang: "es" | "en" = "es"
): EnVentaFamilySafetyResult {
  return evaluateEnVentaFamilySafety(enVentaModerationPayloadFromState(state), lang);
}

/** Throws when preview navigation must be cancelled (caught by publish preview CTA flow). */
export function assertEnVentaFamilySafeForPreview(
  state: EnVentaFreeApplicationState,
  lang: "es" | "en"
): EnVentaFamilySafetyResult {
  const result = evaluateEnVentaFamilySafetyFromState(state, lang);
  if (result.status !== "safe") {
    throw new Error("en-venta-family-safety-block");
  }
  return result;
}

export function formatEnVentaFamilySafetyPublishError(
  result: EnVentaFamilySafetyResult,
  lang: "es" | "en"
): string {
  if (result.status === "safe") return "";
  return result.userMessage;
}
