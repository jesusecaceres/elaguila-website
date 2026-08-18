/**
 * LEO-11 Vercel project adapter — server-only, read-only, allowlisted project.
 * Missing token → NOT_CONFIGURED. Never exposes token or raw error bodies.
 */
import "server-only";

import {
  getLeoVercelProjectId,
  getLeoVercelTeamId,
  getLeoVercelToken,
} from "@/app/leo/_lib/leoProjectConfig";
import {
  LEO_PROJECT_BOUNDS,
  LEO_VERCEL_ALLOWED_PROJECT,
} from "@/app/leo/_lib/leoToolRegistry";
import type { LeoDeploymentSnapshot, LeoToolAvailability } from "@/app/leo/_lib/leoTypes";

export type LeoVercelProjectReadResult =
  | {
      ok: true;
      projectName: string | null;
      deployments: LeoDeploymentSnapshot[];
      availability: LeoToolAvailability;
      limitations: string[];
    }
  | {
      ok: false;
      availability: LeoToolAvailability;
      limitations: string[];
      errorCode: string;
    };

async function vercelGet(path: string, token: string): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), LEO_PROJECT_BOUNDS.fetchTimeoutMs);
  try {
    return await fetch(`https://api.vercel.com${path}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      signal: ctrl.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(t);
  }
}

function qs(params: Record<string, string | null | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) sp.set(k, v);
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/**
 * Read recent deployments for allowlisted leonix-media project.
 * GET only — never POST deploy/redeploy/promote.
 */
export async function readLeoVercelDeployments(): Promise<LeoVercelProjectReadResult> {
  const token = getLeoVercelToken();
  if (!token) {
    return {
      ok: false,
      availability: "NOT_CONFIGURED",
      limitations: ["Vercel project intelligence is not configured (LEO_VERCEL_TOKEN missing)."],
      errorCode: "VERCEL_NOT_CONFIGURED",
    };
  }

  const limitations: string[] = [
    `Allowlisted project: ${LEO_VERCEL_ALLOWED_PROJECT.name}.`,
    "Read-only — no deploy/redeploy/promote/rollback/env writes.",
    "Deployment READY means platform/build state READY — not full application or system health.",
  ];
  const teamId = getLeoVercelTeamId();
  const projectId = getLeoVercelProjectId();

  try {
    let projectName: string | null = LEO_VERCEL_ALLOWED_PROJECT.name;
    let resolvedProjectId = projectId;

    if (!resolvedProjectId) {
      const projectsRes = await vercelGet(
        `/v9/projects${qs({
          teamId,
          search: LEO_VERCEL_ALLOWED_PROJECT.name,
          limit: "10",
        })}`,
        token,
      );
      if (projectsRes.status === 401 || projectsRes.status === 403) {
        return {
          ok: false,
          availability: "UNAVAILABLE",
          limitations: [...limitations, "Vercel API authorization failed."],
          errorCode: "VERCEL_AUTH_FAILED",
        };
      }
      if (projectsRes.status === 429) {
        return {
          ok: false,
          availability: "UNAVAILABLE",
          limitations: [...limitations, "Vercel API rate limit reached."],
          errorCode: "VERCEL_RATE_LIMIT",
        };
      }
      if (!projectsRes.ok) {
        return {
          ok: false,
          availability: "UNAVAILABLE",
          limitations: [...limitations, "Vercel project lookup failed."],
          errorCode: "VERCEL_PROJECT_LOOKUP_FAILED",
        };
      }
      const body = (await projectsRes.json()) as {
        projects?: Array<{ id?: string; name?: string }>;
      };
      const match = (body.projects ?? []).find(
        (p) => p.name === LEO_VERCEL_ALLOWED_PROJECT.name,
      );
      if (!match?.id) {
        return {
          ok: false,
          availability: "UNAVAILABLE",
          limitations: [...limitations, "Allowlisted Vercel project not found with current credentials."],
          errorCode: "VERCEL_PROJECT_NOT_FOUND",
        };
      }
      resolvedProjectId = match.id;
      projectName = match.name ?? projectName;
    }

    const depRes = await vercelGet(
      `/v6/deployments${qs({
        projectId: resolvedProjectId,
        teamId,
        limit: String(LEO_PROJECT_BOUNDS.maxRecentDeployments),
      })}`,
      token,
    );

    if (depRes.status === 401 || depRes.status === 403) {
      return {
        ok: false,
        availability: "UNAVAILABLE",
        limitations: [...limitations, "Vercel deployments authorization failed."],
        errorCode: "VERCEL_AUTH_FAILED",
      };
    }
    if (depRes.status === 429) {
      return {
        ok: false,
        availability: "PARTIAL",
        limitations: [...limitations, "Vercel deployments rate-limited."],
        errorCode: "VERCEL_RATE_LIMIT",
      };
    }
    if (!depRes.ok) {
      return {
        ok: false,
        availability: "UNAVAILABLE",
        limitations: [...limitations, "Vercel deployments request failed."],
        errorCode: "VERCEL_DEPLOYMENTS_FAILED",
      };
    }

    const depBody = (await depRes.json()) as {
      deployments?: Array<{
        uid?: string;
        id?: string;
        url?: string;
        name?: string;
        state?: string;
        readyState?: string;
        target?: string | null;
        meta?: { githubCommitSha?: string; githubCommitRef?: string };
        createdAt?: number;
        created?: number;
      }>;
    };

    const deployments: LeoDeploymentSnapshot[] = (depBody.deployments ?? [])
      .slice(0, LEO_PROJECT_BOUNDS.maxRecentDeployments)
      .map((d) => {
        const deploymentId = d.uid || d.id || "unknown";
        const createdMs = d.createdAt ?? d.created ?? null;
        return {
          provider: "VERCEL" as const,
          projectName: d.name ?? projectName,
          deploymentId,
          url: d.url ? `https://${d.url}` : null,
          state: d.state ?? null,
          target: d.target ?? null,
          gitBranch: d.meta?.githubCommitRef ?? null,
          gitCommitSha: d.meta?.githubCommitSha ?? null,
          createdAt: createdMs ? new Date(createdMs).toISOString() : null,
          readyState: d.readyState ?? d.state ?? null,
          limitations: [
            "READY/readyState is platform deployment state only — not a claim that the site or database is healthy.",
          ],
        };
      });

    return {
      ok: true,
      projectName,
      deployments,
      availability: deployments.length > 0 ? "AVAILABLE" : "PARTIAL",
      limitations,
    };
  } catch {
    return {
      ok: false,
      availability: "UNAVAILABLE",
      limitations: [...limitations, "Vercel request failed or timed out."],
      errorCode: "VERCEL_REQUEST_FAILED",
    };
  }
}
