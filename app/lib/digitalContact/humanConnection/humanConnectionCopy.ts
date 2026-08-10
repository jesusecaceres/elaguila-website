import type { DigitalContactLang } from "../digitalContactTypes";

export type HumanConnectionCopy = {
  videoCta: string;
  videoPrecallTitle: string;
  videoPrecallBody: string;
  videoFirstName: string;
  videoReasonOptional: string;
  videoPrivacyNotice: string;
  videoProviderNotice: string;
  videoStart: string;
  videoCancel: string;
  videoRequesting: string;
  videoReady: string;
  videoReadyCta: string;
  videoWaiting: string;
  videoLaunched: string;
  videoNoAnswerTitle: string;
  videoNoAnswerBody: string;
  videoFailedTitle: string;
  videoFailedBody: string;
  videoExpiredTitle: string;
  videoExpiredBody: string;
  videoMicDenied: string;
  scheduleCta: string;
  scheduleTitle: string;
  scheduleBody: string;
  scheduleDisclaimer: string;
  scheduleName: string;
  scheduleContactMethod: string;
  scheduleMethodEmail: string;
  scheduleMethodPhone: string;
  scheduleMethodWhatsapp: string;
  scheduleEmail: string;
  schedulePhone: string;
  schedulePreferredTime: string;
  schedulePreferredTimePlaceholder: string;
  scheduleMessage: string;
  scheduleSubmit: string;
  scheduleSubmitting: string;
  scheduleSuccess: string;
  scheduleError: string;
  backupVideoCta: string;
  fallbackCall: string;
  fallbackWhatsapp: string;
  fallbackSms: string;
  fallbackEmail: string;
  close: string;
};

const ES: HumanConnectionCopy = {
  videoCta: "Hablar por video",
  videoPrecallTitle: "Conexión por video",
  videoPrecallBody: "Antes de conectar, dinos cómo llamarte. La sesión es temporal y no se graba.",
  videoFirstName: "Nombre",
  videoReasonOptional: "Motivo de la visita (opcional)",
  videoPrivacyNotice:
    "No grabamos video ni audio. El proveedor puede pedir permiso de cámara y micrófono.",
  videoProviderNotice: "La videollamada la facilita un proveedor externo de salas temporales.",
  videoStart: "Iniciar video",
  videoCancel: "Cancelar",
  videoRequesting: "Preparando la conexión…",
  videoReady: "Tu sala está lista. Únete cuando quieras.",
  videoReadyCta: "Unirme ahora",
  videoWaiting: "Esperando respuesta…",
  videoLaunched: "Abrimos la sala de video. Si no puedes unirte, usa otra forma de contacto abajo.",
  videoNoAnswerTitle: "No pudimos conectar por video en este momento.",
  videoNoAnswerBody: "Todavía podemos ayudarte. Elige otra forma de contacto.",
  videoFailedTitle: "No pudimos iniciar el video.",
  videoFailedBody: "Todavía podemos ayudarte por llamada, mensaje o solicitud de conversación.",
  videoExpiredTitle: "La sala de video expiró.",
  videoExpiredBody: "Todavía podemos ayudarte. Elige otra forma de contacto.",
  videoMicDenied:
    "Si el navegador bloquea cámara o micrófono, puedes usar llamada, WhatsApp o mensaje.",
  scheduleCta: "Programar una conversación",
  scheduleTitle: "Solicitar una conversación",
  scheduleBody: "Cuéntanos cuándo te conviene. Esto es una solicitud — no una cita confirmada.",
  scheduleDisclaimer:
    "Enviaremos tu solicitud al equipo. Un horario confirmado llega solo cuando alguien te responde.",
  scheduleName: "Nombre",
  scheduleContactMethod: "Cómo prefieres que te contactemos",
  scheduleMethodEmail: "Correo",
  scheduleMethodPhone: "Teléfono",
  scheduleMethodWhatsapp: "WhatsApp",
  scheduleEmail: "Correo electrónico",
  schedulePhone: "Teléfono",
  schedulePreferredTime: "Horario o preferencia",
  schedulePreferredTimePlaceholder: "Ej. mañana por la tarde, jueves después de las 2 PM",
  scheduleMessage: "Mensaje (opcional)",
  scheduleSubmit: "Enviar solicitud",
  scheduleSubmitting: "Enviando…",
  scheduleSuccess: "Recibimos tu solicitud. Te contactaremos para confirmar un horario.",
  scheduleError: "No pudimos enviar la solicitud. Intenta de nuevo o usa otra forma de contacto.",
  backupVideoCta: "Intentar video con",
  fallbackCall: "Llamar",
  fallbackWhatsapp: "WhatsApp",
  fallbackSms: "Mensaje",
  fallbackEmail: "Correo",
  close: "Cerrar",
};

const EN: HumanConnectionCopy = {
  videoCta: "Talk by video",
  videoPrecallTitle: "Video connection",
  videoPrecallBody: "Before we connect, tell us what to call you. The session is temporary and is not recorded.",
  videoFirstName: "First name",
  videoReasonOptional: "Reason for visit (optional)",
  videoPrivacyNotice:
    "We do not record video or audio. The provider may ask for camera and microphone permission.",
  videoProviderNotice: "Video is provided by an external ephemeral-room service.",
  videoStart: "Start video",
  videoCancel: "Cancel",
  videoRequesting: "Preparing the connection…",
  videoReady: "Your room is ready. Join when you’re ready.",
  videoReadyCta: "Join now",
  videoWaiting: "Waiting for a response…",
  videoLaunched: "We opened the video room. If you can’t join, use another way to reach us below.",
  videoNoAnswerTitle: "We couldn’t connect by video right now.",
  videoNoAnswerBody: "We can still help. Choose another way to reach us.",
  videoFailedTitle: "We couldn’t start video.",
  videoFailedBody: "We can still help by call, message, or a conversation request.",
  videoExpiredTitle: "The video room expired.",
  videoExpiredBody: "We can still help. Choose another way to reach us.",
  videoMicDenied:
    "If your browser blocks camera or microphone, you can still call, WhatsApp, or text.",
  scheduleCta: "Schedule a conversation",
  scheduleTitle: "Request a conversation",
  scheduleBody: "Tell us when works for you. This is a request — not a confirmed appointment.",
  scheduleDisclaimer:
    "We’ll send your request to the team. A confirmed time comes only when someone replies.",
  scheduleName: "Name",
  scheduleContactMethod: "How should we reach you?",
  scheduleMethodEmail: "Email",
  scheduleMethodPhone: "Phone",
  scheduleMethodWhatsapp: "WhatsApp",
  scheduleEmail: "Email",
  schedulePhone: "Phone",
  schedulePreferredTime: "Preferred time or preference",
  schedulePreferredTimePlaceholder: "e.g. tomorrow afternoon, Thursday after 2 PM",
  scheduleMessage: "Message (optional)",
  scheduleSubmit: "Send request",
  scheduleSubmitting: "Sending…",
  scheduleSuccess: "We received your request. We’ll contact you to confirm a time.",
  scheduleError: "We couldn’t send the request. Try again or use another way to reach us.",
  backupVideoCta: "Try video with",
  fallbackCall: "Call",
  fallbackWhatsapp: "WhatsApp",
  fallbackSms: "Text",
  fallbackEmail: "Email",
  close: "Close",
};

export function getHumanConnectionCopy(lang: DigitalContactLang): HumanConnectionCopy {
  return lang === "en" ? EN : ES;
}
