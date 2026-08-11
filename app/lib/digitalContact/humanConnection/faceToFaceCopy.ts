/**
 * Build 09 — visitor-facing face-to-face / doorbell copy (ES default).
 * No provider/API/resolver jargon.
 */

import type { FaceToFaceVideoProvider } from "./resolvePreferredFaceToFaceConnection";
import type { DigitalContactLang } from "../digitalContactTypes";

export type FaceToFaceCopy = {
  videoCtaPrimary: string;
  videoCtaSub: string;
  opensWithGoogleMeet: string;
  opensWithFacetime: string;
  whoToSpeakWith: string;
  whoToSpeakWithBody: string;
  personVideoCta: string;
  otherWaysTitle: string;
  otherWaysBody: string;
};

const ES: FaceToFaceCopy = {
  videoCtaPrimary: "Videollamada",
  videoCtaSub: "Hablar cara a cara",
  opensWithGoogleMeet: "Se abre con Google Meet",
  opensWithFacetime: "Se abre con FaceTime",
  whoToSpeakWith: "¿Con quién quieres hablar?",
  whoToSpeakWithBody: "Elige a la persona e inicia la videollamada.",
  personVideoCta: "Videollamada",
  otherWaysTitle: "Otras formas de contactarnos",
  otherWaysBody: "Si la videollamada no es posible ahora, usa la opción que te resulte más fácil.",
};

const EN: FaceToFaceCopy = {
  videoCtaPrimary: "Video call",
  videoCtaSub: "Talk face-to-face",
  opensWithGoogleMeet: "Opens with Google Meet",
  opensWithFacetime: "Opens with FaceTime",
  whoToSpeakWith: "Who would you like to speak with?",
  whoToSpeakWithBody: "Choose a person and start the video call.",
  personVideoCta: "Video call",
  otherWaysTitle: "Other ways to reach us",
  otherWaysBody: "If video isn’t possible right now, use whichever option is easiest for you.",
};

export function getFaceToFaceCopy(lang: DigitalContactLang): FaceToFaceCopy {
  return lang === "en" ? EN : ES;
}

export function providerOpensLabel(provider: FaceToFaceVideoProvider, lang: DigitalContactLang): string {
  const copy = getFaceToFaceCopy(lang);
  if (provider === "google_meet") return copy.opensWithGoogleMeet;
  return copy.opensWithFacetime;
}
