/**
 * Build 09/10 — visitor-facing face-to-face / doorbell copy (ES default).
 * No provider/API/resolver jargon. Meet = video room, not ringing claim.
 */

import type { FaceToFaceVideoProvider } from "./resolvePreferredFaceToFaceConnection";
import type { DigitalContactLang } from "../digitalContactTypes";

export type FaceToFaceCopy = {
  /** Section heading — digital doorbell intent. */
  sectionTitle: string;
  sectionBody: string;
  /** Primary button label for opening a video room. */
  videoRoomCta: string;
  /** Legacy alias used by compact CTAs. */
  videoCtaPrimary: string;
  videoCtaSub: string;
  /** Build 11 — Daily managed primary CTA. */
  dailyPrimaryCta: string;
  dailyPrimarySub: string;
  meetFallbackLabel: string;
  meetFallbackHint: string;
  /** Truthful Meet room disclaimer (not a ringing call). */
  googleMeetRoomHint: string;
  teamsRoomHint: string;
  opensWithGoogleMeet: string;
  opensWithTeams: string;
  opensWithFacetime: string;
  whoToSpeakWith: string;
  whoToSpeakWithBody: string;
  personVideoCta: string;
  appConnectionsTitle: string;
  appConnectionsBody: string;
  appWhatsAppAction: string;
  appMessengerAction: string;
  appInstagramAction: string;
  appTeamsAction: string;
  nativeFallbackTitle: string;
  nativeFallbackBody: string;
  otherWaysTitle: string;
  otherWaysBody: string;
};

const ES: FaceToFaceCopy = {
  sectionTitle: "Hablar cara a cara",
  sectionBody: "Conéctate cara a cara con nuestro equipo.",
  videoRoomCta: "Abrir sala de video",
  videoCtaPrimary: "Videollamada",
  videoCtaSub: "Intentaremos conectarte con nuestro equipo.",
  dailyPrimaryCta: "Videollamada",
  dailyPrimarySub: "Intentaremos conectarte con nuestro equipo.",
  meetFallbackLabel: "También: Google Meet",
  meetFallbackHint:
    "Abre nuestra sala de Google Meet. Es posible que necesitemos aceptar tu solicitud para entrar.",
  googleMeetRoomHint:
    "Abre nuestra sala de Google Meet. Es posible que necesitemos aceptar tu solicitud para entrar.",
  teamsRoomHint:
    "Abre nuestra sala de Microsoft Teams. Es posible que necesitemos aceptar tu solicitud para entrar.",
  opensWithGoogleMeet: "Se abre con Google Meet",
  opensWithTeams: "Se abre con Microsoft Teams",
  opensWithFacetime: "Se abre con FaceTime",
  whoToSpeakWith: "¿Con quién quieres hablar?",
  whoToSpeakWithBody: "Elige a la persona e inicia la videollamada.",
  personVideoCta: "Videollamada",
  appConnectionsTitle: "También puedes contactarnos por:",
  appConnectionsBody: "Usa la app o el método que prefieras.",
  appWhatsAppAction: "Enviar mensaje",
  appMessengerAction: "Abrir Messenger",
  appInstagramAction: "Abrir Instagram",
  appTeamsAction: "Abrir sala de Teams",
  nativeFallbackTitle: "Llamar, mensaje o correo",
  nativeFallbackBody: "Si el video no es posible ahora, usa estas opciones.",
  otherWaysTitle: "Otras formas de contactarnos",
  otherWaysBody: "Si la videollamada no es posible ahora, usa la opción que te resulte más fácil.",
};

const EN: FaceToFaceCopy = {
  sectionTitle: "Talk face-to-face",
  sectionBody: "Connect face-to-face with our team.",
  videoRoomCta: "Open video room",
  videoCtaPrimary: "Video call",
  videoCtaSub: "We’ll try to connect you with our team.",
  dailyPrimaryCta: "Video call",
  dailyPrimarySub: "We’ll try to connect you with our team.",
  meetFallbackLabel: "Also: Google Meet",
  meetFallbackHint:
    "Open our Google Meet room. We may need to approve your request to join.",
  googleMeetRoomHint:
    "Open our Google Meet room. We may need to approve your request to join.",
  teamsRoomHint:
    "Open our Microsoft Teams room. We may need to approve your request to join.",
  opensWithGoogleMeet: "Opens with Google Meet",
  opensWithTeams: "Opens with Microsoft Teams",
  opensWithFacetime: "Opens with FaceTime",
  whoToSpeakWith: "Who would you like to speak with?",
  whoToSpeakWithBody: "Choose a person and start the video call.",
  personVideoCta: "Video call",
  appConnectionsTitle: "You can also reach us by:",
  appConnectionsBody: "Use whichever app or method you prefer.",
  appWhatsAppAction: "Send message",
  appMessengerAction: "Open Messenger",
  appInstagramAction: "Open Instagram",
  appTeamsAction: "Open Teams room",
  nativeFallbackTitle: "Call, text, or email",
  nativeFallbackBody: "If video isn’t possible right now, use these options.",
  otherWaysTitle: "Other ways to reach us",
  otherWaysBody: "If video isn’t possible right now, use whichever option is easiest for you.",
};

export function getFaceToFaceCopy(lang: DigitalContactLang): FaceToFaceCopy {
  return lang === "en" ? EN : ES;
}

export function providerOpensLabel(provider: FaceToFaceVideoProvider, lang: DigitalContactLang): string {
  const copy = getFaceToFaceCopy(lang);
  if (provider === "google_meet") return copy.opensWithGoogleMeet;
  if (provider === "teams") return copy.opensWithTeams;
  return copy.opensWithFacetime;
}

export function videoRoomHintForProvider(
  provider: FaceToFaceVideoProvider,
  lang: DigitalContactLang,
): string {
  const copy = getFaceToFaceCopy(lang);
  if (provider === "google_meet") return copy.googleMeetRoomHint;
  if (provider === "teams") return copy.teamsRoomHint;
  return copy.opensWithFacetime;
}
