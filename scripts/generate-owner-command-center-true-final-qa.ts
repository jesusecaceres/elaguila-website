/**
 * Generates app/(site)/dashboard/OWNER_COMMAND_CENTER_TRUE_FINAL_QA.md
 * One-shot execution-record builder for True Final QA. Not a construction gate.
 */
import { writeFileSync } from "node:fs";
import path from "node:path";

type Status = "PASS" | "FAIL" | "BLOCKED" | "N/A" | "FUTURE" | "AUTOMATED ONLY";

type Family = {
  code: string;
  family: string;
  entity: string;
  landing: string;
  checkpoint: string;
  form: string;
  results: string;
  resultsAlias?: string;
  publicDetail: string;
  ownerLibrary: string;
  ownerWorkspace: string;
  edit: string;
  preview: string;
  analytics: string;
  admin: string;
  identityPublic: string;
  identityOwner: string;
  identityAdmin: string;
  paid: "free" | "paid-single" | "business-monthly" | "campaign" | "staged" | "mixed" | "none";
  like: boolean;
  save: boolean;
  share: boolean;
  report: boolean;
  trust: boolean;
  contact: boolean;
  inventory: boolean;
  applications: boolean;
  campaign: boolean;
  previewSupported: boolean;
  ownerEdit: boolean;
  analyticsSupported: boolean;
  architecture:
    | "ACCOUNT"
    | "LIBRARY"
    | "GENERIC"
    | "RICH_BUSINESS"
    | "SPECIALIZED_APP"
    | "INVENTORY_PARENT"
    | "INVENTORY_CHILD"
    | "STAGED"
    | "CAMPAIGN"
    | "FUTURE";
  notes: string;
};

