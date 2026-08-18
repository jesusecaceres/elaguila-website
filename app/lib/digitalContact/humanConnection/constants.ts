/** Build 04 Human Connection constants. */

/** Visitor waiting timeout before no-answer fallback (ms). */
export const HUMAN_CONNECTION_WAIT_TIMEOUT_MS = 75_000;

/** Ephemeral video session TTL when provider does not specify (ms). */
export const HUMAN_CONNECTION_SESSION_TTL_MS = 15 * 60 * 1000;

/** Max video session requests per IP+slug window. */
export const HUMAN_CONNECTION_VIDEO_RATE_LIMIT = 5;
export const HUMAN_CONNECTION_VIDEO_RATE_WINDOW_MS = 10 * 60 * 1000;

/** Max schedule requests per IP+slug window. */
export const HUMAN_CONNECTION_SCHEDULE_RATE_LIMIT = 8;
export const HUMAN_CONNECTION_SCHEDULE_RATE_WINDOW_MS = 10 * 60 * 1000;

export const HUMAN_CONNECTION_NAME_MIN = 2;
export const HUMAN_CONNECTION_NAME_MAX = 80;
export const HUMAN_CONNECTION_REASON_MAX = 280;
export const HUMAN_CONNECTION_MESSAGE_MAX = 2000;
export const HUMAN_CONNECTION_PREFERRED_TIME_MAX = 200;

/** Allowed presence duration presets (minutes). */
export const HUMAN_CONNECTION_PRESENCE_PRESETS = [30, 60] as const;

export const HUMAN_CONNECTION_ALLOWED_SOURCES = new Set(["office-window", "office_window"]);
