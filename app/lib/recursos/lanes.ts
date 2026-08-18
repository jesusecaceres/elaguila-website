/**
 * Legacy "lanes" — the existing classifieds-backed community categories
 * (Community & Events, Classes, Churches, Wanted, Pets & Lost, Community
 * Help) that the current `/recursos-comunitarios` page already links to.
 * Extracted from the page so it stays a presentation layer.
 */

export type ResourceLaneKey =
  | "comunidad"
  | "clases"
  | "iglesias"
  | "busco"
  | "mascotas-y-perdidos"
  | "ayuda-comunitaria";

export const LANE_ORDER: readonly ResourceLaneKey[] = [
  "comunidad",
  "clases",
  "iglesias",
  "busco",
  "mascotas-y-perdidos",
  "ayuda-comunitaria",
];

export const LANE_EXPLORE_PATH: Record<ResourceLaneKey, string> = {
  comunidad: "/clasificados/comunidad",
  clases: "/clasificados/clases",
  iglesias: "/iglesias",
  busco: "/clasificados/busco",
  "mascotas-y-perdidos": "/clasificados/mascotas-y-perdidos",
  "ayuda-comunitaria": "/clasificados/busco",
};

export const LANE_PUBLISH_PATH: Record<ResourceLaneKey, string> = {
  comunidad: "/publicar/comunidad/quick",
  clases: "/publicar/clases/quick",
  iglesias: "/publicar",
  busco: "/publicar/busco/quick",
  "mascotas-y-perdidos": "/publicar/mascotas-y-perdidos/quick",
  "ayuda-comunitaria": "/publicar",
};

export type LaneCopy = {
  labelEs: string;
  labelEn: string;
  descEs: string;
  descEn: string;
  publishEs: string;
  publishEn: string;
};

export const LANE_COPY: Record<ResourceLaneKey, LaneCopy> = {
  comunidad: {
    labelEs: "Comunidad y Eventos",
    labelEn: "Community & Events",
    descEs: "Eventos, actividades, reuniones y conexiones locales para la comunidad.",
    descEn: "Events, activities, gatherings, and local connections for the community.",
    publishEs: "Publicar en Comunidad y Eventos",
    publishEn: "Post in Community & Events",
  },
  clases: {
    labelEs: "Clases",
    labelEn: "Classes",
    descEs: "Cursos, talleres y oportunidades de aprendizaje para todas las edades.",
    descEn: "Courses, workshops, and learning opportunities for all ages.",
    publishEs: "Publicar en Clases",
    publishEn: "Post in Classes",
  },
  iglesias: {
    labelEs: "Iglesias",
    labelEn: "Churches",
    descEs: "Espacios de fe, comunidad y conexión espiritual.",
    descEn: "Spaces for faith, community, and spiritual connection.",
    publishEs: "Publicar iglesia",
    publishEn: "Post church",
  },
  busco: {
    labelEs: "Busco / Se busca",
    labelEn: "Wanted / Looking for",
    descEs: "Peticiones, necesidades, oportunidades y búsquedas locales.",
    descEn: "Requests, needs, opportunities, and local searches.",
    publishEs: "Publicar solicitud",
    publishEn: "Post request",
  },
  "mascotas-y-perdidos": {
    labelEs: "Mascotas y Perdidos",
    labelEn: "Pets & Lost",
    descEs: "Mascotas, adopciones, objetos perdidos y apoyo comunitario.",
    descEn: "Pets, adoptions, lost items, and community support.",
    publishEs: "Publicar en Mascotas y Perdidos",
    publishEn: "Post in Pets & Lost",
  },
  "ayuda-comunitaria": {
    labelEs: "Ayuda comunitaria",
    labelEn: "Community Help",
    descEs: "Recursos gratuitos, apoyo local e información útil para familias y vecinos.",
    descEn: "Free resources, local support, and useful information for families and neighbors.",
    publishEs: "Publicar recurso",
    publishEn: "Post resource",
  },
};