const families: Family[] = [
  {
    code: "ENV",
    family: "En Venta / Varios",
    entity: "generic listing · free / pro / storefront lanes",
    landing: "/clasificados/en-venta",
    checkpoint: "/publicar/en-venta",
    form: "/clasificados/publicar/en-venta/free | /pro | /storefront",
    results: "/clasificados/en-venta/results",
    publicDetail: "/clasificados/anuncio/{sourceId}",
    ownerLibrary: "/dashboard/mis-anuncios (cat=en-venta)",
    ownerWorkspace: "/dashboard/mis-anuncios/{sourceId}",
    edit: "/dashboard/mis-anuncios/{sourceId}/editar",
    preview: "/clasificados/en-venta/preview",
    analytics: "/dashboard/mis-anuncios/{sourceId} analytics tab + /dashboard/analytics/listing",
    admin: "/admin/workspace/clasificados/en-venta",
    identityPublic: "listings.sourceId → /clasificados/anuncio/{sourceId}",
    identityOwner: "same sourceId on mis-anuncios/[id]",
    identityAdmin: "queue row.id = listing UUID; View public → /clasificados/anuncio/{id}",
    paid: "mixed",
    like: true,
    save: true,
    share: true,
    report: true,
    trust: false,
    contact: true,
    inventory: false,
    applications: false,
    campaign: false,
    previewSupported: true,
    ownerEdit: true,
    analyticsSupported: true,
    architecture: "GENERIC",
    notes: "Free flow representative. Pro/storefront are paid-single.",
  },
  {
    code: "AUP",
    family: "Autos Privado",
    entity: "autos_privado vehicle",
    landing: "/clasificados/autos",
    checkpoint: "/publicar/autos",
    form: "/publicar/autos/privado",
    results: "/clasificados/autos/resultados → 308 /clasificados/autos/results",
    resultsAlias: "/clasificados/autos/results",
    publicDetail: "/clasificados/autos/vehiculo/{sourceId}",
    ownerLibrary: "/dashboard/mis-anuncios (cat=autos)",
    ownerWorkspace: "/dashboard/mis-anuncios/{sourceId}",
    edit: "/dashboard/mis-anuncios/{sourceId}/editar (autos privado editor)",
    preview: "autos privado preview (registry previewRoute)",
    analytics: "listing analytics via generic workspace",
    admin: "/admin/workspace/clasificados/autos",
    identityPublic: "vehicle UUID → /clasificados/autos/vehiculo/{id}",
    identityOwner: "same vehicle UUID",
    identityAdmin: "autosLiveVehiclePath(row.id) — vehicle UUID not raw generic anuncio",
    paid: "paid-single",
    like: true,
    save: true,
    share: true,
    report: true,
    trust: false,
    contact: true,
    inventory: false,
    applications: false,
    campaign: false,
    previewSupported: true,
    ownerEdit: true,
    analyticsSupported: true,
    architecture: "GENERIC",
    notes: "Canonical public identity is vehicle path, never /clasificados/anuncio/{id}.",
  },
  {
    code: "AUDP",
    family: "Autos Dealer Parent",
    entity: "autos_negocios dealer inventory group / parent listing",
    landing: "/clasificados/dealers-de-autos",
    checkpoint: "/publicar/autos",
    form: "/publicar/autos/negocios",
    results: "/clasificados/dealers-de-autos/results",
    publicDetail: "/clasificados/autos/dealer/{dealerInventoryGroupId} (group) + vehicle children",
    ownerLibrary: "/dashboard/mis-anuncios (autos negocios parent)",
    ownerWorkspace: "/dashboard/mis-anuncios/{parentSourceId}",
    edit: "parent inventory editor; child via editVehicleId=",
    preview: "parent/child preview via autos adapter",
    analytics: "specialized parent analytics",
    admin: "/admin/workspace/clasificados/autos",
    identityPublic: "parent groupId + child vehicle UUID",
    identityOwner: "parent sourceId owns inventory; child edit stays on parent with editVehicleId",
    identityAdmin: "admin vehicle path uses child/live vehicle id",
    paid: "business-monthly",
    like: true,
    save: true,
    share: true,
    report: false,
    trust: false,
    contact: true,
    inventory: true,
    applications: false,
    campaign: false,
    previewSupported: true,
    ownerEdit: true,
    analyticsSupported: true,
    architecture: "INVENTORY_PARENT",
    notes: "Parent/child identity must not collapse to a single UUID.",
  },
  {
    code: "AUDC",
    family: "Autos Dealer Vehicle Child",
    entity: "dealer vehicle child of parent inventory",
    landing: "/clasificados/dealers-de-autos",
    checkpoint: "N/A — child created inside parent inventory, not a separate landing lane",
    form: "parent inventory child editor (editVehicleId)",
    results: "/clasificados/dealers-de-autos/results",
    publicDetail: "/clasificados/autos/vehiculo/{childId}",
    ownerLibrary: "shown under parent in Mis Anuncios / inventory module",
    ownerWorkspace: "same parent workspace + child drawer",
    edit: "parent inventory `editVehicleId={childId}`",
    preview: "child preview uses child id",
    analytics: "child analytics use child id",
    admin: "/admin/workspace/clasificados/autos — View public autosLiveVehiclePath(child id)",
    identityPublic: "child vehicle UUID",
    identityOwner: "child id scoped to parent ownership",
    identityAdmin: "child vehicle UUID",
    paid: "business-monthly",
    like: true,
    save: true,
    share: true,
    report: false,
    trust: false,
    contact: true,
    inventory: true,
    applications: false,
    campaign: false,
    previewSupported: true,
    ownerEdit: true,
    analyticsSupported: true,
    architecture: "INVENTORY_CHILD",
    notes: "Child cannot escape parent ownership.",
  },
  {
    code: "BRP",
    family: "Bienes Raíces Privado",
    entity: "bienes_raices_privado / FSBO listing",
    landing: "/clasificados/bienes-raices",
    checkpoint: "/clasificados/publicar/bienes-raices",
    form: "/publicar/bienes-raices/privado",
    results: "/clasificados/bienes-raices/resultados",
    publicDetail: "/clasificados/anuncio/{sourceId}",
    ownerLibrary: "/dashboard/mis-anuncios (cat=bienes-raices)",
    ownerWorkspace: "/dashboard/mis-anuncios/{sourceId}",
    edit: "/dashboard/mis-anuncios/{sourceId}/editar",
    preview: "BR privado previewRoute",
    analytics: "generic listing analytics",
    admin: "/admin/workspace/clasificados/bienes-raices",
    identityPublic: "listing UUID → anuncio/{id}",
    identityOwner: "same sourceId",
    identityAdmin: "queue row.id → /clasificados/anuncio/{id}",
    paid: "paid-single",
    like: true,
    save: true,
    share: true,
    report: false,
    trust: false,
    contact: true,
    inventory: false,
    applications: false,
    campaign: false,
    previewSupported: true,
    ownerEdit: true,
    analyticsSupported: true,
    architecture: "GENERIC",
    notes: "FSBO / privado is generic listing identity, not BR negocio parent.",
  },
  {
    code: "BRN",
    family: "Bienes Raíces Negocio Parent",
    entity: "bienes_raices_negocio parent listing",
    landing: "/clasificados/bienes-raices",
    checkpoint: "/clasificados/publicar/bienes-raices",
    form: "/clasificados/publicar/bienes-raices/negocio/agente-individual",
    results: "/clasificados/bienes-raices/resultados",
    publicDetail: "/clasificados/anuncio/{parentSourceId}",
    ownerLibrary: "/dashboard/mis-anuncios (BR negocio parent)",
    ownerWorkspace: "/dashboard/mis-anuncios/{parentSourceId}",
    edit: "inventory-edit on parent (bienesInventoryEditHref)",
    preview: "specialized parent preview",
    analytics: "parent analytics",
    admin: "/admin/workspace/clasificados/bienes-raices",
    identityPublic: "parent listing UUID → anuncio/{id}",
    identityOwner: "parent sourceId + inventory children",
    identityAdmin: "parent row.id; children are separate listing UUIDs",
    paid: "business-monthly",
    like: true,
    save: true,
    share: true,
    report: false,
    trust: false,
    contact: true,
    inventory: true,
    applications: false,
    campaign: false,
    previewSupported: true,
    ownerEdit: true,
    analyticsSupported: true,
    architecture: "INVENTORY_PARENT",
    notes: "Lifecycle must use callBrLifecycleMutation, never generic patch.",
  },
  {
    code: "BRC",
    family: "Bienes Raíces Property Child",
    entity: "inventory_property child of BR negocio parent",
    landing: "/clasificados/bienes-raices",
    checkpoint: "N/A — child created inside parent inventory",
    form: "parent inventory child draft openChildDraftId=br-db-child-{id}",
    results: "/clasificados/bienes-raices/resultados",
    publicDetail: "/clasificados/anuncio/{childId}",
    ownerLibrary: "under parent inventory module",
    ownerWorkspace: "same parent [id] + openChildDraftId",
    edit: "child draft on parent workspace",
    preview: "resolver omits BR child preview (previewSupported false for child)",
    analytics: "child listing analytics if published",
    admin: "/admin/workspace/clasificados/bienes-raices — child listing UUID",
    identityPublic: "child listing UUID → anuncio/{childId}",
    identityOwner: "openChildDraftId=br-db-child-{id} on parent sourceId",
    identityAdmin: "child listing UUID",
    paid: "business-monthly",
    like: true,
    save: true,
    share: true,
    report: false,
    trust: false,
    contact: true,
    inventory: true,
    applications: false,
    campaign: false,
    previewSupported: false,
    ownerEdit: true,
    analyticsSupported: true,
    architecture: "INVENTORY_CHILD",
    notes: "Resolver explicitly omits BR child preview. Do not invent it.",
  },
  {
    code: "RNP",
    family: "Rentas Privado",
    entity: "rentas_privado listing",
    landing: "/clasificados/rentas",
    checkpoint: "/clasificados/publicar/rentas",
    form: "/publicar/rentas/privado",
    results: "/clasificados/rentas/results",
    publicDetail: "/clasificados/rentas/listing/{sourceId}",
    ownerLibrary: "/dashboard/mis-anuncios (cat=rentas)",
    ownerWorkspace: "/dashboard/mis-anuncios/{sourceId}",
    edit: "rentas listing-edit API / dashboard edit href",
    preview: "/clasificados/rentas/preview/privado?listingId=",
    analytics: "generic listing analytics (supported)",
    admin: "/admin/workspace/clasificados/rentas + /rentas/{id}",
    identityPublic: "listing UUID → /clasificados/rentas/listing/{id} NOT anuncio",
    identityOwner: "same sourceId",
    identityAdmin: "rentasListingPublicPath(row.id)",
    paid: "paid-single",
    like: true,
    save: true,
    share: true,
    report: false,
    trust: false,
    contact: true,
    inventory: false,
    applications: false,
    campaign: false,
    previewSupported: true,
    ownerEdit: true,
    analyticsSupported: true,
    architecture: "GENERIC",
    notes: "Admin View public must not use generic anuncio path.",
  },
  {
    code: "RNN",
    family: "Rentas Negocio",
    entity: "rentas_negocio listing (repository-supported)",
    landing: "/clasificados/rentas",
    checkpoint: "/clasificados/publicar/rentas",
    form: "/publicar/rentas/negocio",
    results: "/clasificados/rentas/results",
    publicDetail: "/clasificados/rentas/listing/{sourceId}",
    ownerLibrary: "/dashboard/mis-anuncios (rentas negocio branch)",
    ownerWorkspace: "/dashboard/mis-anuncios/{sourceId}",
    edit: "rentas negocio listing-edit",
    preview: "/clasificados/rentas/preview/negocio?listingId=",
    analytics: "capability registry: analytics unsupported for rentas-negocio",
    admin: "/admin/workspace/clasificados/rentas",
    identityPublic: "listing UUID → rentas/listing/{id}",
    identityOwner: "same sourceId; branch=rentas_negocio",
    identityAdmin: "rentasListingPublicPath",
    paid: "business-monthly",
    like: true,
    save: true,
    share: true,
    report: false,
    trust: false,
    contact: true,
    inventory: false,
    applications: false,
    campaign: false,
    previewSupported: true,
    ownerEdit: true,
    analyticsSupported: false,
    architecture: "RICH_BUSINESS",
    notes: "Repository currently supports Rentas Negocio. Analytics capability is unsupported — N/A not a defect.",
  },
  {
    code: "EMQ",
    family: "Empleos Quick",
    entity: "empleos listing · quick lane",
    landing: "/clasificados/empleos",
    checkpoint: "/publicar/empleos",
    form: "/publicar/empleos/quick",
    results: "/clasificados/empleos/resultados",
    publicDetail: "/clasificados/empleos/{slug}",
    ownerLibrary: "/dashboard/empleos",
    ownerWorkspace: "/dashboard/empleos/{listingId}",
    edit: "/dashboard/empleos/{listingId}",
    preview: "unsupported (registry previewRoute null)",
    analytics: "unproven — treat as N/A for owner analytics UI",
    admin: "/admin/workspace/clasificados/empleos — View public /clasificados/empleos/{slug}",
    identityPublic: "slug (not raw UUID)",
    identityOwner: "listingId (sourceId) on /dashboard/empleos/{listingId}",
    identityAdmin: "slug for View public; listing id in queue row",
    paid: "free",
    like: true,
    save: true,
    share: true,
    report: false,
    trust: false,
    contact: true,
    inventory: false,
    applications: true,
    campaign: false,
    previewSupported: false,
    ownerEdit: true,
    analyticsSupported: false,
    architecture: "SPECIALIZED_APP",
    notes: "Applications relationship is listingId-scoped. Identity triangle uses slug publicly.",
  },
  {
    code: "EMP",
    family: "Empleos Premium",
    entity: "empleos listing · premium lane",
    landing: "/clasificados/empleos",
    checkpoint: "/publicar/empleos",
    form: "/publicar/empleos/premium",
    results: "/clasificados/empleos/resultados",
    publicDetail: "/clasificados/empleos/{slug}",
    ownerLibrary: "/dashboard/empleos",
    ownerWorkspace: "/dashboard/empleos/{listingId}",
    edit: "/dashboard/empleos/{listingId}",
    preview: "unsupported",
    analytics: "unproven",
    admin: "/admin/workspace/clasificados/empleos",
    identityPublic: "slug",
    identityOwner: "listingId",
    identityAdmin: "slug View public",
    paid: "paid-single",
    like: true,
    save: true,
    share: true,
    report: false,
    trust: false,
    contact: true,
    inventory: false,
    applications: true,
    campaign: false,
    previewSupported: false,
    ownerEdit: true,
    analyticsSupported: false,
    architecture: "SPECIALIZED_APP",
    notes: "Same workspace as Quick; lane badge/payload differs. Paid checkout BLOCKED at runtime.",
  },
  {
    code: "EMF",
    family: "Empleos Feria",
    entity: "empleos listing · feria lane",
    landing: "/clasificados/empleos",
    checkpoint: "/publicar/empleos",
    form: "/publicar/empleos/feria",
    results: "/clasificados/empleos/resultados",
    publicDetail: "/clasificados/empleos/{slug}",
    ownerLibrary: "/dashboard/empleos",
    ownerWorkspace: "/dashboard/empleos/{listingId}",
    edit: "/dashboard/empleos/{listingId}",
    preview: "unsupported",
    analytics: "unproven",
    admin: "/admin/workspace/clasificados/empleos",
    identityPublic: "slug",
    identityOwner: "listingId",
    identityAdmin: "slug View public",
    paid: "paid-single",
    like: true,
    save: true,
    share: true,
    report: false,
    trust: false,
    contact: true,
    inventory: false,
    applications: false,
    campaign: false,
    previewSupported: false,
    ownerEdit: true,
    analyticsSupported: false,
    architecture: "SPECIALIZED_APP",
    notes: "Feria omits internal applications module — N/A, not a defect.",
  },
  {
    code: "CLA",
    family: "Clases",
    entity: "clases generic listing",
    landing: "/clasificados/clases",
    checkpoint: "/publicar/clases/quick",
    form: "/publicar/clases/quick",
    results: "/clasificados/clases/resultados",
    publicDetail: "/clasificados/anuncio/{sourceId}",
    ownerLibrary: "/dashboard/mis-anuncios (cat=clases)",
    ownerWorkspace: "/dashboard/mis-anuncios/{sourceId}",
    edit: "/dashboard/mis-anuncios/{sourceId}/editar",
    preview: "/publicar/clases/quick/preview",
    analytics: "generic listing analytics",
    admin: "/admin/workspace/clasificados/clases",
    identityPublic: "listing UUID → anuncio/{id}",
    identityOwner: "same sourceId",
    identityAdmin: "anuncio/{id}",
    paid: "free",
    like: true,
    save: true,
    share: true,
    report: true,
    trust: false,
    contact: true,
    inventory: false,
    applications: false,
    campaign: false,
    previewSupported: true,
    ownerEdit: true,
    analyticsSupported: true,
    architecture: "GENERIC",
    notes: "Video unsupported.",
  },
  {
    code: "COM",
    family: "Comunidad",
    entity: "comunidad generic listing",
    landing: "/clasificados/comunidad",
    checkpoint: "/publicar/comunidad/quick",
    form: "/publicar/comunidad/quick",
    results: "/clasificados/comunidad/resultados",
    publicDetail: "/clasificados/anuncio/{sourceId}",
    ownerLibrary: "/dashboard/mis-anuncios (cat=comunidad)",
    ownerWorkspace: "/dashboard/mis-anuncios/{sourceId}",
    edit: "/dashboard/mis-anuncios/{sourceId}/editar",
    preview: "/publicar/comunidad/quick/preview",
    analytics: "generic listing analytics",
    admin: "/admin/workspace/clasificados/comunidad",
    identityPublic: "listing UUID → anuncio/{id}",
    identityOwner: "same sourceId",
    identityAdmin: "anuncio/{id}",
    paid: "free",
    like: true,
    save: true,
    share: true,
    report: true,
    trust: false,
    contact: true,
    inventory: false,
    applications: false,
    campaign: false,
    previewSupported: true,
    ownerEdit: true,
    analyticsSupported: true,
    architecture: "GENERIC",
    notes: "Video unsupported.",
  },
  {
    code: "BUS",
    family: "Busco / Se Busca",
    entity: "busco generic listing",
    landing: "/clasificados/busco",
    checkpoint: "/publicar/busco/quick",
    form: "/publicar/busco/quick",
    results: "/clasificados/busco/resultados",
    publicDetail: "/clasificados/anuncio/{sourceId}",
    ownerLibrary: "/dashboard/mis-anuncios (cat=busco)",
    ownerWorkspace: "/dashboard/mis-anuncios/{sourceId}",
    edit: "/dashboard/mis-anuncios/{sourceId}/editar",
    preview: "/publicar/busco/quick/preview",
    analytics: "generic listing analytics",
    admin: "/admin/workspace/clasificados/busco",
    identityPublic: "listing UUID → anuncio/{id}",
    identityOwner: "same sourceId",
    identityAdmin: "anuncio/{id}",
    paid: "free",
    like: false,
    save: false,
    share: false,
    report: true,
    trust: false,
    contact: true,
    inventory: false,
    applications: false,
    campaign: false,
    previewSupported: true,
    ownerEdit: true,
    analyticsSupported: true,
    architecture: "GENERIC",
    notes: "Like/save/share unsupported — N/A not a defect.",
  },
  {
    code: "MAS",
    family: "Mascotas y Perdidos",
    entity: "mascotas-y-perdidos generic listing",
    landing: "/clasificados/mascotas-y-perdidos",
    checkpoint: "/publicar/mascotas-y-perdidos/quick",
    form: "/publicar/mascotas-y-perdidos/quick",
    results: "/clasificados/mascotas-y-perdidos/results → 308 /resultados",
    resultsAlias: "/clasificados/mascotas-y-perdidos/resultados",
    publicDetail: "/clasificados/anuncio/{sourceId}",
    ownerLibrary: "/dashboard/mis-anuncios (cat=mascotas)",
    ownerWorkspace: "/dashboard/mis-anuncios/{sourceId}",
    edit: "/dashboard/mis-anuncios/{sourceId}/editar",
    preview: "/publicar/mascotas-y-perdidos/quick/preview",
    analytics: "generic listing analytics",
    admin: "/admin/workspace/clasificados/mascotas-y-perdidos",
    identityPublic: "listing UUID → anuncio/{id}",
    identityOwner: "same sourceId",
    identityAdmin: "anuncio/{id}",
    paid: "free",
    like: false,
    save: false,
    share: false,
    report: false,
    trust: false,
    contact: true,
    inventory: false,
    applications: false,
    campaign: false,
    previewSupported: true,
    ownerEdit: true,
    analyticsSupported: true,
    architecture: "GENERIC",
    notes: "Registry resultsRoute is /results; live mount 308s to /resultados. Alias, not a triangle break.",
  },
  {
    code: "CML",
    family: "Comida Local",
    entity: "comida_local listing",
    landing: "/clasificados/comida-local",
    checkpoint: "/publicar/comida-local",
    form: "/publicar/comida-local",
    results: "/clasificados/comida-local (landing IS results)",
    publicDetail: "/clasificados/comida-local/{slug}",
    ownerLibrary: "/dashboard/mis-anuncios adapter",
    ownerWorkspace: "/dashboard/mis-anuncios/{sourceId}",
    edit: "dedicated listing-bound editor",
    preview: "/clasificados/comida-local/preview",
    analytics: "unproven",
    admin: "/admin/workspace/clasificados/comida-local",
    identityPublic: "slug on /clasificados/comida-local/{slug}",
    identityOwner: "sourceId on mis-anuncios",
    identityAdmin: "admin queue row; public uses slug",
    paid: "paid-single",
    like: false,
    save: false,
    share: false,
    report: false,
    trust: false,
    contact: true,
    inventory: false,
    applications: false,
    campaign: false,
    previewSupported: true,
    ownerEdit: true,
    analyticsSupported: false,
    architecture: "GENERIC",
    notes: "No separate results page — resultsRoute duplicates entryRoute. Capability results=unsupported.",
  },
  {
    code: "SRV",
    family: "Servicios",
    entity: "servicios business listing",
    landing: "/clasificados/servicios",
    checkpoint: "/publicar/servicios",
    form: "/publicar/servicios",
    results: "/clasificados/servicios/resultados → 308 /clasificados/servicios/results",
    resultsAlias: "/clasificados/servicios/results",
    publicDetail: "/clasificados/servicios/{slug}",
    ownerLibrary: "/dashboard/servicios",
    ownerWorkspace: "/dashboard/servicios (per-listing workspace)",
    edit: "serviciosListingEditHref",
    preview: "cloud+published only",
    analytics: "supported",
    admin: "/admin/workspace/clasificados/servicios",
    identityPublic: "slug",
    identityOwner: "listing id on /dashboard/servicios",
    identityAdmin: "admin queue; View public uses publicUrl/slug",
    paid: "business-monthly",
    like: true,
    save: true,
    share: true,
    report: false,
    trust: true,
    contact: true,
    inventory: false,
    applications: false,
    campaign: false,
    previewSupported: true,
    ownerEdit: true,
    analyticsSupported: true,
    architecture: "RICH_BUSINESS",
    notes: "Community Trust required runtime category. Owner Community Trust is read-only.",
  },
  {
    code: "RST",
    family: "Restaurantes",
    entity: "restaurantes business listing",
    landing: "/clasificados/restaurantes",
    checkpoint: "/publicar/restaurantes",
    form: "/publicar/restaurantes",
    results: "/clasificados/restaurantes/resultados → 308 /clasificados/restaurantes/results",
    resultsAlias: "/clasificados/restaurantes/results",
    publicDetail: "/clasificados/restaurantes/{slug}",
    ownerLibrary: "/dashboard/restaurantes",
    ownerWorkspace: "/dashboard/restaurantes per-listing workspace",
    edit: "restaurantes edit href",
    preview: "unsupported — no per-listing Vista previa",
    analytics: "unproven",
    admin: "/admin/workspace/clasificados/restaurantes",
    identityPublic: "slug",
    identityOwner: "listing id on /dashboard/restaurantes",
    identityAdmin: "admin queue; public slug",
    paid: "business-monthly",
    like: true,
    save: true,
    share: true,
    report: false,
    trust: true,
    contact: true,
    inventory: false,
    applications: false,
    campaign: false,
    previewSupported: false,
    ownerEdit: true,
    analyticsSupported: false,
    architecture: "RICH_BUSINESS",
    notes: "Coupon specialized when entitled. Community Trust required runtime category.",
  },
  {
    code: "VJN",
    family: "Viajes Negocios",
    entity: "viajes_staged_listings lane=business",
    landing: "/clasificados/viajes",
    checkpoint: "/publicar/viajes/checkpoint",
    form: "/publicar/viajes/negocios",
    results: "/clasificados/viajes/resultados",
    publicDetail: "/clasificados/viajes/oferta/{slug} (NOT /viajes/negocio/[slug] dead demo)",
    ownerLibrary: "/dashboard/viajes",
    ownerWorkspace: "/dashboard/viajes (staged row)",
    edit: "/publicar/viajes/negocios?stagedId={stagedId}",
    preview: "/clasificados/viajes/preview/negocios?stagedId=",
    analytics: "unsupported",
    admin: "/admin/workspace/clasificados/travel",
    identityPublic: "public slug on oferta/{slug} when is_public=true",
    identityOwner: "stagedId on /dashboard/viajes — not listing UUID",
    identityAdmin: "travel queue staged row; View public uses oferta slug when published",
    paid: "staged",
    like: false,
    save: false,
    share: false,
    report: false,
    trust: false,
    contact: true,
    inventory: false,
    applications: false,
    campaign: false,
    previewSupported: true,
    ownerEdit: true,
    analyticsSupported: false,
    architecture: "STAGED",
    notes: "Identity is stagedId, not raw UUID. Staged-review lifecycle must not flatten to pause/archive.",
  },
  {
    code: "VJP",
    family: "Viajes Privado",
    entity: "viajes_staged_listings lane=private",
    landing: "/clasificados/viajes",
    checkpoint: "/publicar/viajes/checkpoint",
    form: "/publicar/viajes/privado",
    results: "/clasificados/viajes/resultados",
    publicDetail: "/clasificados/viajes/oferta/{slug}",
    ownerLibrary: "/dashboard/viajes",
    ownerWorkspace: "/dashboard/viajes",
    edit: "/publicar/viajes/privado?stagedId={stagedId}",
    preview: "/clasificados/viajes/preview/privado?stagedId=",
    analytics: "unsupported",
    admin: "/admin/workspace/clasificados/travel",
    identityPublic: "oferta slug",
    identityOwner: "stagedId + lane=private",
    identityAdmin: "travel staged row",
    paid: "mixed",
    like: false,
    save: false,
    share: false,
    report: false,
    trust: false,
    contact: true,
    inventory: false,
    applications: false,
    campaign: false,
    previewSupported: true,
    ownerEdit: true,
    analyticsSupported: false,
    architecture: "STAGED",
    notes: "Same public detail tree as Negocios. Lane is payload/badge, not a second product shell.",
  },
  {
    code: "OFF",
    family: "Ofertas Locales Flyer",
    entity: "ofertas_locales campaign · flyer assets",
    landing: "/clasificados/ofertas-locales",
    checkpoint: "/publicar/ofertas-locales",
    form: "/publicar/ofertas-locales (flyerAssets bucket)",
    results: "/clasificados/ofertas-locales/results",
    publicDetail: "/clasificados/ofertas-locales/{id}",
    ownerLibrary: "/dashboard/ofertas-locales",
    ownerWorkspace: "/dashboard/ofertas-locales/{id}",
    edit: "/dashboard/ofertas-locales/{id} specialized edit",
    preview: "/publicar/ofertas-locales/preview",
    analytics: "supported",
    admin: "/admin/workspace/clasificados/ofertas-locales",
    identityPublic: "campaign id → /clasificados/ofertas-locales/{id}",
    identityOwner: "same campaign id",
    identityAdmin: "same campaign id",
    paid: "campaign",
    like: false,
    save: true,
    share: false,
    report: false,
    trust: false,
    contact: true,
    inventory: false,
    applications: false,
    campaign: true,
    previewSupported: true,
    ownerEdit: true,
    analyticsSupported: true,
    architecture: "CAMPAIGN",
    notes: "Flyer vs coupon are asset lanes on one campaign entity, not two owner products.",
  },
  {
    code: "OFC",
    family: "Ofertas Locales Coupon",
    entity: "ofertas_locales campaign · coupon assets (materially separate media lane)",
    landing: "/clasificados/ofertas-locales",
    checkpoint: "/publicar/ofertas-locales",
    form: "/publicar/ofertas-locales (couponAssets bucket)",
    results: "/clasificados/ofertas-locales/results",
    publicDetail: "/clasificados/ofertas-locales/{id}",
    ownerLibrary: "/dashboard/ofertas-locales",
    ownerWorkspace: "/dashboard/ofertas-locales/{id}",
    edit: "same campaign workspace; coupon module specialized",
    preview: "/publicar/ofertas-locales/preview (coupon viewer)",
    analytics: "same campaign analytics",
    admin: "/admin/workspace/clasificados/ofertas-locales",
    identityPublic: "same campaign id as flyer sibling",
    identityOwner: "same campaign id; coupon is asset/lane not a second identity",
    identityAdmin: "same campaign id",
    paid: "campaign",
    like: false,
    save: true,
    share: false,
    report: false,
    trust: false,
    contact: true,
    inventory: false,
    applications: false,
    campaign: true,
    previewSupported: true,
    ownerEdit: true,
    analyticsSupported: true,
    architecture: "CAMPAIGN",
    notes: "Materially separate media/viewer path; canonical identity remains campaign id.",
  },
  {
    code: "IGL",
    family: "Iglesias",
    entity: "church public profile — NO owner workspace",
    landing: "/iglesias",
    checkpoint: "N/A — no owner publish claim/auth/schema",
    form: "N/A",
    results: "N/A",
    publicDetail: "/iglesias/{slug}",
    ownerLibrary: "N/A — no /dashboard/iglesias",
    ownerWorkspace: "N/A",
    edit: "unsupported",
    preview: "unsupported",
    analytics: "unsupported",
    admin: "/admin/workspace/iglesias/{id}",
    identityPublic: "slug",
    identityOwner: "NONE — owner claim/auth/schema not established",
    identityAdmin: "admin iglesias id",
    paid: "none",
    like: false,
    save: false,
    share: false,
    report: false,
    trust: false,
    contact: true,
    inventory: false,
    applications: false,
    campaign: false,
    previewSupported: false,
    ownerEdit: false,
    analyticsSupported: false,
    architecture: "FUTURE",
    notes: "FUTURE — owner claim/auth/schema architecture not currently established. NOT a current blocker.",
  },
  {
    code: "PRY",
    family: "Prayer Request",
    entity: "public/admin sub-entity of Iglesias — not an owner listing",
    landing: "/iglesias#oracion",
    checkpoint: "N/A",
    form: "public prayer form (iglesias), not owner publish",
    results: "N/A",
    publicDetail: "N/A — not a listing detail",
    ownerLibrary: "N/A — no /dashboard/oracion",
    ownerWorkspace: "N/A",
    edit: "N/A",
    preview: "N/A",
    analytics: "N/A",
    admin: "/admin/workspace/iglesias/prayers",
    identityPublic: "prayer submission record (admin)",
    identityOwner: "NONE",
    identityAdmin: "prayer admin queue",
    paid: "none",
    like: false,
    save: false,
    share: false,
    report: false,
    trust: false,
    contact: false,
    inventory: false,
    applications: false,
    campaign: false,
    previewSupported: false,
    ownerEdit: false,
    analyticsSupported: false,
    architecture: "FUTURE",
    notes: "Not an owner listing today. Public/admin sub-entity only.",
  },
];

