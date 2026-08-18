import { randomBytes } from "node:crypto";
import type { HumanConnectionVideoProvider } from "./types";
import type { HumanConnectionCapability } from "../humanConnectionTypes";

const DAILY_API = "https://api.daily.co/v1";

function getDailyApiKey(): string | null {
  const key = String(process.env.DAILY_API_KEY ?? "").trim();
  return key || null;
}

async function dailyFetch<T>(
  path: string,
  init: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false; status: number; info: string }> {
  const key = getDailyApiKey();
  if (!key) return { ok: false, status: 0, info: "not_configured" };

  try {
    const res = await fetch(`${DAILY_API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      const info = String(json.info ?? json.error ?? `http_${res.status}`);
      return { ok: false, status: res.status, info };
    }
    return { ok: true, data: json as T };
  } catch (e) {
    return { ok: false, status: 0, info: e instanceof Error ? e.message : "network_error" };
  }
}

function ephemeralRoomName(): string {
  // Opaque — never include executive names, emails, or visitor PII.
  return `hc${randomBytes(12).toString("hex")}`;
}

type DailyRoom = {
  id?: string;
  name: string;
  url: string;
  privacy?: string;
};

type DailyToken = { token: string };

/**
 * Daily.co hosted WebRTC adapter — provider-specific code stays here.
 * Public UI must never import this module.
 *
 * Docs: POST /rooms, POST /meeting-tokens (api.daily.co/v1)
 */
export function createDailyVideoProvider(): HumanConnectionVideoProvider {
  return {
    id: "daily",

    isConfigured() {
      return Boolean(getDailyApiKey());
    },

    getCapability(): HumanConnectionCapability {
      const configured = Boolean(getDailyApiKey());
      return {
        providerId: "daily",
        configured,
        healthy: configured,
        canCreateEphemeralSession: configured,
        supportsRecording: false,
      };
    },

    async createEphemeralSession(input) {
      if (!getDailyApiKey()) return { ok: false, error: "not_configured" };

      const expMs = Date.parse(input.preferredExpiresAt);
      if (!Number.isFinite(expMs)) return { ok: false, error: "create_failed" };
      const expSec = Math.floor(expMs / 1000);
      const nowSec = Math.floor(Date.now() / 1000);
      // Clamp to ~10–20 minutes from now for safety.
      const minExp = nowSec + 10 * 60;
      const maxExp = nowSec + 20 * 60;
      const roomExp = Math.min(maxExp, Math.max(minExp, expSec));

      const roomName = ephemeralRoomName();

      const roomRes = await dailyFetch<DailyRoom>("/rooms", {
        method: "POST",
        body: JSON.stringify({
          name: roomName,
          privacy: "private",
          properties: {
            exp: roomExp,
            eject_at_room_exp: true,
            max_participants: 6,
            enable_chat: true,
            enable_screenshare: false,
            // Recording intentionally omitted / not enabled (privacy baseline).
            start_video_off: false,
            start_audio_off: false,
          },
        }),
      });

      if (!roomRes.ok) {
        console.error(`[human-connection] daily room create failed: ${roomRes.info}`);
        return { ok: false, error: "create_failed" };
      }

      const roomUrl = String(roomRes.data.url ?? "").replace(/\/$/, "");
      const name = String(roomRes.data.name ?? roomName);
      if (!roomUrl || !name) {
        return { ok: false, error: "create_failed" };
      }

      const visitorTokenRes = await dailyFetch<DailyToken>("/meeting-tokens", {
        method: "POST",
        body: JSON.stringify({
          properties: {
            room_name: name,
            is_owner: false,
            user_name: input.visitorFirstName.slice(0, 36),
            exp: roomExp,
            eject_at_token_exp: true,
            enable_recording_ui: false,
            start_cloud_recording: false,
          },
        }),
      });

      const hostTokenRes = await dailyFetch<DailyToken>("/meeting-tokens", {
        method: "POST",
        body: JSON.stringify({
          properties: {
            room_name: name,
            is_owner: true,
            user_name: "Leonix",
            exp: roomExp,
            eject_at_token_exp: true,
            enable_recording_ui: false,
            start_cloud_recording: false,
          },
        }),
      });

      if (!visitorTokenRes.ok || !hostTokenRes.ok) {
        console.error(
          `[human-connection] daily token create failed visitor=${visitorTokenRes.ok} host=${hostTokenRes.ok}`,
        );
        // Best-effort revoke room
        await dailyFetch(`/rooms/${encodeURIComponent(name)}`, { method: "DELETE" }).catch(() => {});
        return { ok: false, error: "create_failed" };
      }

      const visitorToken = String(visitorTokenRes.data.token ?? "");
      const hostToken = String(hostTokenRes.data.token ?? "");
      if (!visitorToken || !hostToken) {
        await dailyFetch(`/rooms/${encodeURIComponent(name)}`, { method: "DELETE" }).catch(() => {});
        return { ok: false, error: "create_failed" };
      }

      const expiresAt = new Date(roomExp * 1000).toISOString();
      const sessionId = name; // opaque room name doubles as session id

      return {
        ok: true,
        visitor: {
          sessionId,
          visitorJoinUrl: `${roomUrl}?t=${encodeURIComponent(visitorToken)}`,
          expiresAt,
          providerId: "daily",
        },
        host: {
          sessionId,
          // Temporary provider host URL — orchestrator replaces with Leonix-owned admin route
          // before any visitor-facing response. Email uses Leonix admin URL only.
          hostJoinUrl: `${roomUrl}?t=${encodeURIComponent(hostToken)}`,
          expiresAt,
        },
      };
    },

    async revokeSession(sessionId: string) {
      const name = String(sessionId ?? "").trim();
      if (!name || !getDailyApiKey()) return;
      await dailyFetch(`/rooms/${encodeURIComponent(name)}`, { method: "DELETE" });
    },
  };
}
