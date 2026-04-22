/**
 * Browser-side Supabase prerequisites for En Venta publish/discovery.
 * Does not validate secrets server-side; surfaces missing public config for honest QA.
 */
export function getEnVentaSupabaseBrowserEnvIssues(): string[] {
  const issues: string[] = [];
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  if (!url) issues.push("NEXT_PUBLIC_SUPABASE_URL is empty");
  if (!key) issues.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is empty");
  if (url && !/^https?:\/\//i.test(url)) issues.push("NEXT_PUBLIC_SUPABASE_URL does not look like a URL");
  return issues;
}
