/**
 * LEO-12 project QA advisor — deterministic next-step from evidence.
 * Never recommends deploy / promote / Production mutation.
 */
import type {
  LeoProjectCorrelationResult,
  LeoProjectQaAdvice,
  LeoProjectQaAdviceState,
} from "@/app/leo/_lib/leoTypes";

const NO_DEPLOY =
  "LEO does not recommend deploying or promoting to Production from this advisor. Governance controls any future execution path.";

export function adviseLeoProjectQa(
  correlation: LeoProjectCorrelationResult,
): LeoProjectQaAdvice {
  const states = new Set(correlation.states);
  const limitations = [...correlation.limitations, NO_DEPLOY];

  let state: LeoProjectQaAdviceState = "UNKNOWN";
  let summary = "Not enough project evidence to advise a specific QA next step.";
  let nextStep = "Ask about priorities or wait until GitHub/Vercel project intelligence is configured.";

  if (states.has("BRANCH_HEAD_PREVIEW_BUILDING")) {
    state = "WAIT_FOR_BUILD";
    summary = "The latest branch-head Preview is still building.";
    nextStep = "Wait for the Preview build to finish, then ask again whether it is READY.";
  } else if (states.has("BRANCH_HEAD_PREVIEW_FAILED")) {
    state = "INVESTIGATE_BUILD_FAILURE";
    summary = "The latest branch-head Preview failed to build.";
    nextStep = "Inspect the failed Preview deployment evidence and fix the build before QA.";
  } else if (states.has("BRANCH_HEAD_PREVIEW_READY")) {
    state = "QA_PREVIEW";
    summary =
      "The latest branch-head Preview is READY (Vercel deployment state READY — not system health).";
    nextStep =
      correlation.productionMatchesHead === false
        ? "The next evidence-based step is Preview QA. Production is on a different commit."
        : "The next evidence-based step is Preview QA.";
  } else if (states.has("BRANCH_HEAD_NO_PREVIEW") && correlation.branchHeadSha) {
    state = "UNKNOWN";
    summary = "No Preview deployment was found for the exact branch-head SHA.";
    nextStep = "Confirm a Preview exists for this commit, or review recent changes first.";
    limitations.push("No Preview for head SHA — QA target unknown.");
  } else if ((correlation.latestPreview || correlation.latestProduction) && correlation.branchHeadSha) {
    state = "REVIEW_CHANGES";
    summary = "Project evidence exists, but branch-head Preview readiness is not proven.";
    nextStep = "Review recent changes and deployment correlation before QA.";
  } else if (!correlation.branchHeadSha && !correlation.latestPreview && !correlation.latestProduction) {
    state = "NO_PROJECT_ACTION";
    summary = "No GitHub/Vercel project evidence is available yet.";
    nextStep = "Configure project intelligence credentials, or ask a non-project LEO question.";
  }

  // Hard rule: never suggest deploy/promote language.
  if (/deploy|promote|production mutation/i.test(nextStep) && !/does not recommend deploying/i.test(nextStep)) {
    nextStep = "Review Preview evidence. LEO will not recommend Production deployment here.";
  }

  return { state, summary, nextStep, limitations };
}
