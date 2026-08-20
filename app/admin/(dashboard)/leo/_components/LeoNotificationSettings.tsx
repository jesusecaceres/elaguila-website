"use client";

import { useCallback, useEffect, useState } from "react";

import { ensureLeonixServiceWorker } from "@/app/components/digitalContact/LeonixServiceWorkerRegister";
import { detectLeoPwaCapabilities } from "@/app/leo/_lib/leoPwaCapabilities";

type SafeStatus = {
  enabled: boolean;
  pushConfigured: boolean;
  subscriptionCount: number;
  lastDeliveryState: string | null;
  lastDeliveryAt: string | null;
};

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function LeoNotificationSettings() {
  const caps = detectLeoPwaCapabilities();
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [status, setStatus] = useState<SafeStatus | null>(null);
  const [vapidKey, setVapidKey] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/leo/notifications/subscription", { cache: "no-store" });
      const json = (await res.json()) as {
        ok?: boolean;
        status?: SafeStatus;
        vapidPublicKey?: string | null;
        error?: string;
      };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "load_failed");
        return;
      }
      setStatus(json.status ?? null);
      setVapidKey(json.vapidPublicKey ?? null);
    } catch {
      setError("network");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !caps.pushManagerSupported) {
      setPermission("unsupported");
    } else {
      setPermission(Notification.permission);
    }
    void refresh();
  }, [refresh, caps.pushManagerSupported]);

  const enableAlerts = useCallback(async () => {
    setBusy("enable");
    setMessage(null);
    setError(null);
    try {
      if (permission === "unsupported" || !caps.pushManagerSupported) {
        setError("unsupported");
        return;
      }
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        setError("permission_denied");
        return;
      }
      if (!vapidKey) {
        setError("push_not_configured");
        return;
      }
      const reg = await ensureLeonixServiceWorker();
      if (!reg?.pushManager) {
        setError("unsupported");
        return;
      }
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
        });
      }
      const json = sub.toJSON();
      const res = await fetch("/api/leo/notifications/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: {
            endpoint: json.endpoint,
            keys: json.keys,
          },
        }),
      });
      const out = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !out.ok) {
        setError(out.error ?? "subscribe_failed");
        return;
      }
      setMessage("LEO alerts enabled on this device.");
      await refresh();
    } finally {
      setBusy(null);
    }
  }, [permission, caps.pushManagerSupported, vapidKey, refresh]);

  const disableAlerts = useCallback(async () => {
    setBusy("disable");
    setMessage(null);
    setError(null);
    try {
      const reg = await ensureLeonixServiceWorker();
      const sub = await reg?.pushManager?.getSubscription();
      await fetch("/api/leo/notifications/subscription", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: sub?.endpoint ?? undefined }),
      });
      if (sub) await sub.unsubscribe();
      setMessage("LEO alerts disabled on this device.");
      await refresh();
    } catch {
      setError("disable_failed");
    } finally {
      setBusy(null);
    }
  }, [refresh]);

  const sendTest = useCallback(async () => {
    setBusy("test");
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/leo/notifications/test", { method: "POST" });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "test_failed");
        return;
      }
      setMessage("Test alert sent — check your device notification.");
      await refresh();
    } catch {
      setError("network");
    } finally {
      setBusy(null);
    }
  }, [refresh]);

  const stateLabel = (() => {
    if (permission === "unsupported" || !caps.pushManagerSupported) return "Unsupported";
    if (permission === "denied") return "Blocked by browser";
    if (!status?.pushConfigured) return "Temporarily unavailable";
    if (status.enabled) return "Enabled";
    return "Not enabled";
  })();

  return (
    <div className="rounded-2xl border border-[color:var(--lx-border)]/60 bg-[color:var(--lx-card)] p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">LEO alerts</p>
      <p className="mt-1 text-sm font-semibold text-[#1E1810]">{stateLabel}</p>
      <p className="mt-1 text-xs text-[#5C5346]">
        One Leonix app — LEO alerts inside the same installable shell. No separate LEO app.
      </p>
      {status?.lastDeliveryState ? (
        <p className="mt-2 text-[11px] text-[#5C5346]">
          Last delivery: {status.lastDeliveryState.replace(/_/g, " ").toLowerCase()}
          {status.lastDeliveryAt ? ` · ${new Date(status.lastDeliveryAt).toLocaleString()}` : ""}
        </p>
      ) : null}
      {message ? <p className="mt-2 text-xs text-[#2A4536]">{message}</p> : null}
      {error ? <p className="mt-2 text-xs text-rose-800">{error.replace(/_/g, " ")}</p> : null}
      <div className="mt-3 flex min-w-0 flex-wrap gap-2">
        <button
          type="button"
          disabled={busy != null || permission === "denied" || permission === "unsupported"}
          onClick={() => void enableAlerts()}
          className="inline-flex min-h-[44px] items-center rounded-xl bg-[#7A1E2C] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Enable LEO alerts
        </button>
        <button
          type="button"
          disabled={busy != null || !status?.enabled}
          onClick={() => void disableAlerts()}
          className="inline-flex min-h-[44px] items-center rounded-xl border border-[color:var(--lx-border)] bg-white px-4 py-2 text-sm font-semibold text-[#1E1810] disabled:opacity-50"
        >
          Disable alerts
        </button>
        {status?.enabled ? (
          <button
            type="button"
            disabled={busy != null}
            onClick={() => void sendTest()}
            className="inline-flex min-h-[44px] items-center rounded-xl border border-[color:var(--lx-border)] bg-[color:var(--lx-section)] px-4 py-2 text-sm font-semibold text-[#1E1810] disabled:opacity-50"
          >
            Send test alert
          </button>
        ) : null}
      </div>
    </div>
  );
}