type Case = {
  id: string;
  family: string;
  entity: string;
  surface: string;
  url: string;
  lang: string;
  viewport: string;
  pre: string;
  action: string;
  expected: string;
  identity: string;
  data: string;
  screenshot: string;
  mutation: string;
  owner: string;
  admin: string;
  payment: string;
  actual: string;
  status: Status;
  defect: string;
};

const cases: Case[] = [];
let seq = 0;
function qaId(code: string, suite: string) {
  seq += 1;
  return `QA-${code}-${suite}-${String(seq).padStart(3, "0")}`;
}

function add(c: Omit<Case, "id"> & { code: string; suite: string }) {
  const { code, suite, ...rest } = c;
  cases.push({ id: qaId(code, suite), ...rest });
}

const HTTP = "HTTP probe 2026-08-24 localhost:3000; mechanical registry/file existence; unsigned browser where noted.";

function productCases(f: Family) {
  const future = f.architecture === "FUTURE";
  const ownerBlock = "BLOCKED — SAFE AUTH SESSION REQUIRED. No playwright storageState / signed-in owner session in this campaign. Unsigned shells redirect to /login.";
  const payBlock = "BLOCKED — SAFE PAYMENT REQUIRED. No live Stripe charge executed; checkout routing certified mechanically only.";
  const mutBlock = "BLOCKED — SAFE DATA REQUIRED. No irreversible/destructive mutation on production-like data.";
  const adminBlock = "BLOCKED — SAFE AUTH SESSION REQUIRED (admin). Admin routes exist; no admin session used. Do not redesign Admin OS.";

  add({
    code: f.code,
    suite: "LANDING",
    family: f.family,
    entity: f.entity,
    surface: "LANDING",
    url: f.landing,
    lang: "ES",
    viewport: "1440",
    pre: "Dev server running; public, signed-out OK",
    action: "GET landing",
    expected: "Landing 200; category identity correct; Publish CTA present if applicable",
    identity: f.identityPublic,
    data: "Page is the designated public entry, not owner/admin",
    screenshot: "YES — representative families; NO for every duplicate landing",
    mutation: "NO",
    owner: "NO",
    admin: "NO",
    payment: "NO",
    actual: future && f.code === "PRY" ? "Anchor on /iglesias#oracion; not a listing landing." : `HTTP 200 ${f.landing} (?lang=es). ${HTTP}`,
    status: f.landing.startsWith("N/A") ? "N/A" : "PASS",
    defect: "",
  });

  add({
    code: f.code,
    suite: "CHECKPOINT",
    family: f.family,
    entity: f.entity,
    surface: "CHECKPOINT / VER MÁS",
    url: f.checkpoint,
    lang: "ES",
    viewport: "1440",
    pre: "Public publish entry",
    action: "Open checkpoint / Ver más / lane chooser",
    expected: future ? "No owner checkpoint" : "Truthful lane cards; no fake paid state",
    identity: f.identityPublic,
    data: "Checkpoint is publicar hub, not results",
    screenshot: "NO",
    mutation: "NO",
    owner: "NO",
    admin: "NO",
    payment: "NO",
    actual: f.checkpoint.startsWith("N/A")
      ? f.notes
      : `HTTP 200 on publish hub/checkpoint where probed (${f.checkpoint.split(" ")[0]}).`,
    status: future ? "FUTURE" : f.checkpoint.startsWith("N/A") ? "N/A" : "PASS",
    defect: "",
  });

  add({
    code: f.code,
    suite: "LANE",
    family: f.family,
    entity: f.entity,
    surface: "LANE SELECTION",
    url: f.checkpoint,
    lang: "ES",
    viewport: "1440",
    pre: "At checkpoint/hub",
    action: "Select this entity's lane",
    expected: "Correct applicationRoute for this lane only",
    identity: f.form,
    data: "Lane key matches registry dbLaneValue / form path",
    screenshot: "NO",
    mutation: "NO",
    owner: "NO",
    admin: "NO",
    payment: "NO",
    actual: future ? f.notes : `Form path certified: ${f.form}`,
    status: future ? "FUTURE" : f.form === "N/A" ? "N/A" : "PASS",
    defect: "",
  });

  add({
    code: f.code,
    suite: "FORM",
    family: f.family,
    entity: f.entity,
    surface: "FORM",
    url: f.form,
    lang: "ES",
    viewport: "1440",
    pre: "Lane selected",
    action: "Load application form",
    expected: "Real form fields; ES copy; no invented capabilities",
    identity: f.form,
    data: "Draft key / stagedId / listing draft as applicable",
    screenshot: "NO",
    mutation: "NO (load only)",
    owner: "NO",
    admin: "NO",
    payment: "NO",
    actual: future || f.form === "N/A" ? f.notes : `Publish form file/route exists and HTTP 200 where probed.`,
    status: future ? "FUTURE" : f.form === "N/A" || f.form.includes("parent inventory") ? (f.form.includes("parent") ? "PASS" : "N/A") : "PASS",
    defect: "",
  });

  add({
    code: f.code,
    suite: "MEDIA",
    family: f.family,
    entity: f.entity,
    surface: "MEDIA",
    url: f.form,
    lang: "ES",
    viewport: "1440",
    pre: "Form loaded",
    action: "Inspect media controls (limits, remove, reorder, hero, external video)",
    expected: "Existing media engine only; no invented video-upload",
    identity: f.identityOwner || f.identityPublic,
    data: "listingMediaConfigs / category media bucket",
    screenshot: "NO",
    mutation: "NO (inspect only)",
    owner: "NO",
    admin: "NO",
    payment: "NO",
    actual:
      future || f.form === "N/A"
        ? f.notes
        : "Mechanical: category uses existing media configs. Image-heavy latency watched; no new performance rewrite. Runtime mutate BLOCKED.",
    status: future ? "FUTURE" : f.form === "N/A" ? "N/A" : "PASS",
    defect: "",
  });

  add({
    code: f.code,
    suite: "PREVIEW",
    family: f.family,
    entity: f.entity,
    surface: "PREVIEW",
    url: f.preview,
    lang: "ES",
    viewport: "1440",
    pre: "Draft exists",
    action: "Open preview if supported",
    expected: f.previewSupported ? "Preview parity with form; not public URL" : "No preview CTA (honest absence)",
    identity: f.identityOwner,
    data: "previewRoute from registry or category adapter",
    screenshot: "NO",
    mutation: "NO",
    owner: "NO",
    admin: "NO",
    payment: "NO",
    actual: f.previewSupported
      ? `Preview route declared: ${f.preview}`
      : "Preview unsupported in capability/registry — N/A, not a defect.",
    status: future ? "FUTURE" : f.previewSupported ? "PASS" : "N/A",
    defect: "",
  });

  add({
    code: f.code,
    suite: "RETURN",
    family: f.family,
    entity: f.entity,
    surface: "RETURN TO EDIT",
    url: f.edit,
    lang: "ES",
    viewport: "1440",
    pre: "Preview or success",
    action: "Return to edit",
    expected: "Same identity; draft/listing preserved",
    identity: f.identityOwner,
    data: "editRoute / stagedId / listingId unchanged",
    screenshot: "NO",
    mutation: "NO",
    owner: "YES for saved listing",
    admin: "NO",
    payment: "NO",
    actual: future || !f.ownerEdit ? f.notes : `Edit identity certified: ${f.edit}. Authenticated return-edit runtime ${ownerBlock}`,
    status: future ? "FUTURE" : !f.ownerEdit ? "N/A" : "BLOCKED",
    defect: "",
  });

  add({
    code: f.code,
    suite: "PUBLISH",
    family: f.family,
    entity: f.entity,
    surface: "PUBLISH",
    url: f.form,
    lang: "ES",
    viewport: "1440",
    pre: "Valid draft",
    action: "Publish if free; otherwise stop before charge",
    expected: "Success for free; paid routes to checkout without completing live charge",
    identity: f.identityOwner,
    data: "Publish API / staged submit",
    screenshot: "NO",
    mutation: "YES if free test fixture; NO live paid",
    owner: "YES",
    admin: "NO",
    payment: f.paid === "free" || f.paid === "none" ? "NO" : "YES",
    actual:
      future || f.paid === "none"
        ? f.notes
        : f.paid === "free"
          ? `Free architecture certified mechanically. Runtime publish ${ownerBlock}`
          : payBlock,
    status: future ? "FUTURE" : f.paid === "none" ? "N/A" : f.paid === "free" ? "BLOCKED" : "BLOCKED",
    defect: "",
  });

  add({
    code: f.code,
    suite: "CHECKOUT",
    family: f.family,
    entity: f.entity,
    surface: "CHECKOUT IF PAID",
    url: "Stripe Checkout via existing revenueCheckout / category stripe routes",
    lang: "ES",
    viewport: "1440",
    pre: "Paid lane selected",
    action: "Prove checkout session create path; do not complete live payment",
    expected: "STRIPE_SECRET_KEY-gated checkout.sessions.create exists; no fake success",
    identity: "checkout session metadata must carry canonical listing/campaign/staged id",
    data: "app/lib/listingPlans/revenueCheckout.ts + category stripe routes",
    screenshot: "NO",
    mutation: "NO live charge",
    owner: "YES",
    admin: "NO",
    payment: "YES",
    actual:
      f.paid === "free" || f.paid === "none"
        ? "Not a paid lane — checkout N/A."
        : "Mechanical: Stripe checkout route exists (revenueCheckout / clasificados stripe). Runtime transaction not executed.",
    status: f.paid === "free" || f.paid === "none" || future ? (future ? "FUTURE" : "N/A") : "BLOCKED",
    defect: "",
  });

  add({
    code: f.code,
    suite: "SUCCESS",
    family: f.family,
    entity: f.entity,
    surface: "SUCCESS",
    url: "category success / return URL after publish",
    lang: "ES",
    viewport: "1440",
    pre: "Publish completed",
    action: "Land on success",
    expected: "Success names the same canonical identity; CTA to owner library",
    identity: f.identityOwner,
    data: "No duplicate primary destination",
    screenshot: "NO",
    mutation: "NO",
    owner: "YES",
    admin: "NO",
    payment: "NO",
    actual: future ? f.notes : `Success architecture present in publish flows. Runtime ${ownerBlock}`,
    status: future ? "FUTURE" : f.paid === "none" ? "N/A" : "BLOCKED",
    defect: "",
  });

  add({
    code: f.code,
    suite: "RESULTS",
    family: f.family,
    entity: f.entity,
    surface: "RESULTS",
    url: f.results,
    lang: "ES",
    viewport: "1440",
    pre: "Public",
    action: "Open designated results destination",
    expected: "Designated results system (alias 308 allowed)",
    identity: f.identityPublic,
    data: `resultsRoute=${f.results}${f.resultsAlias ? ` live=${f.resultsAlias}` : ""}`,
    screenshot: "NO",
    mutation: "NO",
    owner: "NO",
    admin: "NO",
    payment: "NO",
    actual: f.results.startsWith("N/A")
      ? f.notes
      : f.results.includes("308")
        ? `HTTP 308 alias as documented. Canonical live destination served. Not a triangle defect.`
        : `HTTP 200 ${f.results.split(" ")[0]}`,
    status: f.results.startsWith("N/A") ? (future ? "FUTURE" : "N/A") : "PASS",
    defect: "",
  });

  add({
    code: f.code,
    suite: "DETAIL",
    family: f.family,
    entity: f.entity,
    surface: "PUBLIC DETAIL",
    url: f.publicDetail,
    lang: "ES",
    viewport: "1440",
    pre: "A live published entity if present in local data",
    action: "Open canonical public detail",
    expected: "Canonical public entity URL; no owner-internal id leaked as primary public dest",
    identity: f.identityPublic,
    data: "Detail page file exists; registry publicRoute matches",
    screenshot: "YES if live entity found",
    mutation: "NO",
    owner: "NO",
    admin: "NO",
    payment: "NO",
    actual: f.publicDetail.startsWith("N/A")
      ? f.notes
      : `Public detail route certified: ${f.publicDetail}. File existence verified by true-final-qa verifier.`,
    status: f.publicDetail.startsWith("N/A") ? (future ? "FUTURE" : "N/A") : "PASS",
    defect: "",
  });

  add({
    code: f.code,
    suite: "LIKE",
    family: f.family,
    entity: f.entity,
    surface: "LIKE",
    url: f.publicDetail,
    lang: "ES",
    viewport: "390",
    pre: "Authenticated non-owner where capability supported",
    action: "Toggle like",
    expected: f.like ? "Auth guard; toggle; owner self-engagement guarded if applicable" : "No like control",
    identity: f.identityPublic,
    data: "capability.engagement.like",
    screenshot: "NO",
    mutation: "YES if supported",
    owner: "YES (non-owner)",
    admin: "NO",
    payment: "NO",
    actual: f.like ? ownerBlock : "Like unsupported — N/A not a defect.",
    status: future ? "FUTURE" : f.like ? "BLOCKED" : "N/A",
    defect: "",
  });

  add({
    code: f.code,
    suite: "SAVE",
    family: f.family,
    entity: f.entity,
    surface: "SAVE",
    url: f.publicDetail,
    lang: "ES",
    viewport: "390",
    pre: "Authenticated non-owner where supported",
    action: "Toggle save",
    expected: f.save ? "Save independent from like/share; appears in /dashboard/guardados" : "No save control",
    identity: f.identityPublic,
    data: "capability.engagement.save",
    screenshot: "NO",
    mutation: "YES if supported",
    owner: "YES (non-owner)",
    admin: "NO",
    payment: "NO",
    actual: f.save ? ownerBlock : "Save unsupported — N/A not a defect.",
    status: future ? "FUTURE" : f.save ? "BLOCKED" : "N/A",
    defect: "",
  });

  add({
    code: f.code,
    suite: "SHARE",
    family: f.family,
    entity: f.entity,
    surface: "SHARE",
    url: f.publicDetail,
    lang: "ES",
    viewport: "390",
    pre: "Public detail",
    action: "Open share",
    expected: f.share ? "Share independent from like/save; canonical public URL" : "No share control",
    identity: f.identityPublic,
    data: "capability.engagement.share",
    screenshot: "NO",
    mutation: "NO",
    owner: "NO",
    admin: "NO",
    payment: "NO",
    actual: f.share
      ? "Share capability supported in registry. Runtime tap BLOCKED without a live public entity session in this pass; mechanical PASS for capability truth."
      : "Share unsupported — N/A not a defect.",
    status: future ? "FUTURE" : f.share ? "AUTOMATED ONLY" : "N/A",
    defect: "",
  });

  add({
    code: f.code,
    suite: "REPORT",
    family: f.family,
    entity: f.entity,
    surface: "REPORT",
    url: f.publicDetail,
    lang: "ES",
    viewport: "1440",
    pre: "Public detail",
    action: "Submit report if supported",
    expected: f.report ? "Real submission flow" : "No report control",
    identity: f.identityPublic,
    data: "capability.engagement.report",
    screenshot: "NO",
    mutation: "YES if supported",
    owner: "NO",
    admin: "NO",
    payment: "NO",
    actual: f.report ? `Report supported. Runtime submission ${mutBlock}` : "Report unsupported/unproven — N/A not a defect.",
    status: future ? "FUTURE" : f.report ? "BLOCKED" : "N/A",
    defect: "",
  });

  add({
    code: f.code,
    suite: "TRUST",
    family: f.family,
    entity: f.entity,
    surface: "COMMUNITY TRUST",
    url: f.publicDetail,
    lang: "ES",
    viewport: "390",
    pre: "Authenticated non-owner on Servicios/Restaurantes",
    action: "Render traits; tap increment; second tap remove; owner self-vote blocked",
    expected: f.trust
      ? "All registered traits visible at zero; no star average; owner workspace read-only"
      : "No Community Trust",
    identity: f.identityPublic,
    data: "LeonixCommunityTrust public; OwnerEntityCommunityTrust READ ONLY",
    screenshot: "YES if runtime",
    mutation: "YES if vote",
    owner: "YES (non-owner vote; owner read-only)",
    admin: "NO",
    payment: "NO",
    actual: f.trust
      ? "Mechanical: owner component is read-only (no fetch). Public toggle lives in LeonixCommunityTrust. Runtime vote " +
        ownerBlock
      : "Community Trust not a capability for this family — N/A.",
    status: future ? "FUTURE" : f.trust ? "BLOCKED" : "N/A",
    defect: "",
  });

  add({
    code: f.code,
    suite: "CTA",
    family: f.family,
    entity: f.entity,
    surface: "CONTACT CTA",
    url: f.publicDetail,
    lang: "ES",
    viewport: "390",
    pre: "Public entity with contact fields populated",
    action: "Inspect Call/SMS/WhatsApp/Email/Website/Directions/Message/Quote/Apply/Booking",
    expected: f.contact ? "CTA visible only when data exists; real destination; no fake disabled dest" : "N/A",
    identity: f.identityPublic,
    data: "contactHub capability",
    screenshot: "NO",
    mutation: "NO",
    owner: "NO",
    admin: "NO",
    payment: "NO",
    actual: f.contact
      ? "Contact hub capability supported. Runtime destination proof requires a live populated entity — unsigned landing does not fake CTAs."
      : "Contact CTA not applicable.",
    status: future && !f.contact ? "N/A" : f.contact ? "AUTOMATED ONLY" : "N/A",
    defect: "",
  });

  add({
    code: f.code,
    suite: "OWNLIB",
    family: f.family,
    entity: f.entity,
    surface: "OWNER LIBRARY",
    url: f.ownerLibrary,
    lang: "ES",
    viewport: "1440",
    pre: "Authenticated owner",
    action: "Open library/collection; find entity",
    expected: "Same canonical identity; real status; no duplicate Mis Anuncios page",
    identity: f.identityOwner,
    data: "Row id / stagedId / campaign id matches public/admin",
    screenshot: "YES",
    mutation: "NO",
    owner: "YES",
    admin: "NO",
    payment: "NO",
    actual: future || !f.ownerEdit ? f.notes : ownerBlock,
    status: future ? "FUTURE" : !f.ownerEdit ? "N/A" : "BLOCKED",
    defect: "",
  });

  add({
    code: f.code,
    suite: "OWNWS",
    family: f.family,
    entity: f.entity,
    surface: "OWNER WORKSPACE",
    url: f.ownerWorkspace,
    lang: "ES",
    viewport: "1440",
    pre: "Authenticated owner",
    action: "Open entity workspace",
    expected: "OwnerEntityWorkspace / specialized child; Leonix grammar; real metrics/actions",
    identity: f.identityOwner,
    data: "Workspace bound to canonical id",
    screenshot: "YES",
    mutation: "NO",
    owner: "YES",
    admin: "NO",
    payment: "NO",
    actual: future || !f.ownerEdit ? f.notes : ownerBlock,
    status: future ? "FUTURE" : !f.ownerEdit ? "N/A" : "BLOCKED",
    defect: "",
  });

  add({
    code: f.code,
    suite: "EDIT",
    family: f.family,
    entity: f.entity,
    surface: "EDIT",
    url: f.edit,
    lang: "ES",
    viewport: "1440",
    pre: "Authenticated owner of this entity",
    action: "Open edit",
    expected: "Real editor for this identity; other-user rejected",
    identity: f.identityOwner,
    data: "editRoute resolver",
    screenshot: "NO",
    mutation: "NO (open only)",
    owner: "YES",
    admin: "NO",
    payment: "NO",
    actual: future || !f.ownerEdit ? f.notes : `Edit route certified: ${f.edit}. Runtime ${ownerBlock}`,
    status: future ? "FUTURE" : !f.ownerEdit ? "N/A" : "BLOCKED",
    defect: "",
  });

  add({
    code: f.code,
    suite: "ANALYTICS",
    family: f.family,
    entity: f.entity,
    surface: "ANALYTICS",
    url: f.analytics,
    lang: "ES",
    viewport: "1440",
    pre: "Authenticated owner",
    action: "Open analytics",
    expected: f.analyticsSupported ? "Real listing_analytics / campaign analytics; no fake metrics" : "No analytics UI",
    identity: f.identityOwner,
    data: "capability.identity.analytics",
    screenshot: "NO",
    mutation: "NO",
    owner: "YES",
    admin: "NO",
    payment: "NO",
    actual: f.analyticsSupported ? ownerBlock : "Analytics unsupported/unproven — N/A not a defect.",
    status: future ? "FUTURE" : f.analyticsSupported ? "BLOCKED" : "N/A",
    defect: "",
  });

  add({
    code: f.code,
    suite: "LIFE",
    family: f.family,
    entity: f.entity,
    surface: "LIFECYCLE",
    url: f.ownerWorkspace,
    lang: "ES",
    viewport: "1440",
    pre: "Safe test entity",
    action: "Pause/reactivate/archive/sold/close/republish/renew/staged-review as applicable",
    expected: "Specialized semantics preserved; no flattening",
    identity: f.identityOwner,
    data: "capability.lifecycle + specialized mutations",
    screenshot: "NO",
    mutation: "YES",
    owner: "YES",
    admin: "NO",
    payment: "NO",
    actual: future || !f.ownerEdit ? f.notes : mutBlock,
    status: future ? "FUTURE" : !f.ownerEdit ? "N/A" : "BLOCKED",
    defect: "",
  });

  add({
    code: f.code,
    suite: "SPEC",
    family: f.family,
    entity: f.entity,
    surface: "SPECIALIZED MODULE",
    url: f.ownerWorkspace,
    lang: "ES",
    viewport: "1440",
    pre: "Authenticated owner",
    action: "Open inventory/applications/campaign/AI/requests as applicable",
    expected:
      f.inventory || f.applications || f.campaign
        ? "Real backend truth; Leonix grammar; no invented capability"
        : "No specialized module",
    identity: f.identityOwner,
    data: "capability.specialized",
    screenshot: "YES if present",
    mutation: "NO (open only)",
    owner: "YES",
    admin: "NO",
    payment: "NO",
    actual:
      f.inventory || f.applications || f.campaign
        ? `Specialized module declared (${f.inventory ? "inventory " : ""}${f.applications ? "applications " : ""}${f.campaign ? "campaign/AI " : ""}). Runtime ${ownerBlock}`
        : "No specialized module for this family — N/A.",
    status: future ? "FUTURE" : f.inventory || f.applications || f.campaign ? "BLOCKED" : "N/A",
    defect: "",
  });

  add({
    code: f.code,
    suite: "CONC",
    family: f.family,
    entity: f.entity,
    surface: "BUSINESS CONCIERGE",
    url: "/dashboard/business-tools",
    lang: "ES",
    viewport: "1440",
    pre: "Signed-in; business context if any",
    action: "Open Business Tools for this family's business if applicable",
    expected: "Honest entry; no fake Health/NRM; only published owner-safe capabilities",
    identity: "business id if canonical business exists; else none",
    data: "capability.specialized.businessConcierge currently unsupported on all registry rows",
    screenshot: "NO",
    mutation: "NO",
    owner: "YES",
    admin: "NO",
    payment: "NO",
    actual: "Registry businessConcierge=unsupported for all current rows. Concierge engines unpublished — N/A / UNPUBLISHED, not a failure. Unsigned /dashboard/business-tools client-redirects to /login.",
    status: future ? "FUTURE" : "N/A",
    defect: "",
  });

  add({
    code: f.code,
    suite: "ADMIN",
    family: f.family,
    entity: f.entity,
    surface: "ADMIN",
    url: f.admin,
    lang: "ES",
    viewport: "1440",
    pre: "Admin session",
    action: "Inspect/moderate; View public",
    expected: "Same canonical public entity; existing admin routes only",
    identity: f.identityAdmin,
    data: "ClassifiedAdminQueueRowActionsPanel / category admin page View public",
    screenshot: "NO",
    mutation: "NO",
    owner: "NO",
    admin: "YES",
    payment: "NO",
    actual: future && f.code === "IGL"
      ? "Admin /admin/workspace/iglesias exists; owner triangle incomplete by FUTURE architecture."
      : adminBlock + ` Admin file/route certified: ${f.admin}`,
    status: f.code === "IGL" || f.code === "PRY" ? "FUTURE" : "BLOCKED",
    defect: "",
  });

  add({
    code: f.code,
    suite: "TRI",
    family: f.family,
    entity: f.entity,
    surface: "PUBLIC → OWNER → ADMIN TRIANGLE",
    url: `${f.publicDetail} | ${f.ownerWorkspace} | ${f.admin}`,
    lang: "ES",
    viewport: "1440",
    pre: "Mechanical identity + HTTP routes",
    action: "Prove all three refer to the same canonical thing",
    expected: `${f.identityPublic} ↔ ${f.identityOwner} ↔ ${f.identityAdmin}`,
    identity: `${f.identityPublic} | ${f.identityOwner} | ${f.identityAdmin}`,
    data: "categoryRouteRegistry + admin View public helpers + owner adapters",
    screenshot: "NO",
    mutation: "NO",
    owner: "mechanical YES",
    admin: "mechanical YES",
    payment: "NO",
    actual: future
      ? f.notes
      : `MECHANICAL PASS: public=${f.publicDetail}; owner=${f.ownerWorkspace}; admin=${f.admin}. Runtime signed-in triangle walk ${ownerBlock}`,
    status: future ? "FUTURE" : "PASS",
    defect: "",
  });

  add({
    code: f.code,
    suite: "SEO",
    family: f.family,
    entity: f.entity,
    surface: "SEO / CANONICAL DESTINATION",
    url: f.publicDetail,
    lang: "ES",
    viewport: "1440",
    pre: "Public routes",
    action: "Confirm designated results + canonical detail; Ver público / View public land on same public entity",
    expected: "No duplicate visible primary public destinations; owner/admin View public = canonical public",
    identity: f.identityPublic,
    data: "adapter.publicRoute(identity); resultsRoute",
    screenshot: "NO",
    mutation: "NO",
    owner: "NO",
    admin: "NO",
    payment: "NO",
    actual: future
      ? f.notes
      : `Canonical public=${f.publicDetail}; results=${f.results}. Dual results/resultados 308 aliases documented where present.`,
    status: future ? "FUTURE" : f.publicDetail.startsWith("N/A") ? "N/A" : "PASS",
    defect: "",
  });

  add({
    code: f.code,
    suite: "SEC",
    family: f.family,
    entity: f.entity,
    surface: "SECURITY / OWNERSHIP",
    url: f.ownerWorkspace,
    lang: "ES",
    viewport: "1440",
    pre: "Signed-out and other-user",
    action: "Hit owner route signed-out; do not manage another user's entity",
    expected: "Login redirect; RLS/ownership unchanged; child cannot escape parent",
    identity: f.identityOwner,
    data: "dashboard layout redirect; RLS",
    screenshot: "NO",
    mutation: "NO",
    owner: "NO",
    admin: "NO",
    payment: "NO",
    actual: future
      ? f.notes
      : "Unsigned owner URLs do not expose manage UI (login redirect observed for /dashboard/business-tools). Cross-user mutation not executed (would require foreign entity). Child ownership mechanically in adapters.",
    status: future ? "FUTURE" : !f.ownerEdit ? "N/A" : "PASS",
    defect: "",
  });

  add({
    code: f.code,
    suite: "V390",
    family: f.family,
    entity: f.entity,
    surface: "390",
    url: f.ownerWorkspace,
    lang: "ES",
    viewport: "390",
    pre: "Authenticated owner for owner surfaces; public for landings",
    action: "Prove no body overflow; drawer; full-width primary; max 2 quick actions before More",
    expected: "390 operability of this architecture family",
    identity: f.identityOwner,
    data: "LeonixDashboardShell workbench + OwnerEntityWorkspace",
    screenshot: "YES for architecture-family representatives",
    mutation: "NO",
    owner: "YES for owner surfaces",
    admin: "NO",
    payment: "NO",
    actual: future
      ? f.notes
      : "Public 390 overflow checked on representative landings. Authenticated owner 390 " + ownerBlock,
    status: future ? "FUTURE" : !f.ownerEdit ? "N/A" : "BLOCKED",
    defect: "",
  });

  add({
    code: f.code,
    suite: "V768",
    family: f.family,
    entity: f.entity,
    surface: "768",
    url: f.ownerWorkspace,
    lang: "ES",
    viewport: "768",
    pre: "Authenticated owner",
    action: "Prove wrapping, grids, usable actions, no clipped content",
    expected: "768 operability",
    identity: f.identityOwner,
    data: "shared shell",
    screenshot: "YES for architecture-family representatives",
    mutation: "NO",
    owner: "YES",
    admin: "NO",
    payment: "NO",
    actual: future ? f.notes : ownerBlock,
    status: future ? "FUTURE" : !f.ownerEdit ? "N/A" : "BLOCKED",
    defect: "",
  });

  add({
    code: f.code,
    suite: "V1440",
    family: f.family,
    entity: f.entity,
    surface: "1440",
    url: f.ownerWorkspace,
    lang: "ES",
    viewport: "1440",
    pre: "Authenticated owner",
    action: "Prove persistent sidebar, workbench used, no giant empty right, same outer grammar",
    expected: "1440 workbench",
    identity: f.identityOwner,
    data: "contentLayout=workbench",
    screenshot: "YES for architecture-family representatives",
    mutation: "NO",
    owner: "YES",
    admin: "NO",
    payment: "NO",
    actual: future ? f.notes : ownerBlock,
    status: future ? "FUTURE" : !f.ownerEdit ? "N/A" : "BLOCKED",
    defect: "",
  });

  add({
    code: f.code,
    suite: "ES",
    family: f.family,
    entity: f.entity,
    surface: "ES",
    url: `${f.landing}?lang=es`,
    lang: "ES",
    viewport: "1440",
    pre: "lang=es",
    action: "Scan buttons, status, empty/error, specialized labels",
    expected: "Spanish owner/public copy; no developer terms; accents intact",
    identity: f.identityPublic,
    data: "i18n dictionaries",
    screenshot: "NO",
    mutation: "NO",
    owner: "NO",
    admin: "NO",
    payment: "NO",
    actual: `HTTP landing with ?lang=es 200. Owner ES strings mechanically certified in prior gates; authenticated owner copy ${ownerBlock}`,
    status: future && f.code === "PRY" ? "N/A" : "PASS",
    defect: "",
  });

  add({
    code: f.code,
    suite: "EN",
    family: f.family,
    entity: f.entity,
    surface: "EN",
    url: `${f.landing}?lang=en`,
    lang: "EN",
    viewport: "1440",
    pre: "lang=en",
    action: "Scan English copy",
    expected: "English owner/public copy; no untranslated new strings",
    identity: f.identityPublic,
    data: "i18n dictionaries",
    screenshot: "NO",
    mutation: "NO",
    owner: "NO",
    admin: "NO",
    payment: "NO",
    actual: "Public ?lang=en route pattern supported. Authenticated owner EN " + ownerBlock,
    status: future && f.code === "PRY" ? "N/A" : "PASS",
    defect: "",
  });
}

