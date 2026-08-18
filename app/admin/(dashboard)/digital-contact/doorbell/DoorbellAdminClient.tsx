"use client";

import { useCallback, useEffect, useState } from "react";
import { listActiveDigitalContactProfiles } from "@/app/lib/digitalContact/digitalContactRegistry";
import {
  ensureLeonixServiceWorker,
  LeonixServiceWorkerRegister,
  subscribeLeonixDoorbellPush,
} from "@/app/components/digitalContact/LeonixServiceWorkerRegister";
import { trackDigitalContactEvent } from "@/app/lib/digitalContact/digitalContactAnalyticsClient";

type DeviceRow = {
  id: string;
  deviceLabel: string | null;
  userAgent: string | null;
  createdAt: string;
  active: boolean;
  endpointHost: string;
};

/**
 * Authenticated doorbell enrollment (Build 12).
 * Samsung/Android-first. Sound/vibration follow device notification settings.
 */
export function DoorbellAdminClient() {
  const profiles = listActiveDigitalContactProfiles();
  const [slug, setSlug] = useState(profiles[0]?.slug ?? "chuy");
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [webPushConfigured, setWebPushConfigured] = useState<boolean | null>(null);
  const [supabaseConfigured, setSupabaseConfigured] = useState<boolean | null>(null);
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [swReady, setSwReady] = useState(false);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/digital-contact/doorbell?slug=${encodeURIComponent(slug)}`, {
        cache: "no-store",
      });
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean;
        webPushConfigured?: boolean;
        supabaseConfigured?: boolean;
        devices?: DeviceRow[];
        error?: string;
      } | null;
      if (!res.ok || !json?.ok) {
        setError(json?.error ?? "load_failed");
        return;
      }
      setWebPushConfigured(Boolean(json.webPushConfigured));
      setSupabaseConfigured(Boolean(json.supabaseConfigured));
      setDevices(json.devices ?? []);
    } catch {
      setError("network");
    }
  }, [slug]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPermission("unsupported");
    } else {
      setPermission(Notification.permission);
    }
    void ensureLeonixServiceWorker().then((reg) => setSwReady(Boolean(reg)));
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("doorbell") === "1") {
      trackDigitalContactEvent(slug, "doorbell_notification_clicked", {
        surface: "admin_doorbell",
        path: "/admin/digital-contact/doorbell",
      });
    }
  }, [slug]);

  async function enableDoorbell() {
    setBusy("enable");
    setError(null);
    setMessage(null);
    try {
      if (!("Notification" in window)) {
        setError("unsupported");
        return;
      }
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        setError("permission_denied");
        return;
      }
      const keyRes = await fetch("/api/digital-contact/doorbell/vapid-public-key", { cache: "no-store" });
      const keyJson = (await keyRes.json().catch(() => null)) as {
        ok?: boolean;
        publicKey?: string | null;
        configured?: boolean;
      } | null;
      if (!keyRes.ok || !keyJson?.ok || !keyJson.publicKey) {
        setError("vapid_unconfigured");
        return;
      }
      const sub = await subscribeLeonixDoorbellPush(keyJson.publicKey);
      if (!sub) {
        setError("subscribe_failed");
        return;
      }
      const jsonSub = sub.toJSON();
      const save = await fetch("/api/digital-contact/doorbell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "subscribe",
          profileSlug: slug,
          deviceLabel: "Samsung / this browser",
          subscription: jsonSub,
        }),
      });
      const saveJson = (await save.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!save.ok || !saveJson?.ok) {
        setError(saveJson?.error ?? "save_failed");
        return;
      }
      setMessage("This device is registered for Leonix doorbell notifications.");
      await refresh();
    } catch {
      setError("enable_failed");
    } finally {
      setBusy(null);
    }
  }

  async function sendTest() {
    setBusy("test");
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/digital-contact/doorbell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test", profileSlug: slug, lang: "es" }),
      });
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean;
        pushSucceeded?: number;
        pushAttempted?: boolean;
        error?: string;
      } | null;
      if (!res.ok || !json?.ok) {
        setError(json?.error ?? "test_failed");
        return;
      }
      if ((json.pushSucceeded ?? 0) > 0) {
        setMessage("Test notification sent. Check your device notification shade.");
      } else if (!json.pushAttempted) {
        setError("vapid_unconfigured");
      } else {
        setError("test_no_devices");
      }
    } catch {
      setError("test_failed");
    } finally {
      setBusy(null);
    }
  }

  async function removeDevice(id: string) {
    setBusy(`rm:${id}`);
    setError(null);
    try {
      const res = await fetch("/api/digital-contact/doorbell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unsubscribe", profileSlug: slug, subscriptionId: id }),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean } | null;
      if (!res.ok || !json?.ok) {
        setError("remove_failed");
      } else {
        setMessage("Device removed.");
        await refresh();
      }
    } catch {
      setError("remove_failed");
    } finally {
      setBusy(null);
    }
  }

  const activeCount = devices.filter((d) => d.active).length;

  return (
    <div className="space-y-5">
      <LeonixServiceWorkerRegister />

      <div className="rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] p-4 sm:p-5">
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#5F6258]">
          Executive
        </label>
        <select
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="min-h-[44px] w-full rounded-xl border border-[#D6C7AD] bg-white px-3 text-sm font-semibold text-[#1F241C]"
        >
          {profiles.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.preferredName || p.fullName} ({p.slug})
            </option>
          ))}
        </select>

        <dl className="mt-4 grid gap-2 text-sm text-[#3D3428]">
          <div className="flex justify-between gap-3">
            <dt>Browser notifications</dt>
            <dd className="font-semibold">{permission}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Service worker</dt>
            <dd className="font-semibold">{swReady ? "ready" : "pending"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Web Push (VAPID)</dt>
            <dd className="font-semibold">
              {webPushConfigured == null ? "…" : webPushConfigured ? "configured" : "missing keys"}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Subscription database</dt>
            <dd className="font-semibold">
              {supabaseConfigured == null ? "…" : supabaseConfigured ? "ready" : "missing"}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>This browser</dt>
            <dd className="font-semibold">{activeCount > 0 ? "Registered ✓" : "Not registered"}</dd>
          </div>
        </dl>

        <p className="mt-4 text-sm leading-relaxed text-[#5F6258]">
          Your device will receive a notification. Sound and vibration follow your device notification
          settings. Leonix cannot force a custom ringtone from the web.
        </p>

        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            disabled={busy != null || permission === "unsupported"}
            onClick={() => void enableDoorbell()}
            className="min-h-[48px] flex-1 rounded-xl bg-[#1F241C] px-4 text-sm font-bold text-[#FFFDF7] disabled:opacity-50"
          >
            {busy === "enable" ? "Enabling…" : "Enable Doorbell Notifications"}
          </button>
          <button
            type="button"
            disabled={busy != null || activeCount === 0}
            onClick={() => void sendTest()}
            className="min-h-[48px] flex-1 rounded-xl border border-[#1F241C] px-4 text-sm font-bold text-[#1F241C] disabled:opacity-50"
          >
            {busy === "test" ? "Sending…" : "Test Notification"}
          </button>
        </div>

        {message ? <p className="mt-3 text-sm font-semibold text-[#1F241C]">{message}</p> : null}
        {error ? (
          <p className="mt-3 text-sm font-semibold text-[#8B1E1E]" role="alert">
            {error === "permission_denied"
              ? "Notifications were denied. Enable them in browser / Android settings for Leonix."
              : error === "vapid_unconfigured"
                ? "Web Push keys are not configured in Vercel yet."
                : error === "unsupported"
                  ? "This browser does not support Web Push."
                  : error === "test_no_devices"
                    ? "No active devices received the test. Enable doorbell on this device first."
                    : `Could not complete action (${error}).`}
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-[#D6C7AD] bg-[#FBF7EF] p-4 sm:p-5">
        <h2 className="font-serif text-lg font-bold text-[#1F241C]">Registered devices</h2>
        <p className="mt-1 text-sm text-[#5F6258]">Multiple devices per executive are supported.</p>
        <ul className="mt-3 space-y-2">
          {devices.length === 0 ? (
            <li className="text-sm text-[#5F6258]">No devices registered yet.</li>
          ) : (
            devices.map((d) => (
              <li
                key={d.id}
                className="flex min-h-[48px] flex-wrap items-center justify-between gap-2 rounded-xl border border-[#D6C7AD] bg-white px-3 py-2"
              >
                <div className="min-w-0 text-sm">
                  <p className="font-semibold text-[#1F241C]">
                    {d.deviceLabel || d.endpointHost} {d.active ? "" : "(inactive)"}
                  </p>
                  <p className="truncate text-xs text-[#5F6258]">{d.endpointHost}</p>
                </div>
                {d.active ? (
                  <button
                    type="button"
                    disabled={busy != null}
                    onClick={() => void removeDevice(d.id)}
                    className="min-h-[40px] rounded-lg border border-[#D6C7AD] px-3 text-xs font-bold text-[#3D3428]"
                  >
                    Remove
                  </button>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="rounded-2xl border border-[#E8DCC5] bg-white p-4 text-sm leading-relaxed text-[#3D3428]">
        <p className="font-bold text-[#1F241C]">Samsung / Android tips</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Allow notifications for Chrome (or the installed Leonix PWA).</li>
          <li>Sound and vibration are controlled in Android notification settings.</li>
          <li>Avoid aggressive battery restrictions that silence browser/PWA notifications.</li>
          <li>iPhone requires Home Screen install for Web Push; Android is V1 priority.</li>
        </ul>
      </div>
    </div>
  );
}
