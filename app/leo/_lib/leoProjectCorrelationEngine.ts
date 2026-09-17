/**
 * LEO-12 exact SHA/branch correlation — pure, deterministic.
 * Commit message alone never establishes identity.
 */
import type {
  LeoDeploymentSnapshot,
  LeoProjectCorrelationResult,
  LeoProjectCorrelationState,
  LeoRepositorySnapshot,
} from "@/app/leo/_lib/leoTypes";

function normalizeReady(state: string | null | undefined): string {
  return (state ?? "").trim().toUpperCase();
}

function isPreviewTarget(d: LeoDeploymentSnapshot): boolean {
  const t = (d.target ?? "").toLowerCase();
  return t === "preview" || t === "" || t === "staging";
}

function isProductionTarget(d: LeoDeploymentSnapshot): boolean {
  return (d.target ?? "").toLowerCase() === "production";
}

function isBuilding(state: string): boolean {
  return /BUILDING|QUEUED|INITIALIZING|PENDING/.test(state);
}

function isReady(state: string): boolean {
  return state === "READY";
}

function isError(state: string): boolean {
  return /ERROR|FAILED|CANCELED|CANCELLED/.test(state);
}

/** Prefer exact SHA match. Never correlate by commit message alone. */
export function findDeploymentsForSha(
  deployments: LeoDeploymentSnapshot[],
  sha: string | null,
): LeoDeploymentSnapshot[] {
  if (!sha) return [];
  return deployments.filter((d) => d.gitCommitSha === sha);
}

export function pickLatestByCreated(deps: LeoDeploymentSnapshot[]): LeoDeploymentSnapshot | null {
  if (deps.length === 0) return null;
  return [...deps].sort((a, b) => {
    const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
    const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
    return tb - ta;
  })[0];
}

export function pickLatestPreview(
  deployments: LeoDeploymentSnapshot[],
  leoBranch?: string | null,
): LeoDeploymentSnapshot | null {
  const previews = deployments.filter(isPreviewTarget);
  if (leoBranch) {
    const forBranch = previews.filter((d) => d.gitBranch === leoBranch);
    const pick = pickLatestByCreated(forBranch);
    if (pick) return pick;
  }
  return pickLatestByCreated(previews);
}

export function pickLatestProduction(
  deployments: LeoDeploymentSnapshot[],
): LeoDeploymentSnapshot | null {
  return pickLatestByCreated(deployments.filter(isProductionTarget));
}

/**
 * Correlate branch head to Preview/Production using exact SHA first.
 */
