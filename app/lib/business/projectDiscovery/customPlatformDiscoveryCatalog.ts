/**
 * Client Discovery & Project Blueprint Engine, Gate 10.2 — discovery catalog for the standalone
 * "Custom Platform / Software Project" project type (MD §7, §10 CUSTOM PLATFORM, Gate 10.2
 * <phase_11>). Previously `custom_platform_software` silently used the generic 103-question Website
 * catalog (Gate 10.1 GAP17 finding) — the REAL Custom Platform mechanism has always lived entirely
 * under project type "website" via architecture escalation (detectWebsiteScopeSignals ->
 * CUSTOM_PLATFORM class, proven live in Gate 10.1 GAP5), which remains fully intact and unchanged.
 * This catalog is the SEPARATE, honest entry point for a client who already knows day one that they
 * need custom software — real scoping questions, never brochure-website questions (domain, hosting,
 * page architecture) that don't materially apply to a private application.
 *
 * The generated Blueprint is an architecture/PLANNING document, not a build-ready contract —
 * requiresCommercialReview is unconditionally true for every Custom Platform standalone blueprint
 * (selecting this type IS the commercial-review trigger), enforced at release time by
 * releaseReadinessAssembler.ts exactly like Website's own Custom Platform escalation — this
 * standalone entry point can never ordinary-flow itself into a released/handed-off state.
 */
import type { SpecializedRequirementDefinition } from "./specializedDiscoveryEngine";

export const CUSTOM_PLATFORM_CATALOG_VERSION = "custom_platform_discovery_v1";

export type CustomPlatformSection = "scope" | "users_access" | "data_workflow" | "integrations_payments" | "security_privacy" | "operations" | "delivery" | "approval";

export const CUSTOM_PLATFORM_SECTIONS: readonly CustomPlatformSection[] = [
  "scope", "users_access", "data_workflow", "integrations_payments", "security_privacy", "operations", "delivery", "approval",
];

type CustomPlatformReq = SpecializedRequirementDefinition<CustomPlatformSection>;

