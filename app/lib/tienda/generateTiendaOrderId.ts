import { randomBytes } from "crypto";

export function generateTiendaOrderId(): string {
  const t = Date.now().toString(36).toUpperCase();
  const r = randomBytes(4).toString("hex").toUpperCase();
  return `LX-TND-${t}-${r}`;
}