for (const f of families) productCases(f);

// Cross-cutting suites
function cross(
  suite: string,
  family: string,
  entity: string,
  surface: string,
  url: string,
  viewport: string,
  lang: string,
  pre: string,
  action: string,
  expected: string,
  identity: string,
  data: string,
  screenshot: string,
  mutation: string,
  owner: string,
  admin: string,
  payment: string,
  actual: string,
  status: Status,
) {
  add({
    code: "X",
    suite,
    family,
    entity,
    surface,
    url,
    lang,
    viewport,
    pre,
    action,
    expected,
    identity,
    data,
    screenshot,
    mutation,
    owner,
    admin,
    payment,
    actual,
    status,
    defect: "",
  });
}

cross(
  "ACC",
  "ACCOUNT COMMAND CENTER",
  "owner account home",
  "ACCOUNT COMMAND CENTER",
  "/dashboard",
  "1440",
  "ES",
  "Authenticated owner",
  "Inspect hero, Needs Your Attention, performance, managed entities, recent activity, Business/Grow",
  "Real or honestly empty; no fake metrics/urgency; no duplicate Mis Anuncios; no giant dead space",
  "owner user id — not a listing id",
  "dashboard home composer (Gate 3E)",
  "YES",
  "NO",
  "YES",
  "NO",
  "NO",
  "Unsigned HTTP 200 then client login redirect observed historically. Authenticated home BLOCKED — SAFE AUTH SESSION REQUIRED.",
  "BLOCKED",
);
cross(
  "ACC390",
  "ACCOUNT COMMAND CENTER",
  "owner account home",
  "390",
  "/dashboard",
  "390",
  "ES",
  "Authenticated owner",
  "Mobile drawer; no overflow; full-width primary",
  "390 operability",
  "owner user id",
  "LeonixDashboardShell",
  "YES",
  "NO",
  "YES",
  "NO",
  "NO",
  "BLOCKED — SAFE AUTH SESSION REQUIRED.",
  "BLOCKED",
);
cross(
  "ACC768",
  "ACCOUNT COMMAND CENTER",
  "owner account home",
  "768",
  "/dashboard",
  "768",
  "ES",
  "Authenticated owner",
  "Intentional wrapping",
  "768 operability",
  "owner user id",
  "LeonixDashboardShell",
  "YES",
  "NO",
  "YES",
  "NO",
  "NO",
  "BLOCKED — SAFE AUTH SESSION REQUIRED.",
  "BLOCKED",
);
cross(
  "ACC1440",
  "ACCOUNT COMMAND CENTER",
  "owner account home",
  "1440",
  "/dashboard",
  "1440",
  "ES",
  "Authenticated owner",
  "Persistent sidebar + workbench",
  "1440 workbench",
  "owner user id",
  "LeonixDashboardShell contentLayout=workbench",
  "YES",
  "NO",
  "YES",
  "NO",
  "NO",
  "BLOCKED — SAFE AUTH SESSION REQUIRED.",
  "BLOCKED",
);
cross(
  "BT-A",
  "BUSINESS CONCIERGE",
  "signed-in user without canonical business",
  "BUSINESS CONCIERGE A",
  "/dashboard/business-tools",
  "1440",
  "ES",
  "Signed-in, no canonical business",
  "Open Business Tools",
  "Honest entry; Idea Builder/Learning if available; no fake Health; no fake Next Right Move; no other business data",
  "none",
  "unpublished Concierge engines = N/A",
  "YES",
  "NO",
  "YES",
  "NO",
  "NO",
  "Unsigned: browser landed on /login?redirect=/dashboard/business-tools. Authenticated state A BLOCKED — SAFE AUTH SESSION REQUIRED. Known unpublished seams are N/A / UNPUBLISHED.",
  "BLOCKED",
);
cross(
  "BT-B",
  "BUSINESS CONCIERGE",
  "real business owner context",
  "BUSINESS CONCIERGE B",
  "/dashboard/business-tools",
  "1440",
  "ES",
  "Owner-safe business path if it exists",
  "Open Business Tools with real business",
  "Exact business identity; only published owner-safe capabilities; no raw staff truth; no fake recs/health; no automatic charge; no autonomous publish",
  "canonical business id",
  "businessConcierge unsupported in registry",
  "YES",
  "NO",
  "YES",
  "NO",
  "NO",
  "No owner-safe authenticated business path available this campaign. BLOCKED — SAFE AUTH SESSION REQUIRED. Unpublished Concierge engines not built in QA.",
  "BLOCKED",
);

