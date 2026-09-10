/**
 * Gate BCO-6A — explicit, versioned rule registry. Every dimension's evaluation criteria live
 * here as data, never buried inside a React component or scattered through the calculation
 * engine as ad-hoc conditionals. A new rule version is a new CALCULATION_VERSION string plus (if
 * needed) a new registry export — never a silent edit that changes past runs' meaning.
 *
 * Fact keys referenced below are the exact business_facts.fact_key values the Gate BCO-5A
 * discovery question registry (app/lib/business/livingBook/questionRegistry.ts) already produces
 * — this registry does not invent a parallel fact-key vocabulary. No customer's data is
 * hardcoded; every value here is a key, threshold, or bilingual template string.
 */
import { CALCULATION_VERSION } from "./constants";
import type { HealthDimensionKey } from "./types";

/**
 * Structured-answer value shape contract (established by this package, the first consumer that
 * needs to interpret an answer's meaning programmatically rather than just display it):
 *   - yes_no questions persist business_facts.value as `{ answer: boolean }`
 *   - single_choice questions persist business_facts.value as `{ choice: string }` (the matching
 *     DiscoveryQuestion.choices[].value)
 * Free-text (short_text/long_text) facts are never pattern-matched for a negative signal — doing
 * so would be exactly the kind of hidden/AI-ish heuristic this package is required to avoid.
 */
export type StructuredValueCondition = {
  factKey: string;
  field: "answer" | "choice";
  matchValues: readonly (string | boolean)[];
};

export type DimensionRule = {
  dimensionKey: HealthDimensionKey;
  /** business_facts.fact_key values this dimension is directly built from. */
  relevantFactKeys: readonly string[];
  /** Subset of relevantFactKeys that must be present (as an active fact) before the dimension can move past insufficient_information. */
  requiredFactKeys: readonly string[];
  /** Subset of relevantFactKeys that are not required but strengthen status/confidence when present. */
  helpfulFactKeys: readonly string[];
  /** fact_key values whose presence as a discovery-question `sensitive: true` answer should route the run toward human_review_required until owner-confirmed. */
  sensitiveFactKeys: readonly string[];
  /** A known, structured fact value that reveals a real operational problem within this dimension (drives needs_attention — never derived from missing information). */
  negativeSignalConditions: readonly StructuredValueCondition[];
  /** Only meaningful for operations_and_capacity — a known fact value that signals additional demand could harm the business. */
  capacityRiskConditions: readonly StructuredValueCondition[];
  /** Max age (days) for a fact's last_verified_at to count as "fresh" for THIS dimension's confidence — mirrors deriveFactFreshness's global 90/270 day bands; dimensions may not override the bands, only document them here for traceability. */
  freshnessNote: { es: string; en: string };
  explanationTemplates: Record<
    "strong" | "stable" | "needs_attention" | "insufficient_information" | "blocked_by_contradiction",
    { es: string; en: string }
  >;
  calculationVersion: string;
};

