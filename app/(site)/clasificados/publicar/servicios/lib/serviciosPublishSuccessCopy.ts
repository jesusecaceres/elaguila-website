/** Seller-facing copy after a successful Servicios publish (Gate 20F). */

export type ServiciosPublishSuccessCopy = {
  title: string;
  body: string;
  clientLine: string;
  leonixIdLabel: string;
  statusGuidance: string;
  termsReminder: string;
  flagWarning: string;
  viewProfile: string;
  dashboard: string;
  postAnother: string;
  viewResults: string;
  persistenceNoteDatabase?: string;
  persistenceNoteDev?: string;
  persistenceNoteBrowser?: string;
};

export function getServiciosPublishSuccessCopy(
  lang: "es" | "en",
  persistence?: string,
): ServiciosPublishSuccessCopy {
  const persistenceNoteDatabase =
    lang === "es"
      ? "Guardado en Leonix. Debería aparecer en resultados y búsqueda de Servicios."
      : "Saved to Leonix. It should appear in Servicios results and search.";
  const persistenceNoteDev =
    lang === "es"
      ? "Modo prueba: guardado en archivo local de desarrollo. Visible en resultados mientras corre next dev en esta máquina."
      : "Test mode: saved to the local dev file. Visible in results while next dev runs on this machine.";
  const persistenceNoteBrowser =
    lang === "es"
      ? "Guardado solo en este navegador (sin base de datos). Abre este perfil desde el mismo navegador para verlo."
      : "Saved in this browser only (no database). Open this profile from the same browser to view it.";

  if (lang === "en") {
    return {
      title: "Your profile was published successfully",
      body: "Your service profile is now available on Leonix.",
      clientLine: "Customers can view your information, services, and contact options.",
      leonixIdLabel: "Leonix ID:",
      statusGuidance:
        "Your profile will remain visible while it is active and follows Leonix rules.",
      termsReminder: "By publishing, you confirmed that your profile follows Leonix rules.",
      flagWarning:
        "If your profile is reported or flagged by our safety assistant, Leonix may review it and take action to keep the community safe.",
      viewProfile: "View my profile",
      dashboard: "Go to my dashboard",
      postAnother: "Post another service",
      viewResults: "View Servicios results",
      persistenceNoteDatabase: persistence === "database" ? persistenceNoteDatabase : undefined,
      persistenceNoteDev: persistence === "dev_workspace" ? persistenceNoteDev : undefined,
      persistenceNoteBrowser: persistence === "none" ? persistenceNoteBrowser : undefined,
    };
  }

  return {
    title: "Tu perfil fue publicado con éxito",
    body: "Tu perfil de servicio ya está disponible en Leonix.",
    clientLine: "Los clientes podrán ver tu información, servicios y formas de contacto.",
    leonixIdLabel: "ID Leonix:",
    statusGuidance: "Tu perfil permanecerá visible mientras esté activo y cumpla con las reglas de Leonix.",
    termsReminder: "Al publicar, confirmaste que tu perfil cumple con las reglas de Leonix.",
    flagWarning:
      "Si tu perfil es reportado o marcado por nuestro asistente de seguridad, Leonix podrá revisarlo y tomar acción para mantener la comunidad segura.",
    viewProfile: "Ver mi perfil",
    dashboard: "Ir a mi panel",
    postAnother: "Publicar otro servicio",
    viewResults: "Ver resultados de Servicios",
    persistenceNoteDatabase: persistence === "database" ? persistenceNoteDatabase : undefined,
    persistenceNoteDev: persistence === "dev_workspace" ? persistenceNoteDev : undefined,
    persistenceNoteBrowser: persistence === "none" ? persistenceNoteBrowser : undefined,
  };
}

export function buildServiciosPublishedProfileHref(slug: string, lang: "es" | "en"): string {
  return `/clasificados/servicios/${encodeURIComponent(slug.trim())}?lang=${lang}`;
}

/** Seller dashboard for Servicios listings (existing route). */
export function buildServiciosSellerDashboardHref(lang: "es" | "en"): string {
  return `/dashboard/servicios?lang=${lang}`;
}

export function buildServiciosPostAnotherHref(lang: "es" | "en"): string {
  return `/clasificados/publicar/servicios?lang=${lang}`;
}
