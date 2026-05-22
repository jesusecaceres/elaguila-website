/**
 * Server-only logging for outbound email failures (no secrets, no message bodies).
 */
export function logLeonixEmailFailure(scope: string, message: string): void {
  const reason = message.includes("not configured") ? "not_configured" : "send_failed";
  console.error(`[leonix-email] scope=${scope} reason=${reason} detail=${message.slice(0, 240)}`);
}
