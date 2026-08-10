/**
 * Build 07 — Free/Native V1 launch readiness (separate from managed video).
 *
 * NATIVE_V1_READY may be true without Daily/Resend/FaceTime/Meet/migrations.
 * MANAGED_VIDEO_READY and FULL_HUMAN_CONNECTION_READY stay false until real deps.
 */

export type HumanConnectionLaunchReadiness = {
  /** Call / SMS / WhatsApp / Email + VFD + ECP + staff routing — no paid transport. */
  nativeV1Ready: boolean;
  /** Immediate browser video with provider + notify + presence storage. */
  managedVideoReady: boolean;
  /** Native + managed video + optional FaceTime/Meet where configured. */
  fullHumanConnectionReady: boolean;
  reasons: {
    nativeV1: string[];
    managedVideo: string[];
    fullHumanConnection: string[];
  };
};

export type LaunchReadinessEvidence = {
  /** /visitanos route + launch lock + QR destination certified in asserts. */
  visitanosPublic: boolean;
  /** Office hours resolver present and DST-safe. */
  officeHoursTruthful: boolean;
  /** ECP registry has at least one active profile with native contact. */
  ecpNativeContactAvailable: boolean;
  /** Router returns phone/sms/whatsapp/email without managed providers. */
  routerNativeChannelsWithoutProviders: boolean;
  /** Call/SMS/WhatsApp/Email href builders produce safe destinations from ECP. */
  nativeHrefBuildersValid: boolean;
  /** Schedule CTA is hidden or backend-gated (never fake success). */
  scheduleCtaTruthful: boolean;
  /** Staff → /contact/{slug} from registry (no second staff DB). */
  staffRoutesThroughEcp: boolean;
  /** Spanish + English public copy present. */
  bilingualComplete: boolean;
  /** Daily configured + healthy + notify ready + migrations applied (ops truth). */
  dailyConfigured: boolean;
  resendConfigured: boolean;
  presenceStorageReady: boolean;
  videoSessionsStorageReady: boolean;
  facetimeConfiguredForPrimary: boolean;
  googleMeetConfigured: boolean;
};

/**
 * Evaluate launch readiness from explicit evidence (tests / ops checklist).
 * Does not read process.env secrets into client bundles — callers supply booleans.
 */
export function evaluateHumanConnectionLaunchReadiness(
  evidence: LaunchReadinessEvidence,
): HumanConnectionLaunchReadiness {
  const nativeReasons: string[] = [];
  if (!evidence.visitanosPublic) nativeReasons.push("visitanos_not_public");
  if (!evidence.officeHoursTruthful) nativeReasons.push("office_hours_unverified");
  if (!evidence.ecpNativeContactAvailable) nativeReasons.push("ecp_native_contact_missing");
  if (!evidence.routerNativeChannelsWithoutProviders) {
    nativeReasons.push("router_requires_managed_provider");
  }
  if (!evidence.nativeHrefBuildersValid) nativeReasons.push("native_href_invalid");
  if (!evidence.scheduleCtaTruthful) nativeReasons.push("schedule_cta_untruthful");
  if (!evidence.staffRoutesThroughEcp) nativeReasons.push("staff_routing_broken");
  if (!evidence.bilingualComplete) nativeReasons.push("bilingual_incomplete");

  const nativeV1Ready = nativeReasons.length === 0;

  const managedReasons: string[] = [];
  if (!evidence.dailyConfigured) managedReasons.push("daily_unconfigured");
  if (!evidence.resendConfigured) managedReasons.push("resend_unconfigured");
  if (!evidence.presenceStorageReady) managedReasons.push("presence_storage_missing");
  if (!evidence.videoSessionsStorageReady) managedReasons.push("video_sessions_storage_missing");

  const managedVideoReady = managedReasons.length === 0;

  const fullReasons: string[] = [];
  if (!nativeV1Ready) fullReasons.push("native_v1_incomplete");
  if (!managedVideoReady) fullReasons.push("managed_video_incomplete");
  // FaceTime / Meet are optional per executive — not required for "full" platform readiness,
  // but full HC means managed video path is also live. Optional channels stay config-driven.

  const fullHumanConnectionReady = nativeV1Ready && managedVideoReady;

  return {
    nativeV1Ready,
    managedVideoReady,
    fullHumanConnectionReady,
    reasons: {
      nativeV1: nativeReasons,
      managedVideo: managedReasons,
      fullHumanConnection: fullReasons,
    },
  };
}

/**
 * Code-time defaults for this worktree before owner activates paid/managed deps.
 * Migrations are intentionally NOT applied → managed video false.
 */
export function getDefaultBuild07LaunchEvidence(overrides: Partial<LaunchReadinessEvidence> = {}): LaunchReadinessEvidence {
  return {
    visitanosPublic: true,
    officeHoursTruthful: true,
    ecpNativeContactAvailable: true,
    routerNativeChannelsWithoutProviders: true,
    nativeHrefBuildersValid: true,
    scheduleCtaTruthful: true,
    staffRoutesThroughEcp: true,
    bilingualComplete: true,
    dailyConfigured: false,
    resendConfigured: false,
    presenceStorageReady: false,
    videoSessionsStorageReady: false,
    facetimeConfiguredForPrimary: false,
    googleMeetConfigured: false,
    ...overrides,
  };
}

/** Schedule request may be offered only when a real notify path exists (Resend). */
export function isScheduleRequestBackendReady(resendConfigured: boolean): boolean {
  return resendConfigured === true;
}
