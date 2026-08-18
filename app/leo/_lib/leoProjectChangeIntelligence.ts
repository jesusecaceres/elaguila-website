/**
 * LEO-12 change intelligence + bounded timeline — pure, deterministic.
 * Classification uses commit-message prefixes/patterns only — no AI.
 */
import { LEO_PROJECT_BOUNDS } from "@/app/leo/_lib/leoToolRegistry";
import type {
  LeoDeploymentSnapshot,
  LeoProjectChange,
  LeoProjectChangeClassification,
  LeoProjectTimelineItem,
  LeoRepositorySnapshot,
} from "@/app/leo/_lib/leoTypes";

export function classifyLeoCommitMessage(message: string): LeoProjectChangeClassification {
  const m = message.trim();
  const lower = m.toLowerCase();
  if (/^merge\b/i.test(m) || /\bmerge (branch|pull request)\b/i.test(lower)) return "MERGE";
  if (/^(feat|feature)(\(|:|\/|\s)/i.test(m) || /\bfeat\(/i.test(m)) return "FEATURE";
  if (/^(fix)(\(|:|\/|\s)/i.test(m) || /\bbugfix\b/i.test(lower)) return "FIX";
  if (/^(polish|chore|style|docs|refactor)(\(|:|\/|\s)/i.test(m)) return "POLISH";
  if (/architecture|tool bus|foundation|engine/i.test(lower)) return "ARCHITECTURE";
  if (/migration|schema|supabase|database/i.test(lower)) return "DATA";
  if (/security|auth|rls|credential|token/i.test(lower)) return "SECURITY";
  return "UNKNOWN";
}

export function buildLeoProjectRecentChanges(input: {
  github: LeoRepositorySnapshot | null;
  max?: number;
}): LeoProjectChange[] {
  const max = Math.min(input.max ?? LEO_PROJECT_BOUNDS.maxRecentCommits, LEO_PROJECT_BOUNDS.maxRecentCommits);
  const commits = input.github?.recentCommits ?? [];
  return commits.slice(0, max).map((c) => ({
    sha: c.sha,
    message: c.message,
    committedAt: c.committedAt,
    branch: input.github?.branch ?? null,
    classification: classifyLeoCommitMessage(c.message),
    provider: "GITHUB" as const,
  }));
}

export function buildLeoProjectTimeline(input: {
  github: LeoRepositorySnapshot | null;
  deployments: LeoDeploymentSnapshot[];
  max?: number;
}): LeoProjectTimelineItem[] {
  const max = Math.min(
    input.max ?? LEO_PROJECT_BOUNDS.maxTimelineItems,
    LEO_PROJECT_BOUNDS.maxTimelineItems,
  );
  const items: LeoProjectTimelineItem[] = [];

  for (const c of input.github?.recentCommits ?? []) {
    items.push({
      id: `commit-${c.sha}`,
      type: "COMMIT",
      at: c.committedAt,
      label: c.message.slice(0, 120) || c.sha.slice(0, 7),
      sha: c.sha,
      readyState: null,
    });
  }

  for (const d of input.deployments) {
    const target = (d.target ?? "").toLowerCase();
    const type =
      target === "production" ? ("PRODUCTION_DEPLOYMENT" as const) : ("PREVIEW_DEPLOYMENT" as const);
    items.push({
      id: `deploy-${d.deploymentId}`,
      type,
      at: d.createdAt,
      label: `${type === "PRODUCTION_DEPLOYMENT" ? "Production" : "Preview"} ${
        d.readyState ?? d.state ?? "unknown"
      }${d.gitCommitSha ? ` @ ${d.gitCommitSha.slice(0, 7)}` : ""}`,
      sha: d.gitCommitSha,
      readyState: d.readyState ?? d.state,
    });
  }

  return items
    .sort((a, b) => {
      const ta = a.at ? Date.parse(a.at) : 0;
      const tb = b.at ? Date.parse(b.at) : 0;
      if (tb !== ta) return tb - ta;
      return a.id.localeCompare(b.id);
    })
    .slice(0, max);
}

/** Reject arbitrary external repo names in owner questions — allowlist only. */
export function detectArbitraryRepoRequest(question: string): boolean {
  const q = question.toLowerCase();
  if (!/github\.com\/[a-z0-9_.-]+\/[a-z0-9_.-]+/i.test(q) && !/\brepo\s+[a-z0-9_.-]+\/[a-z0-9_.-]+/i.test(q)) {
    return false;
  }
  if (/jesusecaceres\/elaguila-website/i.test(q)) return false;
  return true;
}
