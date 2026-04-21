/** Canonical Leonix Clasificados publish chooser (hub). */
export function leonixClasificadosPublishHubHref(lang: "es" | "en"): string {
  const qs = new URLSearchParams();
  qs.set("lang", lang);
  return `/clasificados/publicar?${qs.toString()}`;
}
