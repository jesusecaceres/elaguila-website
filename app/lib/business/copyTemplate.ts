/** Tiny `{token}` interpolation for bounded ES/EN copy templates — no i18n library in this repo. */
export function fillTemplate(template: string, vars: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));
}
