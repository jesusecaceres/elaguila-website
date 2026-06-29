/**
 * Single contract for Clasificados category operations (admin queues, URLs, writable tables).
 * Keep in sync with migrations and `listingsLeonixPrefixForCategory` in leonixAdIdAllocator.ts.
 */
import type { ClasificadosCategoryRegistryEntry } from "@/app/lib/clasificados/clasificadosCategoryRegistry";

export type ClassifiedsOpsKind =
  | "restaurantes"
  | "servicios"
  | "comida_local"
  | "empleos"
  | "autos"
  | "listings"
  | "viajes_staged";

export type ClassifiedsCategoryOpsContract = {
  slug: string;
  displayLabelEs: string;
  displayLabelEn: string;
  opsKind: ClassifiedsOpsKind;
  /** Primary writable table for published/live rows */
  writableTable: string;
  leonixPrefix: string;
  /** Admin route: full public listings queue (Restaurante-style table) */
  publicListingsAdminPath: string;
  /** Fields & notes (schema / editor) */
  fieldsNotesAdminPath: string;
  operationalSpaceAdminPath: string;
  /** Filtered ad queue (may equal publicListingsAdminPath when dedicated) */
  adQueueAdminPath: string;
  /** Build public URL for a row (id/slug as needed) */
  buildPublicUrl: (row: Record<string, unknown>) => string;
  /** Staff edit surface */
  buildStaffEditUrl: (row: Record<string, unknown>) => string;
};

const GENERIC_HUB = "/admin/workspace/clasificados";

function listingPublicUrl(row: Record<string, unknown>): string {
  const id = String(row.id ?? "").trim();
  return `/clasificados/anuncio/${encodeURIComponent(id)}`;
}

function rentasPublicUrl(row: Record<string, unknown>): string {
  const id = String(row.id ?? "").trim();
  return `/clasificados/rentas/listing/${encodeURIComponent(id)}?lang=es`;
}

function listingStaffEditUrl(row: Record<string, unknown>): string {
  const id = String(row.id ?? "").trim();
  return `${GENERIC_HUB}/listings/${encodeURIComponent(id)}/edit`;
}

