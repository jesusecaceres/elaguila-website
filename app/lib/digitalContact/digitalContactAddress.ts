import type { DigitalContactAddress } from "./digitalContactTypes";

export function formatDigitalContactAddressLines(address: DigitalContactAddress): string[] {
  const lines: string[] = [address.line1];
  if (address.line2) lines.push(address.line2);
  lines.push(`${address.city}, ${address.state} ${address.postalCode}`);
  return lines;
}

export function formatDigitalContactAddressSingleLine(address: DigitalContactAddress): string {
  return formatDigitalContactAddressLines(address).join(", ");
}

/** Google Maps search URL — safe for `directions` CTA intents and the executive card's Office row. */
export function digitalContactMapsUrl(address: DigitalContactAddress): string {
  const query = formatDigitalContactAddressSingleLine(address);
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
