/**
 * LEO-12 Connected Project Brain — executive snapshot from GitHub + Vercel evidence.
 * Exact SHA correlation. Never claims full system health. No writes.
 */
import "server-only";

import { requireLeoOwnerAccess } from "@/app/leo/_lib/leoAccess";
import {
  emptyLeoGithubSnapshotForFailure,
  readLeoGithubRepository,
} from "@/app/leo/_lib/leoGithubProjectAdapter";
import {
  buildLeoProjectRecentChanges,
  buildLeoProjectTimeline,
  detectArbitraryRepoRequest,
} from "@/app/leo/_lib/leoProjectChangeIntelligence";
import { correlateLeoProjectState } from "@/app/leo/_lib/leoProjectCorrelationEngine";
import {
  getLeoProjectConfigDiagnostic,
  isLeoGithubConfigured,
  isLeoVercelConfigured,
} from "@/app/leo/_lib/leoProjectConfig";
import { adviseLeoProjectQa } from "@/app/leo/_lib/leoProjectQaAdvisor";
import { LEO_PROJECT_DEFAULT_BRANCH } from "@/app/leo/_lib/leoToolRegistry";
import { readLeoVercelDeployments } from "@/app/leo/_lib/leoVercelProjectAdapter";
import type {
  LeoProjectExecutiveSnapshot,
  LeoProjectSnapshot,
} from "@/app/leo/_lib/leoTypes";

export {
  composeLeoProjectIntelligenceSummary,
  composeExecutiveProjectSummary,
  sanitizeLeoCommitMessageForOwner,
  inferLeoProjectQuestionKind,
} from "@/app/leo/_lib/leoConversationComposer";

const NOT_CLAIMING = [
  "Not claiming site healthy",
  "Not claiming database healthy",
  "Not claiming all systems healthy",
  "Deployment READY is platform/build state only",
  "Not recommending deploy or Production promotion",
] as const;

export type LeoProjectIntelligenceOptions = {
  branch?: string | null;
  nowMs?: number;
  question?: string | null;
};

function buildLegacySnapshot(args: {
  generatedAt: string;
  github: LeoProjectSnapshot["github"];
  vercel: LeoProjectSnapshot["vercel"];
  limitations: string[];
}): LeoProjectSnapshot {
  const correlations: LeoProjectSnapshot["correlations"] = [];
  const shaSet = new Set<string>();
  if (args.github?.headSha) shaSet.add(args.github.headSha);
  for (const c of args.github?.recentCommits ?? []) shaSet.add(c.sha);
  for (const d of args.vercel?.deployments ?? []) {
    if (d.gitCommitSha) shaSet.add(d.gitCommitSha);
  }
  for (const sha of shaSet) {
    const vercelDeployments = (args.vercel?.deployments ?? [])
      .filter((d) => d.gitCommitSha === sha)
      .map((d) => ({
        deploymentId: d.deploymentId,
        target: d.target,
        readyState: d.readyState,
      }));
    if (vercelDeployments.length === 0 && args.github?.headSha !== sha) continue;
    correlations.push({
      sha,
      githubBranch: args.github?.branch ?? null,
      vercelDeployments,
    });
  }

  const healthSignals: LeoProjectSnapshot["healthSignals"] = [];
  for (const d of (args.vercel?.deployments ?? []).slice(0, 3)) {
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
    generatedAt: args.generatedAt,
    github: args.github,
    vercel: args.vercel,
    correlations,
    healthSignals,
    limitations: [...new Set(args.limitations)],
    notClaiming: NOT_CLAIMING,
  };
}

/**
 * Owner-admin executive project brain snapshot.
 */
export async function getLeoProjectExecutiveSnapshot(
  options: LeoProjectIntelligenceOptions = {},
): Promise<LeoProjectExecutiveSnapshot> {
  await requireLeoOwnerAccess();
  return loadLeoProjectExecutiveSnapshotInternal(options);
}

/** LEO-16 cron/system loader — caller must enforce owner boundary. */
export async function loadLeoProjectExecutiveSnapshotForScheduledWatch(
  options: LeoProjectIntelligenceOptions = {},
): Promise<LeoProjectExecutiveSnapshot> {
  return loadLeoProjectExecutiveSnapshotInternal(options);
}

