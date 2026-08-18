/**
 * LEO-11 GitHub project adapter — server-only, read-only, allowlisted repo.
 * Missing token → NOT_CONFIGURED. Never exposes token or raw error bodies.
 */
import "server-only";

import { getLeoGithubToken } from "@/app/leo/_lib/leoProjectConfig";
import {
  LEO_GITHUB_ALLOWED_REPO,
  LEO_PROJECT_BOUNDS,
} from "@/app/leo/_lib/leoToolRegistry";
import type { LeoRepositorySnapshot, LeoToolAvailability } from "@/app/leo/_lib/leoTypes";

type GithubFetchResult =
  | { ok: true; snapshot: LeoRepositorySnapshot }
  | { ok: false; availability: LeoToolAvailability; limitations: string[]; errorCode: string };

async function githubGet(path: string, token: string): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), LEO_PROJECT_BOUNDS.fetchTimeoutMs);
  try {
    return await fetch(`https://api.github.com${path}`, {
      method: "GET",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "Leonix-LEO-ProjectIntelligence",
      },
      signal: ctrl.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(t);
  }
}

function sanitizeMessage(msg: string): string {
  return msg.replace(/\s+/g, " ").trim().slice(0, 160);
}

/**
 * Read allowlisted repository metadata. Ignores any caller-supplied repo override.
 */
export async function readLeoGithubRepository(options?: {
  branch?: string | null;
}): Promise<GithubFetchResult> {
  const token = getLeoGithubToken();
  if (!token) {
    return {
      ok: false,
      availability: "NOT_CONFIGURED",
      limitations: ["GitHub project intelligence is not configured (LEO_GITHUB_TOKEN missing)."],
      errorCode: "GITHUB_NOT_CONFIGURED",
    };
  }

  const { owner, name, fullName } = LEO_GITHUB_ALLOWED_REPO;
  const limitations: string[] = [
    `Allowlisted repository only: ${fullName}.`,
    "Read-only — no GitHub writes.",
  ];

  try {
    const repoRes = await githubGet(`/repos/${owner}/${name}`, token);
    if (repoRes.status === 401 || repoRes.status === 403) {
      return {
        ok: false,
        availability: "UNAVAILABLE",
        limitations: [...limitations, "GitHub API authorization failed."],
        errorCode: "GITHUB_AUTH_FAILED",
      };
    }
    if (repoRes.status === 404) {
      return {
        ok: false,
        availability: "UNAVAILABLE",
        limitations: [...limitations, "Allowlisted repository was not found with current credentials."],
        errorCode: "GITHUB_NOT_FOUND",
      };
    }
    if (repoRes.status === 429) {
      return {
        ok: false,
        availability: "UNAVAILABLE",
        limitations: [...limitations, "GitHub API rate limit reached."],
        errorCode: "GITHUB_RATE_LIMIT",
      };
    }
    if (!repoRes.ok) {
      return {
        ok: false,
        availability: "UNAVAILABLE",
        limitations: [...limitations, "GitHub repository metadata request failed."],
        errorCode: "GITHUB_REPO_FAILED",
      };
    }

    const repo = (await repoRes.json()) as {
      default_branch?: string;
      full_name?: string;
      name?: string;
    };
    if (repo.full_name && repo.full_name !== fullName) {
      return {
        ok: false,
        availability: "UNAVAILABLE",
        limitations: [...limitations, "Repository identity did not match allowlist."],
        errorCode: "GITHUB_ALLOWLIST_MISMATCH",
      };
    }

    const defaultBranch = repo.default_branch ?? null;
    const branch = options?.branch?.trim() || defaultBranch;
    let headSha: string | null = null;
    let headMessage: string | null = null;
    let headCommittedAt: string | null = null;
    const recentCommits: LeoRepositorySnapshot["recentCommits"] = [];

    if (branch) {
      const branchRes = await githubGet(
        `/repos/${owner}/${name}/branches/${encodeURIComponent(branch)}`,
        token,
      );
      if (branchRes.ok) {
        const b = (await branchRes.json()) as {
          commit?: { sha?: string; commit?: { message?: string; committer?: { date?: string } } };
        };
        headSha = b.commit?.sha ?? null;
        headMessage = b.commit?.commit?.message
          ? sanitizeMessage(b.commit.commit.message)
          : null;
        headCommittedAt = b.commit?.commit?.committer?.date ?? null;
      } else if (branchRes.status === 429) {
        limitations.push("Branch metadata partial — GitHub rate limit.");
      } else {
        limitations.push("Branch metadata unavailable for requested branch.");
      }

      const commitsRes = await githubGet(
        `/repos/${owner}/${name}/commits?sha=${encodeURIComponent(branch)}&per_page=${LEO_PROJECT_BOUNDS.maxRecentCommits}`,
        token,
      );
      if (commitsRes.ok) {
        const commits = (await commitsRes.json()) as Array<{
          sha?: string;
          commit?: { message?: string; committer?: { date?: string } };
        }>;
        for (const c of commits.slice(0, LEO_PROJECT_BOUNDS.maxRecentCommits)) {
          if (!c.sha) continue;
          recentCommits.push({
            sha: c.sha,
            message: sanitizeMessage(c.commit?.message ?? ""),
            committedAt: c.commit?.committer?.date ?? null,
          });
        }
      } else if (commitsRes.status === 429) {
        limitations.push("Recent commits partial — GitHub rate limit.");
      }
    }

    const availability: LeoToolAvailability =
      headSha || recentCommits.length > 0 ? "AVAILABLE" : "PARTIAL";

    return {
      ok: true,
      snapshot: {
        provider: "GITHUB",
        owner,
        name,
        fullName,
        defaultBranch,
        branch,
        headSha,
        headMessage,
        headCommittedAt,
        recentCommits,
        availability,
        limitations,
      },
    };
  } catch {
    return {
      ok: false,
      availability: "UNAVAILABLE",
      limitations: [...limitations, "GitHub request failed or timed out."],
      errorCode: "GITHUB_REQUEST_FAILED",
    };
  }
}
