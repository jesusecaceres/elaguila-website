"use client";

import { useEffect } from "react";
import { trackDigitalContactEvent } from "@/app/lib/digitalContact/digitalContactAnalyticsClient";

type Props = {
  hostJoinUrl: string;
  expiresAt: string;
  profileSlug: string;
};

/**
 * Opens the provider host join URL in a new tab after staff is already authenticated.
 * The privileged URL is only rendered inside the admin shell — never returned to visitors.
 */
export function HostVideoJoinClient({ hostJoinUrl, expiresAt, profileSlug }: Props) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("doorbell") === "1") {
      trackDigitalContactEvent(profileSlug, "doorbell_notification_clicked", {
        surface: "admin_host_video",
      });
    }
  }, [profileSlug]);

  return (
    <div className="space-y-3 rounded-xl border border-[#D6C7AD] bg-white p-4">
      <p className="text-sm text-[#3D3428]">
        Expires {new Date(expiresAt).toLocaleString()}. Camera and microphone permissions may be
        requested by the video provider. Recording is disabled.
      </p>
      <a
        href={hostJoinUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-[#1F241C] px-4 text-sm font-bold text-white"
      >
        Join as host
      </a>
    </div>
  );
}
