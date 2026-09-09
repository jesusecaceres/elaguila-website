/**
 * LEO-12 project config — credentials + safe diagnostics (never expose tokens).
 */
import "server-only";

import {
  LEO_GITHUB_ALLOWED_REPO,
  LEO_VERCEL_ALLOWED_PROJECT,
} from "@/app/leo/_lib/leoToolRegistry";
import type { LeoProjectConfigDiagnostic } from "@/app/leo/_lib/leoTypes";

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

export function getLeoVercelTeamId(): string | null {
  return process.env.LEO_VERCEL_TEAM_ID?.trim() || process.env.VERCEL_TEAM_ID?.trim() || null;
}

export function getLeoVercelProjectId(): string | null {
  return (
    process.env.LEO_VERCEL_PROJECT_ID?.trim() || process.env.VERCEL_PROJECT_ID?.trim() || null
  );
}

/**
 * Safe configuration diagnostic — booleans and allowlist names only.
 * Never returns token values, prefixes, or authorization headers.
 */
export function getLeoProjectConfigDiagnostic(): LeoProjectConfigDiagnostic {
  const githubConnector = isLeoGithubConfigured();
  const vercelConnector = isLeoVercelConfigured();
  const vercelTeam = Boolean(getLeoVercelTeamId());
  const vercelProject = Boolean(getLeoVercelProjectId());
  return {
    github: {
      configured: githubConnector,
      connectorConnected: githubConnector,
      projectIntelligenceConfigured: githubConnector,
      repositoryAllowlisted: true,
      allowlistedRepo: LEO_GITHUB_ALLOWED_REPO.fullName,
    },
    vercel: {
      configured: vercelConnector,
      connectorConnected: vercelConnector,
      projectIntelligenceConfigured: vercelConnector && vercelTeam && vercelProject,
      teamIdAvailable: vercelTeam,
      projectIdAvailable: vercelProject,
      projectAllowlisted: true,
      allowlistedProject: LEO_VERCEL_ALLOWED_PROJECT.name,
    },
    requiredEnvNames: [
      "LEO_GITHUB_TOKEN",
      "LEO_VERCEL_TOKEN",
      "VERCEL_TOKEN",
      "LEO_VERCEL_TEAM_ID",
      "LEO_VERCEL_PROJECT_ID",
    ] as const,
  };
}
