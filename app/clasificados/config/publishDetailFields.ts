/**
 * Publish flow: per-category detail field definitions for the unified publicar orchestrator.
 * Labels, keys, and option lists must stay aligned with `getDetailPairs` (lib/publishDetailPairs) / `getPublishCategoryFields` behavior.
 */

import {
  EN_VENTA_PUBLISH_CONDITION_OPTIONS,
  EN_VENTA_SUBCATEGORIES,
} from "@/app/clasificados/en-venta/shared/fields/enVentaTaxonomy";

export type DetailField = {
  key: string;
  label: { es: string; en: string };
  type: "text" | "number" | "select";
  placeholder?: { es: string; en: string };
  options?: Array<{ value: string; label: { es: string; en: string } }>;
};

export const DETAIL_FIELDS: Record<string, DetailField[]> = {
  autos: [
    { key: "year", label: { es: "Año", en: "Year" }, type: "number", placeholder: { es: "Ej: 2018", en: "e.g. 2018" } },
    { key: "make", label: { es: "Marca", en: "Make" }, type: "text", placeholder: { es: "Ej: Toyota", en: "e.g. Toyota" } },
    { key: "model", label: { es: "Modelo", en: "Model" }, type: "text", placeholder: { es: "Ej: Camry", en: "e.g. Camry" } },
    { key: "mileage", label: { es: "Millas", en: "Mileage" }, type: "number", placeholder: { es: "Ej: 85000", en: "e.g. 85000" } },
    {
      key: "condition",
      label: { es: "Condición", en: "Condition" },
      type: "select",
      options: [
        { value: "new", label: { es: "Nuevo", en: "New" } },
        { value: "used", label: { es: "Usado", en: "Used" } },
        { value: "certified", label: { es: "Certificado", en: "Certified" } },
      ],
    },
    {
      key: "transmission",
      label: { es: "Transmisión", en: "Transmission" },
      type: "select",
      options: [
        { value: "auto", label: { es: "Automática", en: "Automatic" } },
        { value: "manual", label: { es: "Manual", en: "Manual" } },
      ],
    },
  ],
  /** Rentas uses getCategoryFields("rentas", details) for dynamic field groups by subcategoría/tipo. */
  rentas: [],
  /** Bienes Raíces: property details for preview and final ad. */
  "bienes-raices": [
    { key: "recamaras", label: { es: "Recámaras", en: "Bedrooms" }, type: "number", placeholder: { es: "Ej: 3", en: "e.g. 3" } },
    { key: "banos", label: { es: "Baños", en: "Bathrooms" }, type: "number", placeholder: { es: "Ej: 2", en: "e.g. 2" } },
    { key: "piesCuadrados", label: { es: "Pies cuadrados", en: "Square feet" }, type: "text", placeholder: { es: "Ej: 1,200", en: "e.g. 1,200" } },
    { key: "comodidades", label: { es: "Comodidades / características", en: "Amenities / features" }, type: "text", placeholder: { es: "Otras (opcional)", en: "Other (optional)" } },
    { key: "direccionPropiedad", label: { es: "Dirección o zona", en: "Address or area" }, type: "text", placeholder: { es: "Ej: Calle Principal 123, San José", en: "e.g. 123 Main St, San Jose" } },
  ],
  empleos: [
    { key: "company", label: { es: "Empresa", en: "Company" }, type: "text", placeholder: { es: "Nombre de la empresa", en: "Company name" } },
    {
      key: "jobType",
      label: { es: "Tipo de trabajo", en: "Job type" },
      type: "select",
      options: [
        { value: "full", label: { es: "Tiempo completo", en: "Full-time" } },
        { value: "part", label: { es: "Medio tiempo", en: "Part-time" } },
        { value: "contract", label: { es: "Contrato", en: "Contract" } },
        { value: "temp", label: { es: "Temporal", en: "Temporary" } },
      ],
    },
    {
      key: "workMode",
      label: { es: "Modalidad", en: "Work mode" },
      type: "select",
      options: [
        { value: "onsite", label: { es: "Presencial", en: "On-site" } },
        { value: "remote", label: { es: "Remoto", en: "Remote" } },
        { value: "hybrid", label: { es: "Híbrido", en: "Hybrid" } },
      ],
    },
    { key: "pay", label: { es: "Pago", en: "Pay" }, type: "text", placeholder: { es: "Ej: $22/hr o $900/sem", en: "e.g. $22/hr or $900/wk" } },
  ],
  servicios: [
    { key: "serviceType", label: { es: "Tipo de servicio", en: "Service type" }, type: "text", placeholder: { es: "Ej: Jardinería, Plomería", en: "e.g. Landscaping, Plumbing" } },
    { key: "area", label: { es: "Zona", en: "Service area" }, type: "text", placeholder: { es: "Ej: San José + 15 mi", en: "e.g. San Jose + 15 mi" } },
    { key: "availability", label: { es: "Disponibilidad", en: "Availability" }, type: "text", placeholder: { es: "Ej: Lun–Sáb", en: "e.g. Mon–Sat" } },
  ],
  "en-venta": [
    {
      key: "rama",
      label: { es: "Subcategoría", en: "Subcategory" },
      type: "select",
      options: EN_VENTA_SUBCATEGORIES.map((s) => ({ value: s.key, label: s.label })),
    },
    { key: "itemType", label: { es: "Artículo", en: "Item type" }, type: "text", placeholder: { es: "Definido por subcategoría", en: "Set by subcategory" } },
    {
      key: "condition",
      label: { es: "Condición", en: "Condition" },
      type: "select",
      options: EN_VENTA_PUBLISH_CONDITION_OPTIONS.map((c) => ({ value: c.value, label: { es: c.labelEs, en: c.labelEn } })),
    },
  ],
  restaurantes: [
    {
      key: "placeType",
      label: { es: "Tipo de negocio", en: "Business type" },
      type: "select",
      options: [
        { value: "brick", label: { es: "Local (restaurante / café)", en: "Brick & mortar (restaurant / café)" } },
        { value: "truck", label: { es: "Food truck", en: "Food truck" } },
        { value: "popup", label: { es: "Pop-up / puesto temporal", en: "Pop-up / temporary stand" } },
      ],
    },
    { key: "cuisine", label: { es: "Cocina", en: "Cuisine" }, type: "text", placeholder: { es: "Ej: Mexicana, Pupusas", en: "e.g. Mexican, Pupusas" } },
    { key: "address", label: { es: "Dirección (opcional)", en: "Address (optional)" }, type: "text", placeholder: { es: "Ej: 123 Main St", en: "e.g. 123 Main St" } },
    { key: "zip", label: { es: "ZIP (opcional)", en: "ZIP (optional)" }, type: "text", placeholder: { es: "Ej: 95112", en: "e.g. 95112" } },
    { key: "hours", label: { es: "Horario (opcional)", en: "Hours (optional)" }, type: "text", placeholder: { es: "Ej: Lun–Sáb 10am–9pm", en: "e.g. Mon–Sat 10am–9pm" } },
    { key: "website", label: { es: "Sitio web (opcional)", en: "Website (optional)" }, type: "text", placeholder: { es: "https://", en: "https://" } },
    { key: "notes", label: { es: "Notas (opcional)", en: "Notes (optional)" }, type: "text", placeholder: { es: "Pedidos por teléfono, especialidades…", en: "Phone orders, specialties…" } },
  ],
};
