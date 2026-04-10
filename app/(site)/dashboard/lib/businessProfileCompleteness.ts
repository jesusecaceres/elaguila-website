/**
 * Honest business-profile completeness from fields we can read today (no invented scores).
 */
import type { DashboardProfileRow } from "./dashboardProfile";

export type BusinessCompletenessResult = {
  score: number;
  max: number;
  missing: string[];
  recommendations: string[];
};

export function computeBusinessCompleteness(
  profile: Partial<DashboardProfileRow> | null,
  opts: { lang: "es" | "en"; whatsappHint?: string | null }
): BusinessCompletenessResult {
  const L =
    opts.lang === "es"
      ? {
          name: "Nombre visible",
          phone: "Teléfono",
          city: "Ciudad",
          wa: "WhatsApp (metadata)",
          tier: "Tipo de cuenta / plan",
        }
      : {
          name: "Display name",
          phone: "Phone",
          city: "Home city",
          wa: "WhatsApp (metadata)",
          tier: "Account type / plan",
        };

  const checks: Array<{ ok: boolean; key: string; rec: string }> = [
    {
      ok: Boolean(profile?.display_name?.trim()),
      key: L.name,
      rec: opts.lang === "es" ? "Completa tu nombre en Perfil." : "Add your name in Profile.",
    },
    {
      ok: Boolean(profile?.phone?.trim()),
      key: L.phone,
      rec: opts.lang === "es" ? "Añade un teléfono de contacto." : "Add a contact phone.",
    },
    {
      ok: Boolean(profile?.home_city?.trim()),
      key: L.city,
      rec: opts.lang === "es" ? "Indica tu ciudad principal." : "Set your primary city.",
    },
    {
      ok: Boolean(opts.whatsappHint?.trim()),
      key: L.wa,
      rec: opts.lang === "es" ? "Configura WhatsApp en tu cuenta (metadata)." : "Set WhatsApp on your account (metadata).",
    },
    {
      ok: Boolean(profile?.membership_tier?.trim()) || Boolean(profile?.account_type?.trim()),
      key: L.tier,
      rec: opts.lang === "es" ? "Revisa plan y tipo de cuenta." : "Review plan and account type.",
    },
  ];

  const max = checks.length;
  const score = checks.filter((c) => c.ok).length;
  const missing = checks.filter((c) => !c.ok).map((c) => c.key);
  const recommendations = checks.filter((c) => !c.ok).map((c) => c.rec);

  return { score, max, missing, recommendations };
}
