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
  sectionBody: "Elige la app o el método que prefieras para intentar conectarte ahora.",
  videoRoomCta: "Abrir sala de video",
  videoCtaPrimary: "Abrir sala de video",
  videoCtaSub: "Hablar cara a cara",
  googleMeetRoomHint:
    "Abre nuestra sala de Google Meet. Es posible que necesitemos aceptar tu solicitud para entrar.",
  teamsRoomHint:
    "Abre nuestra sala de Microsoft Teams. Es posible que necesitemos aceptar tu solicitud para entrar.",
  opensWithGoogleMeet: "Se abre con Google Meet",
  opensWithTeams: "Se abre con Microsoft Teams",
  opensWithFacetime: "Se abre con FaceTime",
  whoToSpeakWith: "¿Con quién quieres hablar?",
  whoToSpeakWithBody: "Elige a la persona e inicia la sala de video.",
  personVideoCta: "Abrir sala",
  appConnectionsTitle: "También puedes contactarnos con una app",
  appConnectionsBody: "Envía un mensaje por la plataforma que ya usas.",
  appWhatsAppAction: "Enviar mensaje",
  appMessengerAction: "Abrir Messenger",
  appInstagramAction: "Abrir Instagram",
  appTeamsAction: "Abrir sala de Teams",
  nativeFallbackTitle: "Llamar, mensaje o correo",
  nativeFallbackBody: "Si las apps no están disponibles, usa estas opciones.",
  otherWaysTitle: "Otras formas de contactarnos",
  otherWaysBody: "Si la sala de video no es posible ahora, usa la opción que te resulte más fácil.",
};

const EN: FaceToFaceCopy = {
  sectionTitle: "Talk face-to-face",
  sectionBody: "Choose the app or method you prefer to try connecting now.",
  videoRoomCta: "Open video room",
  videoCtaPrimary: "Open video room",
  videoCtaSub: "Talk face-to-face",
  googleMeetRoomHint:
    "Open our Google Meet room. We may need to approve your request to join.",
  teamsRoomHint:
    "Open our Microsoft Teams room. We may need to approve your request to join.",
  opensWithGoogleMeet: "Opens with Google Meet",
  opensWithTeams: "Opens with Microsoft Teams",
  opensWithFacetime: "Opens with FaceTime",
  whoToSpeakWith: "Who would you like to speak with?",
  whoToSpeakWithBody: "Choose a person and open the video room.",
  personVideoCta: "Open room",
  appConnectionsTitle: "You can also reach us with an app",
  appConnectionsBody: "Send a message on a platform you already use.",
  appWhatsAppAction: "Send message",
  appMessengerAction: "Open Messenger",
  appInstagramAction: "Open Instagram",
  appTeamsAction: "Open Teams room",
  nativeFallbackTitle: "Call, text, or email",
  nativeFallbackBody: "If apps aren’t available, use these options.",
  otherWaysTitle: "Other ways to reach us",
  otherWaysBody: "If the video room isn’t possible right now, use whichever option is easiest for you.",
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
