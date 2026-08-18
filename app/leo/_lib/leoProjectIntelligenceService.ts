/**
 * LEO-11 Project Intelligence Service — combine GitHub + Vercel evidence safely.
 * Exact SHA correlation when available. Never claims full system health.
 */
import "server-only";

import { requireLeoOwnerAccess } from "@/app/leo/_lib/leoAccess";
import { readLeoGithubRepository } from "@/app/leo/_lib/leoGithubProjectAdapter";
import { isLeoGithubConfigured, isLeoVercelConfigured } from "@/app/leo/_lib/leoProjectConfig";
import { readLeoVercelDeployments } from "@/app/leo/_lib/leoVercelProjectAdapter";
import type {
  LeoProjectSnapshot,
} from "@/app/leo/_lib/leoTypes";

const NOT_CLAIMING = [
  "Not claiming site healthy",
  "Not claiming database healthy",
  "Not claiming all systems healthy",
  "Deployment READY is platform/build state only",
] as const;

export type LeoProjectIntelligenceOptions = {
  branch?: string | null;
  nowMs?: number;
};

export async function getLeoProjectSnapshot(
  options: LeoProjectIntelligenceOptions = {},
): Promise<LeoProjectSnapshot> {
  await requireLeoOwnerAccess();
  const generatedAt = new Date(options.nowMs ?? Date.now()).toISOString();
  const limitations: string[] = [];

  let github: LeoProjectSnapshot["github"] = null;
  let vercel: LeoProjectSnapshot["vercel"] = null;

  if (!isLeoGithubConfigured() && !isLeoVercelConfigured()) {
    limitations.push(
      "Neither GitHub nor Vercel project intelligence is configured (LEO_GITHUB_TOKEN / LEO_VERCEL_TOKEN).",
    );
  }

  if (isLeoGithubConfigured()) {
    const g = await readLeoGithubRepository({ branch: options.branch });
    if (g.ok) {
      github = g.snapshot;
      limitations.push(...g.snapshot.limitations);
    } else {
      limitations.push(...g.limitations);
      github = {
        provider: "GITHUB",
        owner: "jesusecaceres",
        name: "elaguila-website",
        fullName: "jesusecaceres/elaguila-website",
        defaultBranch: null,
        branch: options.branch ?? null,
        headSha: null,
        headMessage: null,
        headCommittedAt: null,
        recentCommits: [],
        availability: g.availability,
        limitations: g.limitations,
      };
    }
  } else {
    limitations.push("GitHub: NOT_CONFIGURED.");
  }

  if (isLeoVercelConfigured()) {
    const v = await readLeoVercelDeployments();
    if (v.ok) {
      vercel = {
        projectName: v.projectName,
        deployments: v.deployments,
        availability: v.availability,
        limitations: v.limitations,
      };
      limitations.push(...v.limitations);
    } else {
      limitations.push(...v.limitations);
      vercel = {
        projectName: "leonix-media",
        deployments: [],
        availability: v.availability,
        limitations: v.limitations,
      };
    }
  } else {
    limitations.push("Vercel: NOT_CONFIGURED.");
  }

  const correlations: LeoProjectSnapshot["correlations"] = [];
  const shaSet = new Set<string>();
  if (github?.headSha) shaSet.add(github.headSha);
  for (const c of github?.recentCommits ?? []) shaSet.add(c.sha);
  for (const d of vercel?.deployments ?? []) {
    if (d.gitCommitSha) shaSet.add(d.gitCommitSha);
  }

  for (const sha of shaSet) {
    const vercelDeployments = (vercel?.deployments ?? [])
      .filter((d) => d.gitCommitSha === sha)
      .map((d) => ({
        deploymentId: d.deploymentId,
        target: d.target,
        readyState: d.readyState,
      }));
    if (vercelDeployments.length === 0 && github?.headSha !== sha) continue;
    correlations.push({
      sha,
      githubBranch: github?.branch ?? null,
      vercelDeployments,
    });
  }

  const healthSignals: LeoProjectSnapshot["healthSignals"] = [];
  for (const d of (vercel?.deployments ?? []).slice(0, 3)) {
    if (!d.readyState) continue;
    healthSignals.push({
      kind: "DEPLOYMENT_PLATFORM_STATE",
      label: `Deployment ${d.deploymentId.slice(0, 8)} (${d.target ?? "unknown target"})`,
      value: d.readyState,
      limitationNote:
        "Platform deployment state only — not a claim that Leonix or Production is healthy.",
    });
  }

  return {
    generatedAt,
    github,
    vercel,
    correlations,
    healthSignals,
    limitations: [...new Set(limitations)],
    notClaiming: NOT_CLAIMING,
  };
}

export function composeLeoProjectIntelligenceSummary(snapshot: LeoProjectSnapshot): string {
  const parts: string[] = [];

  if (snapshot.github?.headSha) {
    const short = snapshot.github.headSha.slice(0, 7);
    parts.push(
      `GitHub ${snapshot.github.fullName} branch ${snapshot.github.branch ?? "unknown"} head ${short}${
        snapshot.github.headMessage ? ` — ${snapshot.github.headMessage}` : ""
      }.`,
    );
  } else if (snapshot.github?.availability === "NOT_CONFIGURED") {
    parts.push("GitHub project intelligence is not configured.");
  } else if (snapshot.github) {
    parts.push("GitHub metadata is partial or unavailable.");
  }

  const deps = snapshot.vercel?.deployments ?? [];
  if (deps.length > 0) {
    const latest = deps[0];
    const shaNote = latest.gitCommitSha
      ? ` commit ${latest.gitCommitSha.slice(0, 7)}`
      : "";
    const ready = latest.readyState ?? latest.state ?? "unknown";
    parts.push(
      `Latest Vercel deployment ${latest.deploymentId.slice(0, 8)} target ${
        latest.target ?? "unknown"
      } is platform-state ${ready}${shaNote}. This is deployment readiness, not system health.`,
    );
  } else if (snapshot.vercel?.availability === "NOT_CONFIGURED") {
    parts.push("Vercel project intelligence is not configured.");
  }

  const matched = snapshot.correlations.find((c) => c.vercelDeployments.length > 0);
  if (matched) {
    const d = matched.vercelDeployments[0];
    parts.push(
      `Commit ${matched.sha.slice(0, 7)} correlates to Vercel deployment ${d.deploymentId.slice(0, 8)} (${
        d.target ?? "unknown"
      }, ${d.readyState ?? "unknown"}).`,
    );
  }

  if (parts.length === 0) {
    return "No project intelligence evidence is available yet. Configure LEO_GITHUB_TOKEN and/or LEO_VERCEL_TOKEN for read-only project evidence.";
  }
  return parts.join(" ");
}
