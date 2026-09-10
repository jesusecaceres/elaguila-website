/**
 * LEO-21D — Pure plain-text Gmail reply MIME → base64url raw.
 * No network. No secrets. Header injection protected (reject CR/LF in headers).
 */

export type LeoGmailReplyMimeInput = {
  from: string;
  to: string;
  subject: string;
  body: string;
  inReplyTo: string;
  references: string;
};

export type LeoGmailReplyMimeBuildResult =
  | { ok: true; rawBase64Url: string }
  | { ok: false; error: "HEADER_INJECTION" | "MISSING_FIELD" | "BODY_TOO_LARGE" };

const MAX_BODY_CHARS = 50_000;

function hasCrLf(v: string): boolean {
  return /[\r\n]/.test(v);
}

function encodeBase64Url(bytes: Buffer): string {
  return bytes
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

/**
 * Build RFC822 plain-text message and return Gmail API `raw` (base64url).
 */
export function buildLeoGmailReplyMimeRaw(
  input: LeoGmailReplyMimeInput,
): LeoGmailReplyMimeBuildResult {
  const from = input.from?.trim() ?? "";
  const to = input.to?.trim() ?? "";
  const subject = input.subject?.trim() ?? "";
  const inReplyTo = input.inReplyTo?.trim() ?? "";
  const references = input.references?.trim() ?? "";
  const body = typeof input.body === "string" ? input.body : "";

  if (!from || !to || !subject || !inReplyTo || !references || !body.trim()) {
    return { ok: false, error: "MISSING_FIELD" };
  }
  if (
    hasCrLf(from) ||
    hasCrLf(to) ||
    hasCrLf(subject) ||
    hasCrLf(inReplyTo) ||
    hasCrLf(references)
  ) {
    return { ok: false, error: "HEADER_INJECTION" };
  }
  if (body.length > MAX_BODY_CHARS) {
    return { ok: false, error: "BODY_TOO_LARGE" };
  }

  const normalizedBody = body.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const mime =
    `From: ${from}\r\n` +
    `To: ${to}\r\n` +
    `Subject: ${subject}\r\n` +
    `In-Reply-To: ${inReplyTo}\r\n` +
    `References: ${references}\r\n` +
    `MIME-Version: 1.0\r\n` +
    `Content-Type: text/plain; charset="UTF-8"\r\n` +
    `Content-Transfer-Encoding: 7bit\r\n` +
    `\r\n` +
    `${normalizedBody.replace(/\n/g, "\r\n")}`;

  return { ok: true, rawBase64Url: encodeBase64Url(Buffer.from(mime, "utf8")) };
}
