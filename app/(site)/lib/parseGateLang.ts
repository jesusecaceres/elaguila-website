export type GateLang = "es" | "en";

export function parseGateLang(value: string | null | undefined): GateLang {
  return value === "en" ? "en" : "es";
}
