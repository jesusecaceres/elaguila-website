/** Dev-only Supabase write diagnostics for Leonix engagement buttons (no production noise). */

export function formatEngagementWriteErrorForDev(
  base: string,
  err: { code?: string; message?: string } | null | undefined,
): string {
  if (process.env.NODE_ENV !== "development" || !err?.message) return base;
  const code = err.code ?? "?";
  const msg = err.message.slice(0, 140);
  return `${base} [${code}] ${msg}`;
}

export function logEngagementWriteFailure(ctx: {
  table: string;
  op: string;
  listingKeyLen: number;
  hasUser: boolean;
  err?: { code?: string; message?: string } | null;
}) {
  if (process.env.NODE_ENV !== "development") return;
  console.warn("[lx-engagement-write]", {
    table: ctx.table,
    op: ctx.op,
    listingKeyLen: ctx.listingKeyLen,
    hasUser: ctx.hasUser,
    code: ctx.err?.code,
    message: ctx.err?.message?.slice(0, 220),
  });
}