export const CUSTOM_PLATFORM_REQUIREMENTS: readonly CustomPlatformReq[] = [
  {
    fieldKey: "cp_problem_to_solve", section: "scope",
    labelEn: "Problem this software needs to solve", labelEs: "Problema que este software necesita resolver",
    operatorGuidanceEn: "The real operational problem — never a feature wishlist without a driving problem.", operatorGuidanceEs: "El problema operativo real — nunca una lista de funciones sin un problema que la impulse.",
    clientQuestionEn: "What real problem or process should this software handle?", clientQuestionEs: "¿Qué problema o proceso real debe manejar este software?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "cp_user_roles_accounts", section: "users_access",
    labelEn: "User roles / accounts needed", labelEs: "Roles de usuario / cuentas necesarias",
    operatorGuidanceEn: "Every distinct role that needs its own login/permissions.", operatorGuidanceEs: "Cada rol distinto que necesita su propio inicio de sesión/permisos.",
    clientQuestionEn: "Who needs to log in, and what different types of users/roles are there?", clientQuestionEs: "¿Quién necesita iniciar sesión, y qué diferentes tipos de usuarios/roles hay?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "cp_private_surfaces", section: "users_access",
    labelEn: "Private surfaces / dashboards needed", labelEs: "Superficies privadas / paneles necesarios",
    operatorGuidanceEn: "What each role actually sees once logged in.", operatorGuidanceEs: "Qué ve realmente cada rol una vez que inicia sesión.",
    clientQuestionEn: "What private screens/dashboards does each role need?", clientQuestionEs: "¿Qué pantallas/paneles privados necesita cada rol?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 2, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "cp_data_model", section: "data_workflow",
    labelEn: "Data model — what records need to persist", labelEs: "Modelo de datos — qué registros necesitan persistir",
    operatorGuidanceEn: "The real entities this system needs to remember, in the client's own terms — Leonix formalizes the schema later.", operatorGuidanceEs: "Las entidades reales que este sistema necesita recordar, en los propios términos del cliente.",
    clientQuestionEn: "What information does this system need to remember/store over time?", clientQuestionEs: "¿Qué información necesita recordar/almacenar este sistema con el tiempo?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "cp_workflow_state", section: "data_workflow",
    labelEn: "Workflow / state machine", labelEs: "Flujo de trabajo / máquina de estados",
    operatorGuidanceEn: "The real steps a record moves through — never invented without a described process.", operatorGuidanceEs: "Los pasos reales por los que pasa un registro — nunca inventados sin un proceso descrito.",
    clientQuestionEn: "Does a record/request move through stages or statuses? What are they?", clientQuestionEs: "¿Un registro/solicitud pasa por etapas o estados? ¿Cuáles son?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 2, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "cp_external_integrations", section: "integrations_payments",
    labelEn: "External systems / integrations needed", labelEs: "Sistemas externos / integraciones necesarias",
    operatorGuidanceEn: "Real named systems this must talk to — never assumed.", operatorGuidanceEs: "Sistemas reales con nombre con los que esto debe comunicarse — nunca asumidos.",
    clientQuestionEn: "Does this need to connect to any other system you already use?", clientQuestionEs: "¿Esto necesita conectarse a algún otro sistema que ya use?",
    valueType: "text", defaultCompletenessClass: "required_before_launch", whoShouldAnswer: "CLIENT",
    priority: 2, mayBlockBuild: false, mayBlockLaunch: true, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "cp_payments_needed", section: "integrations_payments",
    labelEn: "Payments involved", labelEs: "Pagos involucrados",
    operatorGuidanceEn: "Whether real money moves through this system — a major scope/compliance signal.", operatorGuidanceEs: "Si dinero real se mueve a través de este sistema — una señal importante de alcance/cumplimiento.",
    clientQuestionEn: "Does money change hands through this system?", clientQuestionEs: "¿Dinero cambia de manos a través de este sistema?",
    valueType: "boolean", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "cp_security_privacy", section: "security_privacy",
    labelEn: "Security / privacy / compliance considerations", labelEs: "Consideraciones de seguridad / privacidad / cumplimiento",
    operatorGuidanceEn: "Sensitive data categories (minors, medical, financial) — flag for official research, never guessed.", operatorGuidanceEs: "Categorías de datos sensibles (menores, médicos, financieros) — señalar para investigación oficial, nunca adivinado.",
    clientQuestionEn: "Will this handle any sensitive data (minors, medical, financial, etc.)?", clientQuestionEs: "¿Esto manejará algún dato sensible (menores, médico, financiero, etc.)?",
    valueType: "text", defaultCompletenessClass: "needs_official_research", whoShouldAnswer: "OFFICIAL_RESEARCH",
    priority: 1, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "cp_admin_needs", section: "operations",
    labelEn: "Admin needs", labelEs: "Necesidades de administración",
    operatorGuidanceEn: "What staff/admins need to manage day-to-day, distinct from end-user roles.", operatorGuidanceEs: "Qué necesita administrar el personal/administradores día a día, distinto de los roles de usuario final.",
    clientQuestionEn: "What will an admin need to manage or control?", clientQuestionEs: "¿Qué necesitará administrar o controlar un administrador?",
    valueType: "text", defaultCompletenessClass: "required_before_launch", whoShouldAnswer: "CLIENT",
    priority: 2, mayBlockBuild: false, mayBlockLaunch: true, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "cp_analytics_needs", section: "operations",
    labelEn: "Analytics needs", labelEs: "Necesidades de analítica",
    operatorGuidanceEn: "What the client actually needs to measure inside the application, if anything.", operatorGuidanceEs: "Qué necesita medir realmente el cliente dentro de la aplicación, si acaso.",
    clientQuestionEn: "Is there anything you need to measure or report on inside this system?", clientQuestionEs: "¿Hay algo que necesite medir o reportar dentro de este sistema?",
    valueType: "text", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "cp_ownership", section: "delivery",
    labelEn: "Ownership of the platform", labelEs: "Propiedad de la plataforma",
    operatorGuidanceEn: "Never ask for a password — only who owns/hosts/pays for the platform long-term.", operatorGuidanceEs: "Nunca pida una contraseña — solo quién es dueño/aloja/paga la plataforma a largo plazo.",
    clientQuestionEn: "Who will own and pay for this platform long-term?", clientQuestionEs: "¿Quién será dueño y pagará esta plataforma a largo plazo?",
    valueType: "text", defaultCompletenessClass: "required_before_launch", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: false, mayBlockLaunch: true, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "cp_delivery_expectations", section: "delivery",
    labelEn: "Delivery expectations", labelEs: "Expectativas de entrega",
    operatorGuidanceEn: "A real timeline expectation — never a Leonix-promised date before commercial review resolves.", operatorGuidanceEs: "Una expectativa de cronograma real — nunca una fecha prometida por Leonix antes de que se resuelva la revisión comercial.",
    clientQuestionEn: "What timeline expectations do you have, understanding this needs a real technical/commercial review first?", clientQuestionEs: "¿Qué expectativas de cronograma tiene, entendiendo que esto primero necesita una revisión técnica/comercial real?",
    valueType: "text", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "custom_platform_commercial_review", section: "approval",
    labelEn: "Commercial/architecture review status", labelEs: "Estado de revisión comercial/arquitectura",
    operatorGuidanceEn: "Internal — the SAME field/mechanism Website's own Custom Platform escalation uses (never a second, disconnected commercial-approval domain). Stays pending_review until a real Leonix commercial process resolves it.", operatorGuidanceEs: "Interno — el mismo campo/mecanismo que usa la escalación de Plataforma Personalizada del Sitio Web.",
    clientQuestionEn: "(Internal — not asked to the client)", clientQuestionEs: "(Interno — no se pregunta al cliente)",
    valueType: "text", defaultCompletenessClass: "needs_leonix_decision", whoShouldAnswer: "LEONIX",
    priority: 1, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "decision_maker_approver", section: "approval",
    labelEn: "Approver", labelEs: "Persona que aprueba",
    operatorGuidanceEn: "Shared with every other family's approval section.", operatorGuidanceEs: "Compartido con la sección de aprobación de cada otra familia.",
    clientQuestionEn: "Who will give final approval on this?", clientQuestionEs: "¿Quién dará la aprobación final de esto?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
];
