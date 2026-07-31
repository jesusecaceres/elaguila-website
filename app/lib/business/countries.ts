/**
 * Global country list (Gate BCO-3R Phase 7). ISO 3166-1 alpha-2 codes with ES/EN display
 * names. Country is deliberately not a DB CHECK constraint (would require a migration every
 * time ISO adds/renames an entry) — validated at the application layer via this list instead.
 */
export type CountryOption = { code: string; es: string; en: string };

export const COUNTRIES: readonly CountryOption[] = [
  { code: "US", es: "Estados Unidos", en: "United States" },
  { code: "MX", es: "México", en: "Mexico" },
  { code: "CA", es: "Canadá", en: "Canada" },
  { code: "AR", es: "Argentina", en: "Argentina" },
  { code: "BO", es: "Bolivia", en: "Bolivia" },
  { code: "BR", es: "Brasil", en: "Brazil" },
  { code: "CL", es: "Chile", en: "Chile" },
  { code: "CO", es: "Colombia", en: "Colombia" },
  { code: "CR", es: "Costa Rica", en: "Costa Rica" },
  { code: "CU", es: "Cuba", en: "Cuba" },
  { code: "DO", es: "República Dominicana", en: "Dominican Republic" },
  { code: "EC", es: "Ecuador", en: "Ecuador" },
  { code: "SV", es: "El Salvador", en: "El Salvador" },
  { code: "GT", es: "Guatemala", en: "Guatemala" },
  { code: "HN", es: "Honduras", en: "Honduras" },
  { code: "NI", es: "Nicaragua", en: "Nicaragua" },
  { code: "PA", es: "Panamá", en: "Panama" },
  { code: "PY", es: "Paraguay", en: "Paraguay" },
  { code: "PE", es: "Perú", en: "Peru" },
  { code: "PR", es: "Puerto Rico", en: "Puerto Rico" },
  { code: "UY", es: "Uruguay", en: "Uruguay" },
  { code: "VE", es: "Venezuela", en: "Venezuela" },
  { code: "ES", es: "España", en: "Spain" },
  { code: "PT", es: "Portugal", en: "Portugal" },
  { code: "GB", es: "Reino Unido", en: "United Kingdom" },
  { code: "IE", es: "Irlanda", en: "Ireland" },
  { code: "FR", es: "Francia", en: "France" },
  { code: "DE", es: "Alemania", en: "Germany" },
  { code: "IT", es: "Italia", en: "Italy" },
  { code: "NL", es: "Países Bajos", en: "Netherlands" },
  { code: "BE", es: "Bélgica", en: "Belgium" },
  { code: "CH", es: "Suiza", en: "Switzerland" },
  { code: "AT", es: "Austria", en: "Austria" },
  { code: "SE", es: "Suecia", en: "Sweden" },
  { code: "NO", es: "Noruega", en: "Norway" },
  { code: "DK", es: "Dinamarca", en: "Denmark" },
  { code: "FI", es: "Finlandia", en: "Finland" },
  { code: "PL", es: "Polonia", en: "Poland" },
  { code: "GR", es: "Grecia", en: "Greece" },
  { code: "RO", es: "Rumania", en: "Romania" },
  { code: "CZ", es: "República Checa", en: "Czech Republic" },
  { code: "HU", es: "Hungría", en: "Hungary" },
  { code: "RU", es: "Rusia", en: "Russia" },
  { code: "UA", es: "Ucrania", en: "Ukraine" },
  { code: "TR", es: "Turquía", en: "Turkey" },
  { code: "IL", es: "Israel", en: "Israel" },
  { code: "SA", es: "Arabia Saudita", en: "Saudi Arabia" },
  { code: "AE", es: "Emiratos Árabes Unidos", en: "United Arab Emirates" },
  { code: "EG", es: "Egipto", en: "Egypt" },
  { code: "MA", es: "Marruecos", en: "Morocco" },
  { code: "NG", es: "Nigeria", en: "Nigeria" },
  { code: "ZA", es: "Sudáfrica", en: "South Africa" },
  { code: "KE", es: "Kenia", en: "Kenya" },
  { code: "GH", es: "Ghana", en: "Ghana" },
  { code: "IN", es: "India", en: "India" },
  { code: "PK", es: "Pakistán", en: "Pakistan" },
  { code: "BD", es: "Bangladés", en: "Bangladesh" },
  { code: "CN", es: "China", en: "China" },
  { code: "JP", es: "Japón", en: "Japan" },
  { code: "KR", es: "Corea del Sur", en: "South Korea" },
  { code: "PH", es: "Filipinas", en: "Philippines" },
  { code: "VN", es: "Vietnam", en: "Vietnam" },
  { code: "TH", es: "Tailandia", en: "Thailand" },
  { code: "ID", es: "Indonesia", en: "Indonesia" },
  { code: "MY", es: "Malasia", en: "Malaysia" },
  { code: "SG", es: "Singapur", en: "Singapore" },
  { code: "AU", es: "Australia", en: "Australia" },
  { code: "NZ", es: "Nueva Zelanda", en: "New Zealand" },
  { code: "HT", es: "Haití", en: "Haiti" },
  { code: "JM", es: "Jamaica", en: "Jamaica" },
  { code: "TT", es: "Trinidad y Tobago", en: "Trinidad and Tobago" },
  { code: "BZ", es: "Belice", en: "Belize" },
  { code: "GY", es: "Guyana", en: "Guyana" },
  { code: "SR", es: "Surinam", en: "Suriname" },
  { code: "OTHER", es: "Otro país", en: "Other country" },
] as const;

export const COUNTRY_CODES: readonly string[] = COUNTRIES.map((c) => c.code);

export function isValidCountryCode(code: string | null | undefined): boolean {
  if (!code) return false;
  return COUNTRY_CODES.includes(code);
}

export function countryLabel(code: string, lang: "es" | "en"): string {
  const found = COUNTRIES.find((c) => c.code === code);
  return found ? found[lang] : code;
}
