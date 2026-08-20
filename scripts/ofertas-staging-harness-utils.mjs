export function blockUnlessExplicitlyAuthorized(name) {
  const env = String(process.env.OFERTAS_STAGING_EXECUTION_ENV ?? "").trim();
  const allow = process.env.OFERTAS_STAGING_EXECUTE === "1";
  const origin = String(process.env.NEXT_PUBLIC_SITE_URL ?? "").trim();
  if (!allow || env !== "staging" || /production|prod|leonixmedia\.com$/i.test(origin)) {
    console.log(`BLOCKED — STAGING EXECUTION NOT AUTHORIZED: ${name}`);
    console.log("No network call. No DB call. No Stripe call. No Gemini call. No storage call. No browser action.");
    process.exit(0);
  }
  console.log(`AUTHORIZED STAGING HARNESS PLACEHOLDER: ${name}`);
  console.log("Package 9 defines the harness contract only; real execution remains a future controlled staging step.");
}
