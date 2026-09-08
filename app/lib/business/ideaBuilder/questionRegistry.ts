import type { ReadinessCategory } from "./types";

export type ReadinessQuestion = {
  key: string;
  category: ReadinessCategory;
  es: string;
  en: string;
  /** The related Learning Center lesson to suggest next -- resolved by capability_key, not a hard id. */
  relatedCapabilityKey: string;
};

/**
 * Fixed, deterministic readiness question set -- never AI-generated, never a market-validation or
 * profitability instrument. Two questions per category (8 total). Answers are captured in
 * business_idea_drafts.readiness_answers as {key: boolean|string|null}.
 */
export const READINESS_QUESTIONS: readonly ReadinessQuestion[] = [
  {
    key: "has_clear_time_commitment",
    category: "startup_readiness",
    es: "Tienes claro cuanto tiempo a la semana puedes dedicar a este negocio?",
    en: "Do you know how many hours a week you can realistically commit to this business?",
    relatedCapabilityKey: "healthy_capacity_boundaries",
  },
  {
    key: "has_starting_funds_plan",
    category: "startup_readiness",
    es: "Tienes una idea de cuanto dinero necesitas para empezar?",
    en: "Do you have an idea of how much money you would need to get started?",
    relatedCapabilityKey: "revenue_vs_profit",
  },
  {
    key: "comfortable_with_phone_tools",
    category: "technology_readiness",
    es: "Te sientes comodo usando tu telefono para tomar fotos, enviar mensajes y usar aplicaciones basicas?",
    en: "Are you comfortable using your phone to take photos, send messages, and use basic apps?",
    relatedCapabilityKey: "google_business_basics",
  },
  {
    key: "has_email_or_account_ready",
    category: "technology_readiness",
    es: "Tienes un correo electronico que revisas regularmente para tu negocio?",
    en: "Do you have an email address you check regularly for your business?",
    relatedCapabilityKey: "consistent_business_info",
  },
  {
    key: "knows_where_customers_look",
    category: "visibility_basics",
    es: "Sabes en que lugares tus posibles clientes buscan negocios como el tuyo?",
    en: "Do you know where your potential customers look for businesses like yours?",
    relatedCapabilityKey: "advertising_fundamentals",
  },
  {
    key: "has_business_name_idea",
    category: "visibility_basics",
    es: "Tienes una idea de nombre para tu negocio?",
    en: "Do you have an idea for your business name?",
    relatedCapabilityKey: "branding_basics",
  },
  {
    key: "comfortable_responding_customers",
    category: "communication_basics",
    es: "Te sientes comodo respondiendo preguntas de clientes por telefono o mensaje?",
    en: "Are you comfortable responding to customer questions by phone or message?",
    relatedCapabilityKey: "whatsapp_business_basics",
  },
  {
    key: "has_way_to_be_contacted",
    category: "communication_basics",
    es: "Tienes un numero de telefono o WhatsApp que puedas usar para tu negocio?",
    en: "Do you have a phone number or WhatsApp you can use for your business?",
    relatedCapabilityKey: "whatsapp_business_basics",
  },
];
