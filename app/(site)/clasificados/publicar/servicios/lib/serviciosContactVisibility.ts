import type { ClasificadosServiciosApplicationState } from "./clasificadosServiciosApplicationTypes";
import type { ServiciosLang } from "./clasificadosServiciosApplicationTypes";
import { isValidEmail } from "./leonixContactCtaPriority";
import { digitsOnly } from "./serviciosPhoneUi";
import { isProbablyValidWebUrl } from "./socialAndUrlHelpers";

/** Labels that must never ship as quick-fact chips (placeholder leak). */
const JUNK_QUICK_FACT_LABEL = /^(etiqueta\s+breve|short\s+label)$/i;

export function isJunkServiciosQuickFactLabel(label: string): boolean {
  return JUNK_QUICK_FACT_LABEL.test(label.trim());
}

/** Auto-enable contact channels when valid data exists (Contact Hub is populated-only). */
export function syncServiciosContactEnables(
  state: ClasificadosServiciosApplicationState,
): Pick<
  ClasificadosServiciosApplicationState,
  "enableCall" | "enableWhatsapp" | "enableEmail" | "enableWebsite" | "enableMessage"
> {
  const phoneOk = digitsOnly(state.phone).length >= 8 || digitsOnly(state.phoneOffice).length >= 8;
  const whatsappOk =
    digitsOnly(state.whatsapp).length >= 8 ||
    (state.whatsappBusinessUrl.trim().length > 0 && isProbablyValidWebUrl(state.whatsappBusinessUrl));
  const emailOk = isValidEmail(state.email);
  const websiteOk = state.website.trim().length > 0 && isProbablyValidWebUrl(state.website);

  return {
    enableCall: phoneOk,
    enableWhatsapp: whatsappOk,
    enableEmail: emailOk,
    enableWebsite: websiteOk,
    enableMessage: false,
  };
}

export function hasServiciosValidContactData(state: ClasificadosServiciosApplicationState): boolean {
  const synced = syncServiciosContactEnables(state);
  return synced.enableCall || synced.enableWhatsapp || synced.enableEmail || synced.enableWebsite;
}

export type ServiciosContactPreviewLine = { id: string; label: string };

/** Read-only preview of what the public Contact Hub can show from filled fields. */
export function buildServiciosContactPreviewLines(
  state: ClasificadosServiciosApplicationState,
  lang: ServiciosLang,
): ServiciosContactPreviewLine[] {
  const L =
    lang === "en"
      ? {
          call: "Call",
          wa: "WhatsApp",
          email: "Email",
          web: "Website",
          map: "Address / directions",
          ig: "Instagram",
          fb: "Facebook",
          yt: "YouTube",
          tt: "TikTok",
          li: "LinkedIn",
          x: "X (Twitter)",
          sc: "Snapchat",
          google: "Google Reviews",
          yelp: "Yelp Reviews",
          extra: "Additional link",
        }
      : {
          call: "Llamar",
          wa: "WhatsApp",
          email: "Correo",
          web: "Sitio web",
          map: "Dirección / cómo llegar",
          ig: "Instagram",
          fb: "Facebook",
          yt: "YouTube",
          tt: "TikTok",
          li: "LinkedIn",
          x: "X (Twitter)",
          sc: "Snapchat",
          google: "Opiniones en Google",
          yelp: "Opiniones en Yelp",
          extra: "Enlace adicional",
        };

  const lines: ServiciosContactPreviewLine[] = [];
  const enables = syncServiciosContactEnables(state);

  if (enables.enableWhatsapp) lines.push({ id: "wa", label: L.wa });
  if (enables.enableCall) lines.push({ id: "call", label: L.call });
  if (enables.enableEmail) lines.push({ id: "email", label: L.email });
  if (enables.enableWebsite) lines.push({ id: "web", label: L.web });

  const hasAddress =
    state.physicalStreet.trim() ||
    state.physicalAddressCity.trim() ||
    state.physicalRegion.trim() ||
    state.physicalPostalCode.trim();
  if (hasAddress) lines.push({ id: "map", label: L.map });

  if (state.socialInstagram.trim() && isProbablyValidWebUrl(state.socialInstagram)) {
    lines.push({ id: "ig", label: L.ig });
  }
  if (state.socialFacebook.trim() && isProbablyValidWebUrl(state.socialFacebook)) {
    lines.push({ id: "fb", label: L.fb });
  }
  if (state.socialYoutube.trim() && isProbablyValidWebUrl(state.socialYoutube)) {
    lines.push({ id: "yt", label: L.yt });
  }
  if (state.socialTiktok.trim() && isProbablyValidWebUrl(state.socialTiktok)) {
    lines.push({ id: "tt", label: L.tt });
  }
  if (state.socialLinkedin.trim() && isProbablyValidWebUrl(state.socialLinkedin)) {
    lines.push({ id: "li", label: L.li });
  }
  if (state.socialX.trim() && isProbablyValidWebUrl(state.socialX)) {
    lines.push({ id: "x", label: L.x });
  }
  if (state.socialSnapchat.trim() && isProbablyValidWebUrl(state.socialSnapchat)) {
    lines.push({ id: "sc", label: L.sc });
  }
  if (state.googleReviewsUrl.trim() && isProbablyValidWebUrl(state.googleReviewsUrl)) {
    lines.push({ id: "google", label: L.google });
  }
  if (state.yelpReviewsUrl.trim() && isProbablyValidWebUrl(state.yelpReviewsUrl)) {
    lines.push({ id: "yelp", label: L.yelp });
  }
  if (state.extraLink1Url.trim() && isProbablyValidWebUrl(state.extraLink1Url)) {
    lines.push({ id: "extra1", label: state.extraLink1Label.trim() || L.extra });
  }
  if (state.extraLink2Url.trim() && isProbablyValidWebUrl(state.extraLink2Url)) {
    lines.push({ id: "extra2", label: state.extraLink2Label.trim() || L.extra });
  }

  return lines;
}