export const CLASSIFIEDS_OPS_CONTRACTS: ClassifiedsCategoryOpsContract[] = [
  {
    slug: "restaurantes",
    displayLabelEs: "Restaurantes",
    displayLabelEn: "Restaurants",
    opsKind: "restaurantes",
    writableTable: "restaurantes_public_listings",
    leonixPrefix: "REST",
    publicListingsAdminPath: "/admin/workspace/clasificados/restaurantes",
    fieldsNotesAdminPath: "/admin/workspace/clasificados/category/restaurantes#contenido",
    operationalSpaceAdminPath: "/admin/workspace/clasificados/category/restaurantes#operacion",
    adQueueAdminPath: "/admin/workspace/clasificados/restaurantes",
    buildPublicUrl: (row) => {
      const slug = String(row.slug ?? "").trim();
      return `/clasificados/restaurantes/${encodeURIComponent(slug)}?lang=es`;
    },
    buildStaffEditUrl: () => "/admin/workspace/clasificados/restaurantes",
  },
  {
    slug: "servicios",
    displayLabelEs: "Servicios",
    displayLabelEn: "Services",
    opsKind: "servicios",
    writableTable: "servicios_public_listings",
    leonixPrefix: "SERV",
    publicListingsAdminPath: "/admin/workspace/clasificados/servicios",
    fieldsNotesAdminPath: "/admin/workspace/clasificados/category/servicios#contenido",
    operationalSpaceAdminPath: "/admin/workspace/clasificados/category/servicios#operacion",
    adQueueAdminPath: "/admin/workspace/clasificados/servicios",
    buildPublicUrl: (row) => {
      const slug = String(row.slug ?? "").trim();
      return `/clasificados/servicios/${encodeURIComponent(slug)}?lang=es`;
    },
    buildStaffEditUrl: (row) => {
      const slug = String(row.slug ?? "").trim();
      return `/servicios/perfil/${encodeURIComponent(slug)}`;
    },
  },
  {
    slug: "comida-local",
    displayLabelEs: "Comida Local",
    displayLabelEn: "Local Food",
    opsKind: "comida_local",
    writableTable: "comida_local_public_listings",
    leonixPrefix: "COMIDA",
    publicListingsAdminPath: "/admin/workspace/clasificados/comida-local",
    fieldsNotesAdminPath: "/admin/workspace/clasificados/category/comida-local#contenido",
    operationalSpaceAdminPath: "/admin/workspace/clasificados/category/comida-local#operacion",
    adQueueAdminPath: "/admin/workspace/clasificados/comida-local",
    buildPublicUrl: (row) => {
      const slug = String(row.slug ?? "").trim();
      return `/clasificados/comida-local/${encodeURIComponent(slug)}?lang=es`;
    },
    buildStaffEditUrl: () => "/publicar/comida-local",
  },
  {
    slug: "empleos",
    displayLabelEs: "Empleos",
    displayLabelEn: "Jobs",
    opsKind: "empleos",
    writableTable: "empleos_public_listings",
    leonixPrefix: "JOB",
    publicListingsAdminPath: "/admin/workspace/clasificados/empleos",
    fieldsNotesAdminPath: "/admin/workspace/clasificados/category/empleos#contenido",
    operationalSpaceAdminPath: "/admin/workspace/clasificados/category/empleos#operacion",
    adQueueAdminPath: "/admin/workspace/clasificados/empleos",
    buildPublicUrl: (row) => {
      const slug = String(row.slug ?? "").trim();
      return `/clasificados/empleos/${encodeURIComponent(slug)}?lang=es`;
    },
    buildStaffEditUrl: (row) => {
      const id = String(row.id ?? "").trim();
      return `/dashboard/empleos/${encodeURIComponent(id)}?lang=es`;
    },
  },
  {
    slug: "autos",
    displayLabelEs: "Autos",
    displayLabelEn: "Autos",
    opsKind: "autos",
    writableTable: "autos_classifieds_listings",
    leonixPrefix: "AUTO",
    publicListingsAdminPath: "/admin/workspace/clasificados/autos",
    fieldsNotesAdminPath: "/admin/workspace/clasificados/category/autos#contenido",
    operationalSpaceAdminPath: "/admin/workspace/clasificados/category/autos#operacion",
    adQueueAdminPath: "/admin/workspace/clasificados/autos",
    buildPublicUrl: (row) => {
      const id = String(row.id ?? "").trim();
      return `/clasificados/autos/vehiculo/${encodeURIComponent(id)}?lang=es`;
    },
    buildStaffEditUrl: (row) => {
      const id = String(row.id ?? "").trim();
      return `/dashboard/mis-anuncios/${encodeURIComponent(id)}`;
    },
  },
  {
    slug: "rentas",
    displayLabelEs: "Rentas",
    displayLabelEn: "Rentals",
    opsKind: "listings",
    writableTable: "listings",
    leonixPrefix: "RENT",
    publicListingsAdminPath: "/admin/workspace/clasificados/rentas",
    fieldsNotesAdminPath: "/admin/workspace/clasificados/category/rentas#contenido",
    operationalSpaceAdminPath: "/admin/workspace/clasificados/category/rentas#operacion",
    adQueueAdminPath: "/admin/workspace/clasificados/rentas",
    buildPublicUrl: rentasPublicUrl,
    buildStaffEditUrl: listingStaffEditUrl,
  },
  {
    slug: "bienes-raices",
    displayLabelEs: "Bienes raíces",
    displayLabelEn: "Real estate",
    opsKind: "listings",
    writableTable: "listings",
    leonixPrefix: "BR",
    publicListingsAdminPath: "/admin/workspace/clasificados/bienes-raices",
    fieldsNotesAdminPath: "/admin/workspace/clasificados/category/bienes-raices#contenido",
    operationalSpaceAdminPath: "/admin/workspace/clasificados/category/bienes-raices#operacion",
    adQueueAdminPath: "/admin/workspace/clasificados/bienes-raices",
    buildPublicUrl: listingPublicUrl,
    buildStaffEditUrl: listingStaffEditUrl,
  },
  {
    slug: "en-venta",
    displayLabelEs: "En venta",
    displayLabelEn: "For sale",
    opsKind: "listings",
    writableTable: "listings",
    leonixPrefix: "SALE",
    publicListingsAdminPath: "/admin/workspace/clasificados/en-venta",
    fieldsNotesAdminPath: "/admin/workspace/clasificados/category/en-venta#contenido",
    operationalSpaceAdminPath: "/admin/workspace/clasificados/category/en-venta#operacion",
    adQueueAdminPath: "/admin/workspace/clasificados/en-venta",
    buildPublicUrl: listingPublicUrl,
    buildStaffEditUrl: listingStaffEditUrl,
  },
  {
    slug: "comunidad",
    displayLabelEs: "Comunidad y Eventos",
    displayLabelEn: "Community & Events",
    opsKind: "listings",
    writableTable: "listings",
    leonixPrefix: "COM",
    publicListingsAdminPath: "/admin/workspace/clasificados/comunidad",
    fieldsNotesAdminPath: "/admin/workspace/clasificados/category/comunidad#contenido",
    operationalSpaceAdminPath: "/admin/workspace/clasificados/category/comunidad#operacion",
    adQueueAdminPath: "/admin/workspace/clasificados/comunidad",
    buildPublicUrl: listingPublicUrl,
    buildStaffEditUrl: listingStaffEditUrl,
  },
  {
    slug: "clases",
    displayLabelEs: "Clases",
    displayLabelEn: "Classes",
    opsKind: "listings",
    writableTable: "listings",
    leonixPrefix: "CLASS",
    publicListingsAdminPath: "/admin/workspace/clasificados/clases",
    fieldsNotesAdminPath: "/admin/workspace/clasificados/category/clases#contenido",
    operationalSpaceAdminPath: "/admin/workspace/clasificados/category/clases#operacion",
    adQueueAdminPath: "/admin/workspace/clasificados/clases",
    buildPublicUrl: listingPublicUrl,
    buildStaffEditUrl: listingStaffEditUrl,
  },
  {
    slug: "mascotas-y-perdidos",
    displayLabelEs: "Mascotas y Perdidos",
    displayLabelEn: "Pets & Lost & Found",
    opsKind: "listings",
    writableTable: "listings",
    leonixPrefix: "PET",
    publicListingsAdminPath: "/admin/workspace/clasificados/mascotas-y-perdidos",
    fieldsNotesAdminPath: "/admin/workspace/clasificados/category/mascotas-y-perdidos#contenido",
    operationalSpaceAdminPath: "/admin/workspace/clasificados/category/mascotas-y-perdidos#operacion",
    adQueueAdminPath: "/admin/workspace/clasificados/mascotas-y-perdidos",
    buildPublicUrl: listingPublicUrl,
    buildStaffEditUrl: listingStaffEditUrl,
  },
  {
    slug: "travel",
    displayLabelEs: "Viajes",
    displayLabelEn: "Travel",
    opsKind: "viajes_staged",
    writableTable: "viajes_staged_listings",
    leonixPrefix: "TRAV",
    publicListingsAdminPath: "/admin/workspace/clasificados/travel",
    fieldsNotesAdminPath: "/admin/workspace/clasificados/category/travel#contenido",
    operationalSpaceAdminPath: "/admin/workspace/clasificados/category/travel#operacion",
    adQueueAdminPath: "/admin/workspace/clasificados/travel",
    buildPublicUrl: (row) => {
      const slug = String(row.slug ?? "").trim();
      return `/clasificados/viajes/oferta/${encodeURIComponent(slug)}`;
    },
    buildStaffEditUrl: () => "/admin/clasificados/viajes/business-offers",
  },
];

export function getClassifiedsOpsContract(slug: string): ClassifiedsCategoryOpsContract | undefined {
  return CLASSIFIEDS_OPS_CONTRACTS.find((c) => c.slug === slug);
}

/** Contracts for every registry row that has a schema entry (hub cards). */
export function contractsForRegistry(registry: ClasificadosCategoryRegistryEntry[]): ClassifiedsCategoryOpsContract[] {
  const slugs = new Set(registry.map((r) => r.slug));
  return CLASSIFIEDS_OPS_CONTRACTS.filter((c) => slugs.has(c.slug));
}
