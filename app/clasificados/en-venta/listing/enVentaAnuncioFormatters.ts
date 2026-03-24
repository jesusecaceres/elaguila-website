type Lang = "es" | "en";

export function formatPostedAgo(createdAt: string | null | undefined, lang: Lang): string {
  if (!createdAt) return "";
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return "";
  const diffMins = Math.floor((Date.now() - created) / (1000 * 60));
  const diffHours = Math.floor((Date.now() - created) / (1000 * 60 * 60));
  const diffDays = Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24));
  if (lang === "es") {
    if (diffMins < 60) return diffMins <= 1 ? "Publicado hace 1 minuto" : `Publicado hace ${diffMins} minutos`;
    if (diffHours < 24) return diffHours === 1 ? "Publicado hace 1 hora" : `Publicado hace ${diffHours} horas`;
    return diffDays === 1 ? "Publicado hace 1 día" : `Publicado hace ${diffDays} días`;
  }
  if (diffMins < 60) return diffMins <= 1 ? "Posted 1 minute ago" : `Posted ${diffMins} minutes ago`;
  if (diffHours < 24) return diffHours === 1 ? "Posted 1 hour ago" : `Posted ${diffHours} hours ago`;
  return diffDays === 1 ? "Posted 1 day ago" : `Posted ${diffDays} days ago`;
}
