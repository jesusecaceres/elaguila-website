/** Quick Business — ES/EN copy specific to the business intake (shared shell/step strings come from quickClassifiedCopy). */

import type { QuickLang, QuickText } from "@/app/lib/quickClassifieds/quickClassifiedTypes";

export const QUICK_BUSINESS_COPY = {
  eyebrow: { es: "Negocio rápido", en: "Quick business" },
  chooserTitle: { es: "Publica tu negocio en minutos", en: "Publish your business in minutes" },
  chooserBody: {
    es: "Elige tu tipo de negocio. Te hacemos solo las preguntas esenciales, subes una foto real y ves tu perfil antes de pagar.",
    en: "Pick your business type. We only ask the essentials, you add a real photo and see your profile before paying.",
  },
  perMonth: { es: "/mes", en: "/month" },
  chooserDirect: { es: "Aplicación completa", en: "Full application" },
  chooserQuestions: { es: "preguntas", en: "questions" },
  chooserClassifiedsLink: { es: "¿Vendes algo, rentas o buscas empleados? Publica un clasificado rápido", en: "Selling, renting or hiring? Post a quick classified" },
  chooserFullLink: { es: "¿Prefieres la aplicación completa?", en: "Prefer the full application?" },
  chooserFullLinkCta: { es: "Ver todas las opciones de publicación", en: "See all publishing options" },
  manageTitle: { es: "¿Ya publicaste tu negocio?", en: "Already published your business?" },
  manageServicios: { es: "Administrar mi servicio", en: "Manage my service" },
  manageRestaurantes: { es: "Administrar mi restaurante", en: "Manage my restaurant" },
  manageOther: { es: "Mis anuncios (autos y bienes raíces)", en: "My ads (autos and real estate)" },
  reviewPaidNote: {
    es: "Este perfil es una suscripción mensual. Verás el precio exacto y pagarás después de revisar la vista previa.",
    en: "This profile is a monthly subscription. You will see the exact price and pay after reviewing the preview.",
  },
  reviewHandoffNote: {
    es: "Después de la vista previa publicas desde la misma pantalla de Leonix que usa todo el mundo. Podrás completar horarios, cupones y más en tu panel.",
    en: "After the preview you publish from the same Leonix screen everyone uses. You can add more hours, coupons and details from your dashboard later.",
  },
  fromStaffBanner: {
    es: "Este enlace te lo compartió el equipo Leonix. Inicia sesión con tu correo y el perfil quedará a tu nombre.",
    en: "This link was shared by the Leonix team. Sign in with your email and the profile will be in your name.",
  },
  directTitle: { es: "Este tipo de negocio usa la aplicación completa", en: "This business type uses the full application" },
  directCta: { es: "Abrir aplicación completa", en: "Open the full application" },
  hoursDays: { es: "Días que atiendes", en: "Days you are open" },
  hoursOpen: { es: "Abres a las", en: "Opens at" },
  hoursClose: { es: "Cierras a las", en: "Closes at" },
  hoursHint: { es: "Puedes ajustar días y horarios especiales después, desde tu panel.", en: "You can fine-tune days and special hours later from your dashboard." },
  firstItemNote: {
    es: "Tu perfil se publica junto con este primer anuncio real. Podrás agregar más inventario desde tu panel con el mismo paquete.",
    en: "Your profile is published together with this first real listing. You can add more inventory from your dashboard on the same package.",
  },
} as const satisfies Record<string, QuickText>;

export function quickBusinessCopy(key: keyof typeof QUICK_BUSINESS_COPY, lang: QuickLang): string {
  const t = QUICK_BUSINESS_COPY[key];
  return lang === "en" ? t.en : t.es;
}

export const QUICK_BUSINESS_DAY_LABELS: Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", QuickText> = {
  mon: { es: "Lun", en: "Mon" },
  tue: { es: "Mar", en: "Tue" },
  wed: { es: "Mié", en: "Wed" },
  thu: { es: "Jue", en: "Thu" },
  fri: { es: "Vie", en: "Fri" },
  sat: { es: "Sáb", en: "Sat" },
  sun: { es: "Dom", en: "Sun" },
};
