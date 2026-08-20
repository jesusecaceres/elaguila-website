/**
 * Recursos Intake OS — Gate 3 URL safety validation. Pure, no network calls, fully testable.
 * Every hop of a redirect chain must pass this same check (see urlFetch.ts) — validating only
 * the initial URL is not sufficient SSRF protection.
 */

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

/** RFC1918 / loopback / link-local / CGNAT / metadata-adjacent IPv4 ranges. */
const BLOCKED_IPV4_RANGES: Array<[number, number]> = [
  [ipToInt("0.0.0.0"), ipToInt("0.255.255.255")],
  [ipToInt("10.0.0.0"), ipToInt("10.255.255.255")],
  [ipToInt("100.64.0.0"), ipToInt("100.127.255.255")], // CGNAT
  [ipToInt("127.0.0.0"), ipToInt("127.255.255.255")], // loopback
  [ipToInt("169.254.0.0"), ipToInt("169.254.255.255")], // link-local incl. cloud metadata (169.254.169.254)
  [ipToInt("172.16.0.0"), ipToInt("172.31.255.255")],
  [ipToInt("192.0.0.0"), ipToInt("192.0.0.255")],
  [ipToInt("192.168.0.0"), ipToInt("192.168.255.255")],
  [ipToInt("198.18.0.0"), ipToInt("198.19.255.255")], // benchmark
  [ipToInt("224.0.0.0"), ipToInt("255.255.255.255")], // multicast/reserved
];

function ipToInt(ip: string): number {
  const parts = ip.split(".").map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function isIpv4(host: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(host);
}

function isBlockedIpv4(host: string): boolean {
  if (!isIpv4(host)) return false;
  const parts = host.split(".").map(Number);
  if (parts.some((p) => p < 0 || p > 255 || Number.isNaN(p))) return true; // malformed — reject closed
  const n = ipToInt(host);
  return BLOCKED_IPV4_RANGES.some(([lo, hi]) => n >= lo && n <= hi);
}

/** IPv6 loopback (::1), unique-local (fc00::/7), and link-local (fe80::/10). */
function isBlockedIpv6(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "::1" || h === "::") return true;
  if (/^f[cd][0-9a-f]{2}:/.test(h)) return true; // fc00::/7
  if (/^fe[89ab][0-9a-f]:/.test(h)) return true; // fe80::/10
  return false;
}

const BLOCKED_HOSTNAME_RE = /^(localhost|.*\.local|.*\.internal|metadata\.google\.internal)$/i;

export type UrlSafetyResult = { ok: true; url: URL } | { ok: false; reason: string };

/**
 * Validates a single URL/hop for SSRF safety. Does NOT resolve DNS — that happens at fetch time
 * (see urlFetch.ts), where the resolved IP is checked again before the request is sent, since a
 * hostname can pass this check yet resolve to a private IP (DNS rebinding).
 */
export function validateIntakeUrl(raw: string): UrlSafetyResult {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return { ok: false, reason: "URL vacía." };
  if (trimmed.length > 2048) return { ok: false, reason: "URL demasiado larga." };

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { ok: false, reason: "URL con formato inválido." };
  }

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    return { ok: false, reason: `Protocolo no permitido: ${url.protocol} (solo http/https).` };
  }

  const hostname = url.hostname.toLowerCase();
  if (!hostname) return { ok: false, reason: "URL sin host." };
  if (BLOCKED_HOSTNAME_RE.test(hostname)) {
    return { ok: false, reason: "Host bloqueado (localhost/interno)." };
  }
  if (isBlockedIpv4(hostname)) {
    return { ok: false, reason: "Dirección IPv4 privada/reservada bloqueada." };
  }
  if (hostname.includes(":") && isBlockedIpv6(hostname)) {
    return { ok: false, reason: "Dirección IPv6 privada/reservada bloqueada." };
  }
  if (url.username || url.password) {
    return { ok: false, reason: "URL con credenciales embebidas no permitida." };
  }

  return { ok: true, url };
}

/** Re-exported for the fetch layer's post-DNS-resolution recheck. */
export { isBlockedIpv4, isBlockedIpv6 };
