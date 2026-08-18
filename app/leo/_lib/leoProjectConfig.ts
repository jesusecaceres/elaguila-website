/**
 * LEO-11 project credential config — server-only, never logged/returned.
 */
import "server-only";

export function getLeoGithubToken(): string | null {
  const t = process.env.LEO_GITHUB_TOKEN?.trim();
  return t || null;
}

export function isLeoGithubConfigured(): boolean {
  return Boolean(getLeoGithubToken());
}

export function getLeoVercelToken(): string | null {
  const t = process.env.LEO_VERCEL_TOKEN?.trim() || process.env.VERCEL_TOKEN?.trim();
  return t || null;
}

export function isLeoVercelConfigured(): boolean {
  return Boolean(getLeoVercelToken());
}

/** Optional team/project ids — never invent; used only when present. */
export function getLeoVercelTeamId(): string | null {
  return process.env.LEO_VERCEL_TEAM_ID?.trim() || process.env.VERCEL_TEAM_ID?.trim() || null;
}

export function getLeoVercelProjectId(): string | null {
  return (
    process.env.LEO_VERCEL_PROJECT_ID?.trim() || process.env.VERCEL_PROJECT_ID?.trim() || null
  );
}