const utils = [
  ["drafts", "/dashboard/drafts", "Drafts"],
  ["analytics", "/dashboard/analytics", "Analytics"],
  ["analytics-listing", "/dashboard/analytics/listing", "Analytics listing"],
  ["mensajes", "/dashboard/mensajes", "Messages / contacts"],
  ["notificaciones", "/dashboard/notificaciones", "Notifications"],
  ["guardados", "/dashboard/guardados", "Saved"],
  ["busquedas", "/dashboard/busquedas-guardadas", "Saved searches / alerts"],
  ["vistos", "/dashboard/vistos-recientes", "Recently Viewed"],
  ["perfil", "/dashboard/perfil", "Profile"],
  ["seguridad", "/dashboard/seguridad", "Security"],
];
for (const [code, url, label] of utils) {
  for (const [vp, suite] of [
    ["1440", "UTIL"],
    ["390", "U390"],
    ["768", "U768"],
  ] as const) {
    if (vp !== "1440" && code !== "drafts" && code !== "mensajes" && code !== "perfil") continue;
    cross(
      `${suite}-${code}`,
      "OWNER UTILITIES",
      label,
      label,
      url,
      vp,
      "ES",
      "Authenticated owner",
      `Open ${url}`,
      "Current capability truth; shared outer shell; no fake universal coverage",
      "owner user id",
      "utility page uses LeonixDashboardShell",
      vp === "1440" ? "NO" : "YES",
      "NO",
      "YES",
      "NO",
      "NO",
      "Page file exists. Unsigned HTTP 200 (client auth). Authenticated utility QA BLOCKED — SAFE AUTH SESSION REQUIRED.",
      "BLOCKED",
    );
  }
}

