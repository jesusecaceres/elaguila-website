export type ServiciosLeadPreferredContactMethod = "email" | "phone" | "whatsapp";

/** Embeds optional phone + contact preference ahead of the user message (no extra DB columns). */
export function composeServiciosPublicLeadStoredMessage(
  userMessage: string,
  opts: { senderPhone?: string | null; preferredContactMethod?: ServiciosLeadPreferredContactMethod | null },
): string {
  const phone = (opts.senderPhone ?? "").trim().slice(0, 48);
  const pref = opts.preferredContactMethod;
  if (!phone && !pref) return userMessage;
  const lines = ["--- Leonix (servicios lead meta) ---"];
  if (pref) lines.push(`preferred_contact_method: ${pref}`);
  if (phone) lines.push(`sender_phone: ${phone}`);
  lines.push("--- end meta ---", "");
  return `${lines.join("\n")}${userMessage}`;
}
