/**
 * LEO-12 GitHub project adapter — server-only, read-only, allowlisted repo.
 * Supports main HEAD + bounded compare. Never exposes tokens or raw bodies.
 */
import "server-only";

import { getLeoGithubToken } from "@/app/leo/_lib/leoProjectConfig";
import {
  LEO_GITHUB_ALLOWED_REPO,
  LEO_PROJECT_BOUNDS,
  LEO_PROJECT_DEFAULT_BRANCH,
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

function safeAuthor(login?: string | null, name?: string | null): string | null {
  const label = (login || name || "").trim();
  if (!label || label.includes("@")) return login?.trim() || null;
  return label.slice(0, 80) || null;
}

function emptySnapshot(
  availability: LeoToolAvailability,
  limitations: string[],
  branch: string | null,
): LeoRepositorySnapshot {
  return {
    provider: "GITHUB",
    owner: LEO_GITHUB_ALLOWED_REPO.owner,
    name: LEO_GITHUB_ALLOWED_REPO.name,
    fullName: LEO_GITHUB_ALLOWED_REPO.fullName,
    defaultBranch: null,
    branch,
    headSha: null,
    headMessage: null,
    headCommittedAt: null,
    headAuthor: null,
    mainHeadSha: null,
    mainHeadMessage: null,
    compareToMain: null,
    recentCommits: [],
    availability,
    limitations,
  };
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
    `Bounded to ${LEO_PROJECT_BOUNDS.maxRecentCommits} recent commits.`,
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

    const defaultBranch = repo.default_branch ?? "main";
    const branch =
      options?.branch?.trim() || LEO_PROJECT_DEFAULT_BRANCH || defaultBranch;

    let headSha: string | null = null;
    let headMessage: string | null = null;
    let headCommittedAt: string | null = null;
    let headAuthor: string | null = null;
    let mainHeadSha: string | null = null;
    let mainHeadMessage: string | null = null;
    let compareToMain: LeoRepositorySnapshot["compareToMain"] = null;
    const recentCommits: LeoRepositorySnapshot["recentCommits"] = [];

    const branchRes = await githubGet(
      `/repos/${owner}/${name}/branches/${encodeURIComponent(branch)}`,
      token,
    );
    if (branchRes.ok) {
      const b = (await branchRes.json()) as {
        commit?: {
          sha?: string;
          commit?: {
            message?: string;
            committer?: { date?: string; name?: string };
            author?: { name?: string };
          };
          author?: { login?: string };
        };
      };
      headSha = b.commit?.sha ?? null;
      headMessage = b.commit?.commit?.message
        ? sanitizeMessage(b.commit.commit.message)
        : null;
      headCommittedAt = b.commit?.commit?.committer?.date ?? null;
      headAuthor = safeAuthor(
        b.commit?.author?.login,
        b.commit?.commit?.author?.name || b.commit?.commit?.committer?.name,
      );
    } else if (branchRes.status === 429) {
      limitations.push("Branch metadata partial — GitHub rate limit.");
    } else {
      limitations.push("Branch metadata unavailable for requested branch.");
    }

    const mainRes = await githubGet(
      `/repos/${owner}/${name}/branches/${encodeURIComponent(defaultBranch)}`,
      token,
    );
    if (mainRes.ok) {
      const m = (await mainRes.json()) as {
        commit?: { sha?: string; commit?: { message?: string } };
      };
      mainHeadSha = m.commit?.sha ?? null;
      mainHeadMessage = m.commit?.commit?.message
        ? sanitizeMessage(m.commit.commit.message)
        : null;
    } else if (mainRes.status === 429) {
      limitations.push("Main branch metadata partial — rate limit.");
    }

    const commitsRes = await githubGet(
      `/repos/${owner}/${name}/commits?sha=${encodeURIComponent(branch)}&per_page=${LEO_PROJECT_BOUNDS.maxRecentCommits}`,
      token,
    );
    if (commitsRes.ok) {
      const commits = (await commitsRes.json()) as Array<{
        sha?: string;
        commit?: {
          message?: string;
          committer?: { date?: string };
          author?: { name?: string };
        };
        author?: { login?: string };
      }>;
      for (const c of commits.slice(0, LEO_PROJECT_BOUNDS.maxRecentCommits)) {
        if (!c.sha) continue;
        recentCommits.push({
          sha: c.sha,
          message: sanitizeMessage(c.commit?.message ?? ""),
          committedAt: c.commit?.committer?.date ?? null,
          author: safeAuthor(c.author?.login, c.commit?.author?.name),
        });
      }
    } else if (commitsRes.status === 429) {
      limitations.push("Recent commits partial — GitHub rate limit.");
    }

    if (headSha && mainHeadSha && headSha !== mainHeadSha) {
      const cmpRes = await githubGet(
        `/repos/${owner}/${name}/compare/${encodeURIComponent(defaultBranch)}...${encodeURIComponent(branch)}`,
        token,
      );
      if (cmpRes.ok) {
        const cmp = (await cmpRes.json()) as {
          status?: string;
          ahead_by?: number;
          behind_by?: number;
        };
        compareToMain = {
          aheadBy: typeof cmp.ahead_by === "number" ? cmp.ahead_by : null,
          behindBy: typeof cmp.behind_by === "number" ? cmp.behind_by : null,
          status: cmp.status ?? null,
        };
      } else if (cmpRes.status === 429) {
        limitations.push("Compare to main unavailable — rate limit.");
      } else {
        limitations.push("Compare to main unavailable.");
      }
    } else if (headSha && mainHeadSha && headSha === mainHeadSha) {
      compareToMain = { aheadBy: 0, behindBy: 0, status: "identical" };
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
        headAuthor,
        mainHeadSha,
        mainHeadMessage,
        compareToMain,
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

export function emptyLeoGithubSnapshotForFailure(
  availability: LeoToolAvailability,
  limitations: string[],
  branch?: string | null,
): LeoRepositorySnapshot {
  return emptySnapshot(availability, limitations, branch ?? LEO_PROJECT_DEFAULT_BRANCH);
}