export function correlateLeoProjectState(input: {
  github: LeoRepositorySnapshot | null;
  deployments: LeoDeploymentSnapshot[];
  /** GitHub compare ahead_by when known — never invent. */
  aheadBy?: number | null;
  behindBy?: number | null;
}): LeoProjectCorrelationResult {
  const limitations: string[] = [
    "Correlation uses exact commit SHA when available — not commit message alone.",
    "Vercel READY means platform deployment state READY — not system health.",
  ];
  const states: LeoProjectCorrelationState[] = [];
  const branchHeadSha = input.github?.headSha ?? null;
  const branch = input.github?.branch ?? null;
  const latestPreview = pickLatestPreview(input.deployments, branch);
  const latestProduction = pickLatestProduction(input.deployments);
  const forHead = findDeploymentsForSha(input.deployments, branchHeadSha);
  const previewForHead =
    pickLatestByCreated(forHead.filter(isPreviewTarget)) ??
    (latestPreview && branchHeadSha && latestPreview.gitCommitSha === branchHeadSha
      ? latestPreview
      : null);

  if (branchHeadSha && previewForHead) {
    states.push("BRANCH_HEAD_HAS_PREVIEW");
    const rs = normalizeReady(previewForHead.readyState ?? previewForHead.state);
    if (isReady(rs)) states.push("BRANCH_HEAD_PREVIEW_READY");
    else if (isBuilding(rs)) states.push("BRANCH_HEAD_PREVIEW_BUILDING");
    else if (isError(rs)) states.push("BRANCH_HEAD_PREVIEW_FAILED");
  } else if (branchHeadSha) {
    states.push("BRANCH_HEAD_NO_PREVIEW");
    limitations.push("No Vercel Preview deployment found for the exact branch-head SHA.");
  }

  let productionMatchesHead: boolean | null = null;
  let productionBehindBranch: boolean | null = null;

  if (branchHeadSha && latestProduction?.gitCommitSha) {
    productionMatchesHead = latestProduction.gitCommitSha === branchHeadSha;
    if (productionMatchesHead) {
      states.push("PRODUCTION_MATCHES_BRANCH_HEAD");
    } else {
      states.push("PRODUCTION_DIFFERS_FROM_BRANCH_HEAD");
      if (typeof input.aheadBy === "number" && input.aheadBy > 0) {
        states.push("PRODUCTION_BEHIND_BRANCH");
        productionBehindBranch = true;
      } else if (typeof input.behindBy === "number" && input.behindBy > 0) {
        states.push("PRODUCTION_AHEAD_OR_DIVERGED");
        productionBehindBranch = false;
      } else {
        limitations.push(
          "Production differs from branch head by SHA, but GitHub ahead/behind was not proven — not labeled behind.",
        );
      }
    }
  } else if (!branchHeadSha || !latestProduction?.gitCommitSha) {
    states.push("UNKNOWN_RELATIONSHIP");
    limitations.push("Could not prove Production vs branch-head relationship without exact SHAs.");
  }

  const interpretation = composeCorrelationInterpretation(states, {
    branchHeadSha,
    previewForHead,
    latestProduction,
    productionMatchesHead,
    productionBehindBranch,
  });

  return {
    states: [...new Set(states)],
    branchHeadSha,
    latestPreview,
    latestProduction,
    previewForHead,
    productionMatchesHead,
    productionBehindBranch,
    interpretation,
    limitations,
  };
}

function composeCorrelationInterpretation(
  states: LeoProjectCorrelationState[],
  ctx: {
    branchHeadSha: string | null;
    previewForHead: LeoDeploymentSnapshot | null;
    latestProduction: LeoDeploymentSnapshot | null;
    productionMatchesHead: boolean | null;
    productionBehindBranch: boolean | null;
  },
): string {
  const parts: string[] = [];
  if (states.includes("BRANCH_HEAD_PREVIEW_READY")) {
    parts.push(
      "The latest LEO code has a READY Preview (Vercel deployment state is READY — not system health).",
    );
  } else if (states.includes("BRANCH_HEAD_PREVIEW_BUILDING")) {
    parts.push("The latest LEO Preview is still building.");
  } else if (states.includes("BRANCH_HEAD_PREVIEW_FAILED")) {
    parts.push("The latest LEO Preview failed to build.");
  } else if (states.includes("BRANCH_HEAD_NO_PREVIEW")) {
    parts.push("No Preview deployment was found for the exact branch-head commit.");
  }

  if (states.includes("PRODUCTION_MATCHES_BRANCH_HEAD")) {
    parts.push("Production is running the same commit as the branch head.");
  } else if (states.includes("PRODUCTION_BEHIND_BRANCH")) {
    parts.push(
      "Production is behind this branch (GitHub compare proves the branch is ahead of main/Production baseline).",
    );
  } else if (states.includes("PRODUCTION_DIFFERS_FROM_BRANCH_HEAD")) {
    parts.push(
      "Production is on a different commit than the branch head. LEO will not call it behind unless compare evidence proves it.",
    );
  }

  if (
    states.includes("BRANCH_HEAD_PREVIEW_READY") &&
    ctx.productionMatchesHead === false
  ) {
    parts.push(
      "The latest LEO code has a READY Preview and has not been promoted to Production.",
    );
  }

  return parts.join(" ") || "Project relationship is not fully proven from current evidence.";
}
