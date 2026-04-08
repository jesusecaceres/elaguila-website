export type LeonixMarketplaceRulesLang = "es" | "en";

export type LeonixMarketplaceRulesBundle = {
  title: string;
  intro: string;
  rules: readonly string[];
};

const ES: LeonixMarketplaceRulesBundle = {
  title: "Reglas de Leonix (marketplace)",
  intro:
    "Al publicar en LEONIX Clasificados aceptas estas reglas. Leonix debe seguir siendo confiable, claro y apto para toda la familia.",
  rules: [
    "Anuncios reales: describe lo que realmente vendes o ofreces. No anuncios falsos ni engañosos.",
    "Si dice gratis, debe ser gratis de verdad. Sin precios engañosos ni cargos ocultos.",
    "Sin contenido sexual explícito ni productos para adultos; Leonix es un marketplace familiar.",
    "No spam, duplicados abusivos ni estafas. Respeta la ley y a la comunidad.",
    "Sin contenido ilegal, odioso ni que ponga en riesgo a menores. Mantén Leonix seguro y respetuoso.",
  ],
};

const EN: LeonixMarketplaceRulesBundle = {
  title: "Leonix marketplace rules",
  intro:
    "By posting on LEONIX Classifieds you agree to these rules. Leonix must stay trustworthy, clear, and family-appropriate.",
  rules: [
    "Real listings: describe what you actually sell or offer. No fake or misleading ads.",
    "If it says free, it must really be free—no deceptive pricing or hidden fees.",
    "No explicit sexual content or adult products; Leonix is a family-friendly marketplace.",
    "No spam, abusive duplicates, or scams. Follow the law and respect others.",
    "No illegal or hateful content, and nothing that endangers minors. Keep Leonix safe and respectful.",
  ],
};

export function getLeonixMarketplaceRulesCopy(lang: LeonixMarketplaceRulesLang): LeonixMarketplaceRulesBundle {
  return lang === "en" ? EN : ES;
}
