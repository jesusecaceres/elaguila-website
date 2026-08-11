import type { DigitalContactLang } from "../digitalContactTypes";
import type { HumanConnectionChannelType } from "./channelTypes";

export type ConnectionChannelLabels = Record<
  Exclude<HumanConnectionChannelType, "zoom">,
  string
>;

const ES: ConnectionChannelLabels & { connectYourWay: string; connectYourWayBody: string } = {
  connectYourWay: "Conéctate como prefieras",
  connectYourWayBody: "Usa la opción que te resulte más fácil.",
  phone: "Llamar",
  sms: "Mensaje",
  whatsapp: "WhatsApp",
  facetime: "FaceTime",
  google_meet: "Google Meet",
  browser_video: "Hablar por video",
  email: "Correo",
  schedule_request: "Programar una conversación",
  teams: "Microsoft Teams",
  messenger: "Messenger",
  instagram: "Instagram",
};

const EN: ConnectionChannelLabels & { connectYourWay: string; connectYourWayBody: string } = {
  connectYourWay: "Connect your way",
  connectYourWayBody: "Use whichever option is easiest for you.",
  phone: "Call",
  sms: "Text",
  whatsapp: "WhatsApp",
  facetime: "FaceTime",
  google_meet: "Google Meet",
  browser_video: "Talk by video",
  email: "Email",
  schedule_request: "Schedule a conversation",
  teams: "Microsoft Teams",
  messenger: "Messenger",
  instagram: "Instagram",
};

export function getConnectionChannelCopy(lang: DigitalContactLang) {
  return lang === "en" ? EN : ES;
}

export function labelForChannel(type: HumanConnectionChannelType, lang: DigitalContactLang): string {
  const copy = getConnectionChannelCopy(lang);
  if (type in copy) return copy[type as keyof typeof copy] as string;
  return type;
}
