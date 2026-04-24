/**
 * Servicios categories structure for grouped dropdown selection
 */

export interface ServiciosCategoryOption {
  value: string;
  label: string;
}

export interface ServiciosCategoryGroup {
  label: string;
  options: ServiciosCategoryOption[];
}

export const serviciosCategories: ServiciosCategoryGroup[] = [
  {
    label: "Hogar y Oficios",
    options: [
      { value: "Plomería", label: "Plomería" },
      { value: "Electricista", label: "Electricista" },
      { value: "Carpintería", label: "Carpintería" },
      { value: "Pintura", label: "Pintura" },
      { value: "HVAC / Aire Acondicionado", label: "HVAC / Aire Acondicionado" },
      { value: "Fumigación / Control de Plagas", label: "Fumigación / Control de Plagas" },
      { value: "Jardinería / Paisajismo", label: "Jardinería / Paisajismo" },
      { value: "Limpieza de Hogares", label: "Limpieza de Hogares" },
      { value: "Reparaciones Generales", label: "Reparaciones Generales" },
      { value: "Remodelación / Construcción", label: "Remodelación / Construcción" },
      { value: "Techos y Canales", label: "Techos y Canales" },
    ],
  },
  {
    label: "Automotriz",
    options: [
      { value: "Mecánica General", label: "Mecánica General" },
      { value: "Smog / Inspección", label: "Smog / Inspección" },
      { value: "Grúa / Remolque", label: "Grúa / Remolque" },
      { value: "Llantas y Neumáticos", label: "Llantas y Neumáticos" },
      { value: "Cambio de Aceite", label: "Cambio de Aceite" },
      { value: "Lavado y Detallado", label: "Lavado y Detallado" },
      { value: "Carrocería y Pintura", label: "Carrocería y Pintura" },
      { value: "Vidrios y Parabrisas", label: "Vidrios y Parabrisas" },
      { value: "Baterías y Eléctrico", label: "Baterías y Eléctrico" },
      { value: "Alineación y Balanceo", label: "Alineación y Balanceo" },
      { value: "Transmisiones", label: "Transmisiones" },
    ],
  },
  {
    label: "Salud y Belleza",
    options: [
      { value: "Peluquería / Barbería", label: "Peluquería / Barbería" },
      { value: "Spa / Masajes", label: "Spa / Masajes" },
      { value: "Uñas / Manicure", label: "Uñas / Manicure" },
      { value: "Estética y Belleza", label: "Estética y Belleza" },
      { value: "Entrenamiento Personal", label: "Entrenamiento Personal" },
      { value: "Nutrición / Dietas", label: "Nutrición / Dietas" },
      { value: "Terapia Física", label: "Terapia Física" },
      { value: "Yoga / Pilates", label: "Yoga / Pilates" },
      { value: "Acupuntura", label: "Acupuntura" },
      { value: "Salud Mental / Psicología", label: "Salud Mental / Psicología" },
    ],
  },
  {
    label: "Legal y Profesional",
    options: [
      { value: "Abogado / Asesoría Legal", label: "Abogado / Asesoría Legal" },
      { value: "Contador / Impuestos", label: "Contador / Impuestos" },
      { value: "Notaría", label: "Notaría" },
      { value: "Traducción / Interpretación", label: "Traducción / Interpretación" },
      { value: "Consultoría de Negocios", label: "Consultoría de Negocios" },
      { value: "Marketing / Publicidad", label: "Marketing / Publicidad" },
      { value: "Diseño Gráfico", label: "Diseño Gráfico" },
      { value: "Fotografía / Video", label: "Fotografía / Video" },
      { value: "Desarrollo Web", label: "Desarrollo Web" },
      { value: "Recursos Humanos", label: "Recursos Humanos" },
      { value: "Arquitectura", label: "Arquitectura" },
    ],
  },
  {
    label: "Educación y Tutoría",
    options: [
      { value: "Tutoría / Clases Particulares", label: "Tutoría / Clases Particulares" },
      { value: "Música / Clases de Instrumento", label: "Música / Clases de Instrumento" },
      { value: "Arte / Manualidades", label: "Arte / Manualidades" },
      { value: "Idiomas / Conversación", label: "Idiomas / Conversación" },
      { value: "Preparación de Exámenes", label: "Preparación de Exámenes" },
      { value: "Educación para Adultos", label: "Educación para Adultos" },
      { value: "Entrenamiento Deportivo", label: "Entrenamiento Deportivo" },
    ],
  },
  {
    label: "Eventos y Entretenimiento",
    options: [
      { value: "Planificación de Eventos", label: "Planificación de Eventos" },
      { value: "Fotografía de Eventos", label: "Fotografía de Eventos" },
      { value: "Catering / Comida para Eventos", label: "Catering / Comida para Eventos" },
      { value: "Entretenimiento / Show", label: "Entretenimiento / Show" },
      { value: "DJ / Música para Eventos", label: "DJ / Música para Eventos" },
      { value: "Decoración de Eventos", label: "Decoración de Eventos" },
      { value: "Alquiler de Equipo para Eventos", label: "Alquiler de Equipo para Eventos" },
    ],
  },
  {
    label: "Tecnología y Soporte",
    options: [
      { value: "Soporte Técnico / TI", label: "Soporte Técnico / TI" },
      { value: "Reparación de Electrónicos", label: "Reparación de Electrónicos" },
      { value: "Desarrollo Web / Apps", label: "Desarrollo Web / Apps" },
      { value: "Diseño Web / UX", label: "Diseño Web / UX" },
      { value: "Instalación de Software", label: "Instalación de Software" },
      { value: "Redes y Conectividad", label: "Redes y Conectividad" },
      { value: "Recuperación de Datos", label: "Recuperación de Datos" },
    ],
  },
  {
    label: "Servicios Generales",
    options: [
      { value: "Mensajería / Delivery", label: "Mensajería / Delivery" },
      { value: "Trámites / Gestoría", label: "Trámites / Gestoría" },
      { value: "Mudanzas / Transporte", label: "Mudanzas / Transporte" },
      { value: "Almacenamiento", label: "Almacenamiento" },
      { value: "Consultoría Variada", label: "Consultoría Variada" },
      { value: "Servicios de Impresión", label: "Servicios de Impresión" },
      { value: "Traducción de Documentos", label: "Traducción de Documentos" },
      { value: "Otro servicio", label: "Otro servicio" },
    ],
  },
];

export function isOtroServicio(category: string): boolean {
  return category === "Otro servicio";
}
