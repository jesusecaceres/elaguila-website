/** US-style display formatting for Empleos contact phones — hrefs use digits only. */

export function empleosPhoneDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

/** Display as `(408) 802-1531` for US 10-digit; `+1 (408) 802-1531` for 11-digit leading 1. */
export function formatEmpleosPhoneDisplay(raw: string): string {
  const d = empleosPhoneDigits(raw);
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  if (d.length === 11 && d[0] === "1") {
    return `+1 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  }
  return raw.trim();
}
