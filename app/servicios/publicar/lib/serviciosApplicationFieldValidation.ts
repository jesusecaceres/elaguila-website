import type { ServiciosApplicationDraft } from "../../types/serviciosApplicationDraft";

function trim(s: string | undefined | null): string {
  return typeof s === "string" ? s.trim() : "";
}

/** Lightweight UX hints — resolver remains source of truth for display safety */
export type ServiciosFieldIssue = { path: string; message: string; level: "error" | "warn" };

export function collectServiciosDraftFieldIssues(draft: ServiciosApplicationDraft, lang: "es" | "en"): ServiciosFieldIssue[] {
  const L = lang === "en" ? messagesEn : messagesEs;
  const issues: ServiciosFieldIssue[] = [];

  if (!trim(draft.identity.businessName)) {
    issues.push({ path: "identity.businessName", message: L.businessName, level: "warn" });
  }
  const slug = trim(draft.identity.slug);
  if (!slug) {
    issues.push({ path: "identity.slug", message: L.slugEmpty, level: "warn" });
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug)) {
    issues.push({ path: "identity.slug", message: L.slugFormat, level: "warn" });
  }

  const r = draft.hero.rating;
  if (r != null && (r < 0 || r > 5)) {
    issues.push({ path: "hero.rating", message: L.ratingRange, level: "warn" });
  }
  const rc = draft.hero.reviewCount;
  if (rc != null && (rc < 0 || !Number.isFinite(rc))) {
    issues.push({ path: "hero.reviewCount", message: L.reviewCount, level: "warn" });
  }

  const phone = trim(draft.contact.phone);
  if (phone && !/\d/.test(phone)) {
    issues.push({ path: "contact.phone", message: L.phoneDigits, level: "warn" });
  }

  const web = trim(draft.contact.websiteUrl);
  if (web && !/^https?:\/\//i.test(web)) {
    issues.push({ path: "contact.websiteUrl", message: L.websiteScheme, level: "warn" });
  }

  const promoHref = trim(draft.promo?.href);
  if (promoHref && !promoHref.startsWith("/") && !/^https?:\/\//i.test(promoHref)) {
    issues.push({ path: "promo.href", message: L.promoHref, level: "warn" });
  }

  (draft.services ?? []).forEach((s, i) => {
    if (trim(s.title) && !trim(s.imageUrl)) {
      issues.push({ path: `services[${i}].imageUrl`, message: L.serviceImage, level: "warn" });
    }
    if (trim(s.imageUrl) && !trim(s.title)) {
      issues.push({ path: `services[${i}].title`, message: L.serviceTitle, level: "warn" });
    }
  });

  (draft.gallery ?? []).forEach((g, i) => {
    if (trim(g.url) && !/^https?:\/\//i.test(trim(g.url))) {
      issues.push({ path: `gallery[${i}].url`, message: L.galleryUrl, level: "warn" });
    }
  });

  return issues;
}

const messagesEs = {
  businessName: "Indica el nombre comercial del negocio.",
  slugEmpty: "El identificador URL ayuda a tu perfil público.",
  slugFormat: "Usa letras minúsculas, números y guiones (ej. mi-negocio).",
  ratingRange: "La calificación debe estar entre 0 y 5.",
  reviewCount: "El número de reseñas debe ser un entero ≥ 0.",
  phoneDigits: "Incluye al menos un dígito en el teléfono.",
  websiteScheme: "La web debería empezar con http:// o https://",
  promoHref: "El enlace de oferta debe ser una URL (https://) o ruta interna (/...).",
  serviceImage: "Completa la imagen del servicio o borra la fila.",
  serviceTitle: "Añade un título al servicio.",
  galleryUrl: "La URL de imagen debería empezar con http:// o https://",
};

const messagesEn = {
  businessName: "Add your business display name.",
  slugEmpty: "A URL slug helps your public profile.",
  slugFormat: "Use lowercase letters, numbers, and hyphens (e.g. my-business).",
  ratingRange: "Rating must be between 0 and 5.",
  reviewCount: "Review count must be a whole number ≥ 0.",
  phoneDigits: "Include at least one digit in the phone number.",
  websiteScheme: "Website should start with http:// or https://",
  promoHref: "Offer link should be https:// or an internal path (/...).",
  serviceImage: "Add an image URL or remove the row.",
  serviceTitle: "Add a title for the service.",
  galleryUrl: "Image URL should start with http:// or https://",
};