async function loadLeoProjectExecutiveSnapshotInternal(
  options: LeoProjectIntelligenceOptions = {},
): Promise<LeoProjectExecutiveSnapshot> {
  const nowMs = options.nowMs ?? Date.now();
  const observedAt = new Date(nowMs).toISOString();
  const leoBranch = options.branch?.trim() || LEO_PROJECT_DEFAULT_BRANCH;
  const configurationState = getLeoProjectConfigDiagnostic();
  const limitations: string[] = [];

  if (options.question && detectArbitraryRepoRequest(options.question)) {
    limitations.push(
      "Arbitrary repositories are rejected. LEO only reads allowlisted jesusecaceres/elaguila-website.",
    );
  }

  let github: LeoProjectSnapshot["github"] = null;
  let vercel: LeoProjectSnapshot["vercel"] = null;

  if (!isLeoGithubConfigured() && !isLeoVercelConfigured()) {
    limitations.push(
      "Neither GitHub nor Vercel project intelligence is configured (LEO_GITHUB_TOKEN / LEO_VERCEL_TOKEN).",
    );
  }

  if (isLeoGithubConfigured()) {
    const g = await readLeoGithubRepository({ branch: leoBranch });
    if (g.ok) {
      github = g.snapshot;
      limitations.push(...g.snapshot.limitations);
    } else {
      limitations.push(...g.limitations);
      github = emptyLeoGithubSnapshotForFailure(g.availability, g.limitations, leoBranch);
    }
  } else {
    limitations.push("GitHub: NOT_CONFIGURED.");
    github = emptyLeoGithubSnapshotForFailure("NOT_CONFIGURED", ["GitHub: NOT_CONFIGURED."], leoBranch);
  }

  if (isLeoVercelConfigured()) {
    const v = await readLeoVercelDeployments({ leoBranch });
    if (v.ok) {
      vercel = {
        projectName: v.projectName,
        deployments: v.deployments,
        latestPreview: v.latestPreview,
        latestProduction: v.latestProduction,
        availability: v.availability,
        limitations: v.limitations,
      };
      limitations.push(...v.limitations);
    } else {
      limitations.push(...v.limitations);
      vercel = {
        projectName: "leonix-media",
        deployments: [],
        latestPreview: null,
        latestProduction: null,
        availability: v.availability,
        limitations: v.limitations,
      };
    }
  } else {
    limitations.push("Vercel: NOT_CONFIGURED.");
    vercel = {
      projectName: "leonix-media",
      deployments: [],
      latestPreview: null,
      latestProduction: null,
      availability: "NOT_CONFIGURED",
      limitations: ["Vercel: NOT_CONFIGURED."],
    };
  }

  const correlation = correlateLeoProjectState({
    github,
    deployments: vercel?.deployments ?? [],
    aheadBy: github?.compareToMain?.aheadBy ?? null,
    behindBy: github?.compareToMain?.behindBy ?? null,
  });
  limitations.push(...correlation.limitations);

  const recentChanges = buildLeoProjectRecentChanges({ github });
  const timeline = buildLeoProjectTimeline({
    github,
    deployments: vercel?.deployments ?? [],
  });
  const qaAdvice = adviseLeoProjectQa(correlation);

  const raw = buildLegacySnapshot({
    generatedAt: observedAt,
    github,
    vercel,
    limitations,
  });

  return {
    observedAt,
    repository: github?.fullName ?? "jesusecaceres/elaguila-website",
    leoBranch: github?.branch ?? leoBranch,
    mainBranch: github?.defaultBranch ?? null,
    leoHead: {
      sha: github?.headSha ?? null,
      message: github?.headMessage ?? null,
      committedAt: github?.headCommittedAt ?? null,
      author: github?.headAuthor ?? null,
    },
    mainHead: {
      sha: github?.mainHeadSha ?? null,
      message: github?.mainHeadMessage ?? null,
    },
    latestLeoPreview: correlation.previewForHead ?? correlation.latestPreview,
    latestProduction: correlation.latestProduction,
    correlation,
    recentChanges,
    timeline,
    qaAdvice,
    configurationState,
    ownerQuestion: options.question?.trim() || null,
    raw,
    limitations: [...new Set(limitations)],
    notClaiming: NOT_CLAIMING,
  };
}

/** Backward-compatible wrapper used by LEO-11 tool adapters / conversation. */
export async function getLeoProjectSnapshot(
  options: LeoProjectIntelligenceOptions = {},
): Promise<LeoProjectSnapshot> {
  const exec = await getLeoProjectExecutiveSnapshot(options);
  return exec.raw;
}