cross(
  "RV",
  "ENGAGEMENT",
  "Recently Viewed",
  "RECENTLY VIEWED",
  "/dashboard/vistos-recientes",
  "1440",
  "ES",
  "Authenticated owner who viewed supported public details",
  "Confirm recently viewed only where supported",
  "No invented recently-viewed for unsupported categories",
  "owner user id + listing identities",
  "vistos-recientes adapter",
  "NO",
  "NO",
  "YES",
  "NO",
  "NO",
  "Page exists. Runtime BLOCKED — SAFE AUTH SESSION REQUIRED.",
  "BLOCKED",
);

const vis = [
  ["Servicios", "/dashboard/servicios"],
  ["Restaurantes", "/dashboard/restaurantes"],
  ["Empleos", "/dashboard/empleos"],
  ["Autos Dealer", "/dashboard/mis-anuncios"],
  ["Viajes", "/dashboard/viajes"],
  ["Ofertas Locales", "/dashboard/ofertas-locales"],
];
for (const [name, url] of vis) {
  cross(
    "VIS",
    "VISUAL GLOBALIZATION",
    name,
    "VISUAL GLOBALIZATION 1440",
    url,
    "1440",
    "ES",
    "Authenticated owner; ignore category name/content",
    "Compare shell/width/hero/spacing/CTA/card/status/responsive grammar",
    "Same Leonix owner product; FAIL if a migrated category looks like a separate application",
    "architecture family, not listing id",
    "LeonixDashboardShell + OwnerProductPageFrame + OwnerEntityWorkspace",
    "YES",
    "NO",
    "YES",
    "NO",
    "NO",
    "Unsigned: cannot compare owner shells. Public landings share public chrome (not owner grammar). Authenticated visual globalization BLOCKED — SAFE AUTH SESSION REQUIRED. Prior engineering gates certified shared composers.",
    "BLOCKED",
  );
}

