/** Quick Classifieds — ES/EN framework copy (shell, steps, media, review, login return, doorway). */

import type { QuickLang, QuickText } from "./quickClassifiedTypes";

export function qt(text: QuickText, lang: QuickLang): string {
  return lang === "en" ? text.en : text.es;
}

export function resolveQuickLang(raw: string | null | undefined): QuickLang {
  return (raw ?? "").trim().toLowerCase() === "en" ? "en" : "es";
}

export const QUICK_COPY = {
  brand: { es: "Leonix", en: "Leonix" },
  eyebrow: { es: "Publicación rápida", en: "Quick publish" },
  chooserTitle: { es: "Publica en minutos", en: "Publish in minutes" },
  chooserBody: {
    es: "Elige qué quieres publicar. Te haremos solo las preguntas esenciales, subes una foto y ves tu anuncio antes de publicarlo.",
    en: "Pick what you want to publish. We only ask the essentials, you add a photo and see your ad before publishing.",
  },
  chooserFree: { es: "Gratis", en: "Free" },
  chooserQuestions: { es: "preguntas", en: "questions" },
  chooserStandard: { es: "Aplicación estándar", en: "Standard application" },
  chooserFullLink: { es: "¿Prefieres la aplicación completa?", en: "Prefer the full application?" },
  chooserFullLinkCta: { es: "Ver todas las opciones de publicación", en: "See all publishing options" },
  myAdEntry: { es: "¿Ya publicaste? Administra tu anuncio", en: "Already published? Manage your ad" },
  stepOf: { es: "Paso {n} de {total}", en: "Step {n} of {total}" },
  next: { es: "Continuar", en: "Continue" },
  back: { es: "Atrás", en: "Back" },
  required: { es: "Obligatorio", en: "Required" },
  optional: { es: "Opcional", en: "Optional" },
  fixIssues: { es: "Revisa estos puntos antes de continuar:", en: "Please review these points before continuing:" },
  mediaTitle: { es: "Tus fotos", en: "Your photos" },
  mediaIntro: {
    es: "Se necesita al menos una foto real. Los anuncios con foto reciben muchas más respuestas.",
    en: "At least one real photo is required. Ads with a photo get far more responses.",
  },
  mediaAdd: { es: "Agregar fotos", en: "Add photos" },
  mediaTakePhoto: { es: "Tomar foto", en: "Take photo" },
  mediaCover: { es: "Portada", en: "Cover" },
  mediaMakeCover: { es: "Hacer portada", en: "Make cover" },
  mediaRemove: { es: "Quitar", en: "Remove" },
  mediaMin: { es: "Sube al menos una foto para continuar.", en: "Add at least one photo to continue." },
  mediaMax: { es: "Máximo {max} fotos en esta categoría.", en: "Maximum {max} photos in this category." },
  mediaBadFile: { es: "Solo se aceptan imágenes (JPG, PNG, WebP, HEIC).", en: "Only images are accepted (JPG, PNG, WebP, HEIC)." },
  mediaProcessing: { es: "Preparando foto…", en: "Preparing photo…" },
  reviewTitle: { es: "Revisa tu anuncio", en: "Review your ad" },
  reviewIntro: {
    es: "Así lo vas a enviar a la vista previa. Puedes volver a cualquier paso para cambiar algo.",
    en: "This is what goes to your preview. You can go back to any step to change something.",
  },
  reviewEdit: { es: "Cambiar", en: "Change" },
  reviewPhotos: { es: "Fotos", en: "Photos" },
  reviewSubmit: { es: "Ver mi anuncio", en: "See my ad" },
  reviewSubmitting: { es: "Preparando tu vista previa…", en: "Preparing your preview…" },
  reviewPaidNote: {
    es: "Esta categoría es de pago. Verás el precio y podrás pagar después de revisar la vista previa.",
    en: "This category is paid. You will see the price and can pay after reviewing the preview.",
  },
  reviewFreeNote: { es: "Esta categoría es gratis.", en: "This category is free." },
  reviewHandoffNote: {
    es: "Después de la vista previa publicas desde la misma pantalla de Leonix que usa todo el mundo.",
    en: "After the preview you publish from the same Leonix screen everyone uses.",
  },
  reviewConfirmationsNeeded: { es: "Marca las confirmaciones para continuar.", en: "Tick the confirmations to continue." },
  errorGeneric: { es: "No pudimos preparar tu anuncio. Intenta de nuevo.", en: "We could not prepare your ad. Please try again." },
  blockedTitle: { es: "Usa la aplicación estándar", en: "Use the standard application" },
  blockedCta: { es: "Abrir aplicación estándar", en: "Open standard application" },
  assistedBanner: { es: "Un miembro del equipo Leonix te está ayudando con este anuncio.", en: "A Leonix team member is helping you with this ad." },
  fromStaffBanner: {
    es: "Este enlace te lo compartió el equipo Leonix. Inicia sesión con tu correo y el anuncio quedará a tu nombre.",
    en: "This link was shared by the Leonix team. Sign in with your email and the ad will be in your name.",
  },
  doorwayTitle: { es: "Mi anuncio", en: "My ad" },
  doorwayBody: {
    es: "Todo lo que necesitas para tu anuncio, sin buscar entre menús.",
    en: "Everything you need for your ad, without digging through menus.",
  },
  doorwayView: { es: "Ver mis anuncios", en: "View my ads" },
  doorwayEdit: { es: "Editar anuncio", en: "Edit ad" },
  doorwayEditFrom: { es: "Desde Mis Anuncios, abre tu anuncio y toca Editar.", en: "From My Ads, open your ad and tap Edit." },
  doorwayEndFrom: { es: "Desde Mis Anuncios, abre tu anuncio y elige esta acción.", en: "From My Ads, open your ad and choose this action." },
  doorwayRenewFrom: { es: "Desde Mis Anuncios, cuando falten pocos días para vencer.", en: "From My Ads, when a few days are left before it expires." },
  doorwayHelp: { es: "Necesito ayuda", en: "I need help" },
  doorwayHelpBody: { es: "Escríbenos y te ayudamos con tu anuncio.", en: "Write to us and we will help with your ad." },
  doorwayPublishAnother: { es: "Publicar otro anuncio", en: "Publish another ad" },
  doorwayPickCategory: { es: "¿Qué tipo de anuncio tienes?", en: "What kind of ad do you have?" },
  doorwayNotEditable: { es: "Esta categoría no permite editar un anuncio activo.", en: "This category does not allow editing an active ad." },
  doorwayNoRenew: { es: "Esta categoría no necesita renovación.", en: "This category does not need renewal." },
} as const satisfies Record<string, QuickText>;

export function quickCopy(key: keyof typeof QUICK_COPY, lang: QuickLang, vars?: Record<string, string | number>): string {
  let s = qt(QUICK_COPY[key], lang);
  if (vars) {
    for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  }
  return s;
}