export const HEALTH_RULE_REGISTRY: readonly DimensionRule[] = [
  {
    dimensionKey: "business_foundation",
    relevantFactKeys: ["owner_defined_success", "product_service_summary"],
    requiredFactKeys: ["owner_defined_success", "product_service_summary"],
    helpfulFactKeys: [],
    sensitiveFactKeys: [],
    negativeSignalConditions: [],
    capacityRiskConditions: [],
    freshnessNote: {
      es: "El fundamento del negocio rara vez cambia; la información puede considerarse vigente por más tiempo.",
      en: "Business foundation changes rarely; information can be considered current for longer.",
    },
    explanationTemplates: {
      strong: {
        es: "El dueño ha confirmado qué significa el éxito y qué ofrece el negocio, con información reciente.",
        en: "The owner has confirmed what success means and what the business offers, with recent information.",
      },
      stable: {
        es: "Existe una descripción del propósito y la oferta del negocio, aunque no toda está confirmada por el dueño.",
        en: "A description of the business's purpose and offering exists, though not all of it is owner-confirmed.",
      },
      needs_attention: {
        es: "La información disponible sobre el fundamento del negocio revela un problema conocido.",
        en: "The available information about the business foundation reveals a known problem.",
      },
      insufficient_information: {
        es: "Todavía no sabemos lo suficiente sobre el propósito o la oferta central del negocio.",
        en: "We don't yet know enough about the business's core purpose or offering.",
      },
      blocked_by_contradiction: {
        es: "Hay una contradicción sin resolver sobre el fundamento del negocio.",
        en: "There is an unresolved contradiction about the business foundation.",
      },
    },
    calculationVersion: CALCULATION_VERSION,
  },
  {
    dimensionKey: "customer_clarity",
    relevantFactKeys: ["target_customer", "primary_customer_language", "multicultural_community_importance"],
    requiredFactKeys: ["target_customer"],
    helpfulFactKeys: ["primary_customer_language", "multicultural_community_importance"],
    sensitiveFactKeys: [],
    negativeSignalConditions: [],
    capacityRiskConditions: [],
    freshnessNote: {
      es: "El perfil de clientes puede cambiar con el tiempo; la información de más de 9 meses se considera desactualizada.",
      en: "The customer profile can shift over time; information older than 9 months is treated as stale.",
    },
    explanationTemplates: {
      strong: {
        es: "El dueño ha confirmado quiénes son sus mejores clientes, con información reciente y respaldo adicional.",
        en: "The owner has confirmed who their best customers are, with recent information and additional support.",
      },
      stable: {
        es: "Existe una descripción de los clientes objetivo, aunque falta información complementaria o confirmación.",
        en: "A description of the target customers exists, though supporting detail or confirmation is missing.",
      },
      needs_attention: {
        es: "La información conocida sobre los clientes revela un problema.",
        en: "The known information about customers reveals a problem.",
      },
      insufficient_information: {
        es: "Todavía no sabemos quiénes son los clientes principales de este negocio.",
        en: "We don't yet know who this business's main customers are.",
      },
      blocked_by_contradiction: {
        es: "Hay una contradicción sin resolver sobre quiénes son los clientes de este negocio.",
        en: "There is an unresolved contradiction about who this business's customers are.",
      },
    },
    calculationVersion: CALCULATION_VERSION,
  },
  {
    dimensionKey: "offer_and_value",
    relevantFactKeys: ["product_service_summary", "most_profitable_service", "most_enjoyed_service", "service_limitation", "most_requested_item"],
    requiredFactKeys: ["product_service_summary"],
    helpfulFactKeys: ["most_profitable_service", "most_enjoyed_service", "service_limitation", "most_requested_item"],
    sensitiveFactKeys: ["most_profitable_service", "service_limitation"],
    negativeSignalConditions: [],
    capacityRiskConditions: [],
    freshnessNote: {
      es: "La oferta de productos o servicios puede cambiar; información de más de 9 meses se considera desactualizada.",
      en: "Product or service offerings can change; information older than 9 months is treated as stale.",
    },
    explanationTemplates: {
      strong: {
        es: "Hay una descripción clara y reciente de lo que vende el negocio, incluyendo qué funciona mejor.",
        en: "There is a clear, recent description of what the business sells, including what works best.",
      },
      stable: {
        es: "Sabemos qué vende el negocio, aunque falta detalle sobre rentabilidad o limitaciones.",
        en: "We know what the business sells, though detail on profitability or limitations is missing.",
      },
      needs_attention: {
        es: "La información conocida sobre la oferta revela una limitación o un problema de margen.",
        en: "The known information about the offer reveals a limitation or a margin problem.",
      },
      insufficient_information: {
        es: "Todavía no sabemos con suficiente claridad qué vende este negocio.",
        en: "We don't yet know clearly enough what this business sells.",
      },
      blocked_by_contradiction: {
        es: "Hay una contradicción sin resolver sobre qué ofrece este negocio.",
        en: "There is an unresolved contradiction about what this business offers.",
      },
    },
    calculationVersion: CALCULATION_VERSION,
  },
  {
    dimensionKey: "operations_and_capacity",
    relevantFactKeys: ["team_capacity", "busy_season", "current_business_challenge", "demand_readiness"],
    requiredFactKeys: ["team_capacity", "demand_readiness"],
    helpfulFactKeys: ["busy_season", "current_business_challenge"],
    sensitiveFactKeys: ["team_capacity"],
    negativeSignalConditions: [
      { factKey: "team_capacity", field: "answer", matchValues: [true] },
      { factKey: "demand_readiness", field: "choice", matchValues: ["hurt"] },
    ],
    capacityRiskConditions: [{ factKey: "demand_readiness", field: "choice", matchValues: ["hurt"] }],
    freshnessNote: {
      es: "La capacidad operativa cambia con frecuencia; información de más de 3 meses se considera envejecida.",
      en: "Operational capacity changes often; information older than 3 months is treated as aging.",
    },
    explanationTemplates: {
      strong: {
        es: "El dueño ha confirmado su capacidad actual y si más demanda ayudaría, con información reciente.",
        en: "The owner has confirmed their current capacity and whether more demand would help, with recent information.",
      },
      stable: {
        es: "Sabemos algo sobre la capacidad operativa, aunque falta confirmación reciente.",
        en: "We know something about operational capacity, though recent confirmation is missing.",
      },
      needs_attention: {
        es: "La información conocida indica que el equipo está al límite o que más demanda perjudicaría al negocio.",
        en: "The known information indicates the team is stretched or that more demand would hurt the business.",
      },
      insufficient_information: {
        es: "Todavía no sabemos lo suficiente sobre la capacidad operativa de este negocio.",
        en: "We don't yet know enough about this business's operational capacity.",
      },
      blocked_by_contradiction: {
        es: "Hay una contradicción sin resolver sobre la capacidad operativa de este negocio.",
        en: "There is an unresolved contradiction about this business's operational capacity.",
      },
    },
    calculationVersion: CALCULATION_VERSION,
  },
  {
    dimensionKey: "visibility_and_discovery",
    relevantFactKeys: ["current_marketing_channel", "active_digital_profiles"],
    requiredFactKeys: ["current_marketing_channel"],
    helpfulFactKeys: ["active_digital_profiles"],
    sensitiveFactKeys: [],
    negativeSignalConditions: [],
    capacityRiskConditions: [],
    freshnessNote: {
      es: "Los canales de visibilidad cambian con el tiempo; información de más de 9 meses se considera desactualizada.",
      en: "Visibility channels change over time; information older than 9 months is treated as stale.",
    },
    explanationTemplates: {
      strong: {
        es: "Sabemos con claridad, y de forma reciente, cómo lo encuentran los clientes.",
        en: "We know clearly, and recently, how customers find this business.",
      },
      stable: {
        es: "Sabemos algo sobre cómo lo encuentran los clientes, aunque falta detalle o confirmación reciente.",
        en: "We know something about how customers find this business, though detail or recent confirmation is missing.",
      },
      needs_attention: {
        es: "La información conocida revela un problema de visibilidad.",
        en: "The known information reveals a visibility problem.",
      },
      insufficient_information: {
        es: "Todavía no sabemos cómo encuentran los clientes a este negocio.",
        en: "We don't yet know how customers find this business.",
      },
      blocked_by_contradiction: {
        es: "Hay una contradicción sin resolver sobre cómo los clientes encuentran este negocio.",
        en: "There is an unresolved contradiction about how customers find this business.",
      },
    },
    calculationVersion: CALCULATION_VERSION,
  },
  {
    dimensionKey: "communication_and_follow_up",
    relevantFactKeys: ["preferred_contact_method"],
    requiredFactKeys: ["preferred_contact_method"],
    helpfulFactKeys: [],
    sensitiveFactKeys: [],
    negativeSignalConditions: [],
    capacityRiskConditions: [],
    freshnessNote: {
      es: "Las preferencias de comunicación cambian con poca frecuencia; información de más de 9 meses se considera desactualizada.",
      en: "Communication preferences change infrequently; information older than 9 months is treated as stale.",
    },
    explanationTemplates: {
      strong: {
        es: "Sabemos con claridad, y de forma reciente, cómo prefiere comunicarse este negocio con sus clientes.",
        en: "We know clearly, and recently, how this business prefers to communicate with customers.",
      },
      stable: {
        es: "Sabemos algo sobre las preferencias de comunicación, aunque falta confirmación reciente.",
        en: "We know something about communication preferences, though recent confirmation is missing.",
      },
      needs_attention: {
        es: "La información conocida revela un problema de comunicación o seguimiento.",
        en: "The known information reveals a communication or follow-up problem.",
      },
      insufficient_information: {
        es: "Todavía no sabemos cómo prefiere comunicarse este negocio con sus clientes.",
        en: "We don't yet know how this business prefers to communicate with customers.",
      },
      blocked_by_contradiction: {
        es: "Hay una contradicción sin resolver sobre cómo se comunica este negocio con sus clientes.",
        en: "There is an unresolved contradiction about how this business communicates with customers.",
      },
    },
    calculationVersion: CALCULATION_VERSION,
  },
  {
    dimensionKey: "owner_goals_and_sustainability",
    relevantFactKeys: ["owner_goals", "family_lifestyle_priority", "attempted_solutions", "preferred_support_level", "realistic_time_investment"],
    requiredFactKeys: ["owner_goals"],
    helpfulFactKeys: ["family_lifestyle_priority", "attempted_solutions", "preferred_support_level", "realistic_time_investment"],
    sensitiveFactKeys: ["family_lifestyle_priority", "realistic_time_investment"],
    negativeSignalConditions: [],
    capacityRiskConditions: [],
    freshnessNote: {
      es: "Las metas del dueño pueden evolucionar; información de más de 9 meses se considera desactualizada.",
      en: "Owner goals can evolve; information older than 9 months is treated as stale.",
    },
    explanationTemplates: {
      strong: {
        es: "El dueño ha confirmado sus metas y lo que es realista para él, con información reciente.",
        en: "The owner has confirmed their goals and what is realistic for them, with recent information.",
      },
      stable: {
        es: "Sabemos algo sobre las metas del dueño, aunque falta detalle o confirmación reciente.",
        en: "We know something about the owner's goals, though detail or recent confirmation is missing.",
      },
      needs_attention: {
        es: "La información conocida revela una tensión entre las metas del dueño y la realidad actual del negocio.",
        en: "The known information reveals a tension between the owner's goals and the business's current reality.",
      },
      insufficient_information: {
        es: "Todavía no sabemos cuáles son las metas del dueño para este negocio.",
        en: "We don't yet know what this owner's goals are for this business.",
      },
      blocked_by_contradiction: {
        es: "Hay una contradicción sin resolver sobre las metas del dueño.",
        en: "There is an unresolved contradiction about the owner's goals.",
      },
    },
    calculationVersion: CALCULATION_VERSION,
  },
];

export function ruleForDimension(dimensionKey: HealthDimensionKey): DimensionRule {
  const rule = HEALTH_RULE_REGISTRY.find((r) => r.dimensionKey === dimensionKey);
  if (!rule) throw new Error(`No health rule registered for dimension: ${dimensionKey}`);
  return rule;
}