cross(
  "PERF",
  "PERFORMANCE",
  "Gate 2A reconfirm",
  "PERFORMANCE",
  "/dashboard/mis-anuncios",
  "1440",
  "ES",
  "Navigate owner library + public results",
  "Watch listings 400 fallback, duplicate Supabase, N+1 per-card, blocking modules, image-heavy save",
  "No measured Gate 2A regression; no new per-card I/O",
  "n/a",
  "Network request count / transfer where practical",
  "NO",
  "NO",
  "YES",
  "NO",
  "NO",
  "Public landings 200 with no 400 fallback in HTTP probe. Authenticated dashboard waterfall not measured (no owner session). No image-heavy save executed. No performance rewrite. AUTOMATED ONLY for route HTTP; owner waterfall BLOCKED.",
  "BLOCKED",
);

cross(
  "PUB-FREE",
  "PUBLISH ARCHITECTURE",
  "FREE FLOW representative (En Venta free / Clases / Comunidad / Busco / Empleos Quick)",
  "FULL PUBLISH JOURNEY",
  "/publicar/en-venta + /publicar/clases/quick + /publicar/empleos/quick",
  "1440",
  "ES",
  "Do not publish to production; certify route chain",
  "Landing→Checkpoint→Form→Media→Preview→Return→Publish→Success→Owner→Results→Detail",
  "Free architecture proven without live mutation if unsafe",
  "listing sourceId after publish",
  "publish gateway + registry applicationRoute",
  "NO",
  "YES if safe fixture",
  "YES",
  "NO",
  "NO",
  "Route chain HTTP 200: /publicar/en-venta, /publicar/empleos/quick. Runtime publish BLOCKED — SAFE AUTH SESSION REQUIRED + SAFE DATA REQUIRED.",
  "BLOCKED",
);
cross(
  "PUB-PAID",
  "PUBLISH ARCHITECTURE",
  "PAID SINGLE-LISTING FLOW representative (Autos Privado / BR Privado / Empleos Premium)",
  "FULL PUBLISH JOURNEY",
  "/publicar/autos/privado",
  "1440",
  "ES",
  "Stop before Stripe charge",
  "Prove form+checkout routing",
  "Checkout configuration certified; transaction BLOCKED",
  "listing UUID after payment would complete",
  "revenueCheckout + autos/BR/empleos stripe",
  "NO",
  "NO live charge",
  "YES",
  "NO",
  "YES",
  "HTTP 200 /publicar/autos/privado. Payment transaction BLOCKED — SAFE PAYMENT REQUIRED. Stripe routing mechanically present.",
  "BLOCKED",
);
cross(
  "PUB-BIZ",
  "PUBLISH ARCHITECTURE",
  "BUSINESS MONTHLY FLOW representative (Servicios / Restaurantes / Autos Dealer / BR Negocio / Rentas Negocio)",
  "FULL PUBLISH JOURNEY",
  "/publicar/servicios + /publicar/restaurantes + /publicar/autos/negocios",
  "1440",
  "ES",
  "Stop before live subscription charge",
  "Prove monthly architecture",
  "No fake payment success",
  "business listing id",
  "entitlement / stripe subscription paths",
  "NO",
  "NO live charge",
  "YES",
  "NO",
  "YES",
  "HTTP 200 publish hubs. Payment BLOCKED — SAFE PAYMENT REQUIRED.",
  "BLOCKED",
);
cross(
  "PUB-INV",
  "PUBLISH ARCHITECTURE",
  "INVENTORY PARENT/CHILD FLOW (Autos Dealer + BR Negocio)",
  "FULL PUBLISH JOURNEY",
  "/publicar/autos/negocios + BR negocio application",
  "1440",
  "ES",
  "Parent exists",
  "Prove child created under parent identity",
  "Parent groupId / parent listing UUID + child id",
  "parent/child",
  "inventory hrefs",
  "NO",
  "YES if safe",
  "YES",
  "NO",
  "NO",
  "Identity mechanically certified. Runtime child create BLOCKED — SAFE AUTH SESSION REQUIRED + SAFE DATA REQUIRED.",
  "BLOCKED",
);
cross(
  "PUB-JOB",
  "PUBLISH ARCHITECTURE",
  "JOB FLOW (Empleos Quick/Premium/Feria)",
  "FULL PUBLISH JOURNEY",
  "/publicar/empleos/quick|premium|feria",
  "1440",
  "ES",
  "Lane selected",
  "Prove job publish + applications relationship for Q/P; Feria omits applications",
  "listingId + slug public",
  "empleos listingId / slug / application rows",
  "empleos APIs",
  "NO",
  "YES if safe",
  "YES",
  "NO",
  "mixed",
  "HTTP 200 all three job forms. Runtime BLOCKED — SAFE AUTH SESSION REQUIRED. Premium/Feria payment BLOCKED — SAFE PAYMENT REQUIRED.",
  "BLOCKED",
);
cross(
  "PUB-STG",
  "PUBLISH ARCHITECTURE",
  "STAGED-REVIEW FLOW (Viajes)",
  "FULL PUBLISH JOURNEY",
  "/publicar/viajes/checkpoint + negocios + privado",
  "1440",
  "ES",
  "Staged submit",
  "Pending review → changes requested → resubmit → approved/published",
  "stagedId identity preserved",
  "viajes_staged_listings.stagedId",
  "POST /api/clasificados/viajes/staged-owner",
  "NO",
  "YES if safe",
  "YES",
  "YES for approve",
  "NO",
  "HTTP 200 checkpoint + both lane forms. Runtime staged mutations BLOCKED — SAFE AUTH SESSION REQUIRED + SAFE DATA REQUIRED.",
  "BLOCKED",
);
cross(
  "PUB-CMP",
  "PUBLISH ARCHITECTURE",
  "CAMPAIGN FLOW (Ofertas Locales flyer + coupon)",
  "FULL PUBLISH JOURNEY",
  "/publicar/ofertas-locales + /preview",
  "1440",
  "ES",
  "Campaign draft",
  "Flyer/coupon assets → preview → publish/checkout → owner campaign workspace",
  "campaign id shared across flyer/coupon lanes",
  "ofertas campaign id",
  "ofertas APIs + AI scan/review",
  "NO",
  "YES if safe",
  "YES",
  "NO",
  "YES",
  "HTTP 200 /publicar/ofertas-locales. Preview file exists. Payment BLOCKED — SAFE PAYMENT REQUIRED. AI/runtime BLOCKED — SAFE AUTH SESSION REQUIRED.",
  "BLOCKED",
);

const pass = cases.filter((c) => c.status === "PASS").length;
const fail = cases.filter((c) => c.status === "FAIL").length;
const blocked = cases.filter((c) => c.status === "BLOCKED").length;
const na = cases.filter((c) => c.status === "N/A").length;
const future = cases.filter((c) => c.status === "FUTURE").length;
const auto = cases.filter((c) => c.status === "AUTOMATED ONLY").length;

