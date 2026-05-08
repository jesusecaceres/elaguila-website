/** Category select options for Clases + Comunidad quick publish. */

export type CommunitySelectOption = {
  value: string;
  labelEs: string;
  labelEn: string;
};

export const CLASES_CATEGORY_OPTIONS: readonly CommunitySelectOption[] = [
  { value: "", labelEs: "— Selecciona —", labelEn: "— Select —" },
  { value: "ingles", labelEs: "Inglés", labelEn: "English" },
  { value: "zumba", labelEs: "Zumba / Fitness", labelEn: "Zumba / Fitness" },
  { value: "tutoria", labelEs: "Tutoría", labelEn: "Tutoring" },
  { value: "musica", labelEs: "Música", labelEn: "Music" },
  { value: "danza", labelEs: "Danza / Baile", labelEn: "Dance" },
  { value: "arte", labelEs: "Arte", labelEn: "Art" },
  { value: "computacion", labelEs: "Computación", labelEn: "Computing" },
  { value: "certificacion", labelEs: "Certificación", labelEn: "Certification" },
  { value: "deportes", labelEs: "Deportes", labelEn: "Sports" },
  { value: "taller", labelEs: "Taller / Workshop", labelEn: "Workshop" },
  { value: "comunidad", labelEs: "Clase comunitaria", labelEn: "Community class" },
  { value: "otro", labelEs: "Otra categoría", labelEn: "Other category" },
] as const;

export const COMUNIDAD_CATEGORY_OPTIONS: readonly CommunitySelectOption[] = [
  { value: "", labelEs: "— Selecciona —", labelEn: "— Select —" },
  { value: "feria", labelEs: "Feria", labelEn: "Fair" },
  { value: "festival", labelEs: "Festival", labelEn: "Festival" },
  { value: "comida", labelEs: "Distribución de comida", labelEn: "Food distribution" },
  { value: "iglesia", labelEs: "Evento de iglesia / comunidad", labelEn: "Church / community" },
  { value: "ciudad", labelEs: "Evento de la ciudad", labelEn: "City event" },
  { value: "salud", labelEs: "Clínica de salud", labelEn: "Health clinic" },
  { value: "escolar", labelEs: "Evento escolar", labelEn: "School event" },
  { value: "recursos", labelEs: "Evento de recursos", labelEn: "Resource event" },
  { value: "familia", labelEs: "Evento familiar", labelEn: "Family event" },
  { value: "taller", labelEs: "Taller abierto", labelEn: "Open workshop" },
  { value: "otro", labelEs: "Otra categoría", labelEn: "Other category" },
] as const;