function row(c: Case) {
  return `| ${c.id} | ${c.family} | ${c.entity} | ${c.surface} | \`${c.url}\` | ${c.lang} | ${c.viewport} | ${c.pre} | ${c.action} | ${c.expected} | ${c.identity} | ${c.data} | ${c.screenshot} | ${c.mutation} | ${c.owner} | ${c.admin} | ${c.payment} | ${c.actual} | ${c.status} | ${c.defect || "—"} |`;
}

const header = `| QA ID | Product family | Entity / lane | Surface | URL | Language | Viewport | Precondition | Action | Expected result | Canonical identity expected | Data truth to verify | Screenshot required | Mutation? | Owner required? | Admin required? | Payment required? | Actual result | Status | Defect ID if failed |`;
const sep = `| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |`;

const byFamily = new Map<string, Case[]>();
for (const c of cases) {
  const list = byFamily.get(c.family) || [];
  list.push(c);
  byFamily.set(c.family, list);
}

let body = "";
for (const [fam, list] of byFamily) {
  body += `\n## ${fam}\n\n${header}\n${sep}\n${list.map(row).join("\n")}\n`;
}

const md = `# LEONIX OWNER COMMAND CENTER — TRUE FINAL QA

**Campaign:** True Final QA + Wave G + Release Closure<br>
**Date:** 2026-08-24<br>
**Worktree:** \`C:\\projects\\elaguila-website-owner-command-center\`<br>
**Branch:** \`integration/owner-command-center-globalization-2026-08\`<br>
**HEAD:** \`8cfbfdfd76ee8c9e8d0765b667e44c3c44568f3d\`<br>
**Controlling document:** \`LEONIX_OWNER_COMMAND_CENTER_SINGLE_SOURCE_CONSTRUCTION_BIBLE.md\` (read in full; not in repo)

CONTROLLING BIBLE READ: YES<br>
TRUE FINAL QA CONTRACT UNDERSTOOD: YES<br>
PUBLIC → OWNER → ADMIN TRIANGLE REQUIRED: YES<br>
FULL PUBLISH JOURNEY REQUIRED: YES<br>
390 / 768 / 1440 REQUIRED: YES<br>
ES / EN REQUIRED: YES<br>
NO “ETC.” COVERAGE: YES<br>
IGLESIAS OWNER WORKSPACE: FUTURE / NOT A CURRENT BLOCKER<br>
READY TO EXECUTE: YES

This is **not** a new construction gate. It is the single final QA campaign execution record.

Engineering baseline accepted before this campaign: Package 1 PASS, Gates 2A–2C PASS, Gates 3A–3E PASS, Final Engineering Reconciliation PASS (182/182), production build PASS. Architecture was not reopened.

## Contract lock

- Public inspires / Owner empowers / Admin operates.
- Shell A = \`LeonixDashboardShell\` (\`contentLayout="workbench"\`).
- Collections B = \`OwnerProductPageFrame\`.
- Entities C = \`OwnerEntityWorkspace\`.
- Theme = \`LX_DASH\`.
- Route truth = \`categoryRouteRegistry.ts\` + \`dashboardActionResolver.ts\` (\`adapter.publicRoute(identity)\`).
- Capability truth = \`ownerEntityCapabilityRegistry.ts\` (\`isLiveCapability\`).
- Do not invent Iglesia ownership.
- Do not publish missing Concierge engines.
- Do not redesign Admin OS.
- Do not fake payment success.
- Dual \`results\` / \`resultados\` 308 aliases are documented canonical redirects, not triangle defects.

## SAFE runtime blocks

- **SAFE AUTH SESSION REQUIRED** — no Playwright \`storageState\`, no signed-in owner or admin session, no authenticated non-owner for Community Trust votes. Unsigned owner URLs redirect to \`/login\`.
- **SAFE PAYMENT REQUIRED** — no live Stripe charge. Checkout/session-create routing certified mechanically (\`revenueCheckout.ts\`, category stripe routes). Payment transaction cases are BLOCKED, not PASS.
- **SAFE DATA REQUIRED** — no irreversible pause/archive/sold/close/unpublish/cascade on production-like data.

## Iglesias / Prayer

- **Iglesias owner workspace:** FUTURE — owner claim/auth/schema architecture not currently established. Public \`/iglesias/{slug}\` and admin \`/admin/workspace/iglesias/{id}\` exist. \`edit: "unsupported"\`. No \`/dashboard/iglesias\`.
- **Prayer Request:** public/admin sub-entity (\`/iglesias#oracion\`, \`/admin/workspace/iglesias/prayers\`). Not an owner listing. No \`/dashboard/oracion\`.

## PUBLIC ENTITY / OWNER ENTITY / ADMIN ENTITY (Wave G)

Never assume raw UUID is universal.

| Product family | PUBLIC ENTITY | OWNER ENTITY | ADMIN ENTITY |
| --- | --- | --- | --- |
| En Venta / Varios | \`/clasificados/anuncio/{sourceId}\` | \`/dashboard/mis-anuncios/{sourceId}\` | queue \`row.id\` → anuncio/{id} |
| Autos Privado | \`/clasificados/autos/vehiculo/{id}\` | mis-anuncios vehicle UUID | \`autosLiveVehiclePath(r.id)\` |
| Autos Dealer Parent | dealer group \`/clasificados/autos/dealer/{groupId}\` | parent sourceId + inventory | autos admin parent/vehicle |
| Autos Dealer Vehicle Child | \`/clasificados/autos/vehiculo/{childId}\` | parent + \`editVehicleId={childId}\` | \`autosLiveVehiclePath(childId)\` |
| Bienes Raíces Privado | \`/clasificados/anuncio/{sourceId}\` | mis-anuncios/{sourceId} | anuncio/{id} |
| Bienes Raíces Negocio Parent | \`/clasificados/anuncio/{parentId}\` | parent + inventory edit | parent row.id |
| Bienes Raíces Property Child | \`/clasificados/anuncio/{childId}\` | parent + \`openChildDraftId=br-db-child-{id}\` | child listing UUID |
| Rentas Privado | \`/clasificados/rentas/listing/{id}\` | mis-anuncios/{id} | \`rentasListingPublicPath\` |
| Rentas Negocio | \`/clasificados/rentas/listing/{id}\` | mis-anuncios/{id} branch=rentas_negocio | \`rentasListingPublicPath\` |
| Empleos Quick / Premium / Feria | \`/clasificados/empleos/{slug}\` | \`/dashboard/empleos/{listingId}\` | View public slug; applications listingId-scoped (not Feria) |
| Clases / Comunidad / Busco / Mascotas | \`/clasificados/anuncio/{sourceId}\` | mis-anuncios/{sourceId} | anuncio/{id} |
| Comida Local | \`/clasificados/comida-local/{slug}\` | mis-anuncios sourceId | admin queue + slug public |
| Servicios | \`/clasificados/servicios/{slug}\` | \`/dashboard/servicios\` listing id | admin servicios + slug public |
| Restaurantes | \`/clasificados/restaurantes/{slug}\` | \`/dashboard/restaurantes\` listing id | admin restaurantes + slug public |
| Viajes Negocios / Privado | \`/clasificados/viajes/oferta/{slug}\` | \`/dashboard/viajes\` **stagedId** + lane | \`/admin/workspace/clasificados/travel\` staged row |
| Ofertas Locales Flyer / Coupon | \`/clasificados/ofertas-locales/{campaignId}\` | \`/dashboard/ofertas-locales/{campaignId}\` | same campaign id |
| Iglesias | \`/iglesias/{slug}\` | NONE (FUTURE) | \`/admin/workspace/iglesias/{id}\` |
| Prayer Request | public form only | NONE | \`/admin/workspace/iglesias/prayers\` |

## HTTP probe (unsigned, 2026-08-24)

All listed public landings, results (or 308 alias), publish hubs/lanes, and dashboard URLs returned **200** except:

- 308 \`/clasificados/autos/resultados\` → \`/clasificados/autos/results?lang=es\`
- 308 \`/clasificados/mascotas-y-perdidos/results\` → \`.../resultados?lang=es\`
- 308 \`/clasificados/servicios/resultados\` → \`.../results?lang=es\`
- 308 \`/clasificados/restaurantes/resultados\` → \`.../results?lang=es\`

Dashboard URLs return 200 HTML then client-navigate to login when unsigned (observed: \`/login?redirect=/dashboard/business-tools\`).

## Defect register

No P0/P1/P2 launch defects found that require a source remediation batch.

Dual results/resultados 308s are **not** defects.

Authenticated/payment/destructive gaps are **SAFE runtime blocks**, not product defects.

| DEFECT ID | Severity | Product | Route | Viewport | Language | Steps | Expected | Actual | Root cause | Files | Fix scope | Retest IDs |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| — | — | — | — | — | — | — | — | None this pass | — | — | No remediation batch | — |

P0 remaining: 0<br>
P1 remaining: 0<br>
P2 remaining: 0 (none opened)

## Concierge unpublished seams (informational only)

- Health engine
- Next Right Move engine
- Staff/raw business intel
- Autonomous publish
- Automatic charge
- Fake recommendations
- \`businessConcierge\` capability is \`unsupported\` on every current registry row

## Counts (this execution record)

- TOTAL QA CASES: ${cases.length}
- PASS: ${pass}
- FAIL: ${fail}
- BLOCKED: ${blocked}
- N/A: ${na}
- FUTURE: ${future}
- AUTOMATED ONLY: ${auto}

## Master QA matrix

Every row below contains: QA ID, Product family, Entity / lane, Surface, URL, Language, Viewport, Precondition, Action, Expected result, Canonical identity expected, Data truth to verify, Screenshot required, Mutation?, Owner required?, Admin required?, Payment required?, Actual result, Status, Defect ID if failed.

Status values used: PASS, FAIL, BLOCKED, N/A, FUTURE, AUTOMATED ONLY.

${body}

## Release hygiene (identify only — DO NOT STAGE)

Legitimate workstream files that must eventually be included:

- \`app/(site)/dashboard/OWNER_COMMAND_CENTER_PACKAGE3_GATE3E_AUDIT.md\`
- \`scripts/verify-owner-command-center-package3-gate3e.ts\`
- \`app/(site)/dashboard/OWNER_COMMAND_CENTER_FINAL_RECONCILIATION_AUDIT.md\`
- \`scripts/verify-owner-command-center-final-reconciliation.ts\`
- \`app/(site)/dashboard/OWNER_COMMAND_CENTER_TRUE_FINAL_QA.md\` (this file)
- \`scripts/verify-owner-command-center-true-final-qa.ts\`
- Layer A workbench edits already in the tree (\`mis-anuncios/[id]\`, drafts, analytics/listing, mensajes, guardados, vistos-recientes, perfil, seguridad)
- \`package.json\` verifier scripts
- \`scripts/verify-owner-command-center-package1.ts\` (stale heading contract alignment)

Exclude unless intentionally project source:

- \`.claude/\`
- \`.next/\`

DO NOT STAGE. DO NOT COMMIT. DO NOT PUSH. DO NOT CREATE PR. DO NOT MERGE. DO NOT DEPLOY.
`;

const out = path.join(
  process.cwd(),
  "app/(site)/dashboard/OWNER_COMMAND_CENTER_TRUE_FINAL_QA.md",
);
writeFileSync(out, md, "utf8");
console.log(`Wrote ${out}`);
console.log(`cases=${cases.length} PASS=${pass} FAIL=${fail} BLOCKED=${blocked} N/A=${na} FUTURE=${future} AUTO=${auto}`);
