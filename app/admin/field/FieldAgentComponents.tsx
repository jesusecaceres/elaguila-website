"use client";

import { useEffect, useRef, useState } from "react";
import { BusinessConciergeInstallBanner } from "@/app/admin/(dashboard)/businesses/BusinessConciergeInstallBanner";

/**
 * Program 7, Gate 7G — Mobile Staff Field Agent shell.
 * Reuses the existing Field Discovery upload pipeline (Program 4) — never a new upload path.
 * Provides: business-context quick actions, camera/file capture, dictation (feature-detected,
 * no raw audio persistence), truthful offline/network indicator, install CTA.
 *
 * Doctrine:
 * - No native app. No new paid infrastructure.
 * - No fake offline mutation success — actions requiring network show a truthful blocked state.
 * - Dictation transcribes client-side via Web Speech API when available; raw audio is never
 *   sent to or stored on the server. If unsupported, the feature is hidden — not faked.
 * - Meeting recording and transcription remain unavailable (Program 5 doctrine, unchanged).
 *
 * Package C — the install-prompt hook now lives in app/lib/pwa/useInstallPrompt.ts and is
 * shared with the main Business Concierge / Sales Workspace install surface. Behavior here is
 * unchanged.
 */

type NetworkState = "online" | "offline";

function useNetworkState(): NetworkState {
  const [state, setState] = useState<NetworkState>("online");
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    setState(navigator.onLine ? "online" : "offline");
    const on = () => setState("online");
    const off = () => setState("offline");
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return state;
}

function useDictationSupport(): boolean {
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported(Boolean(SpeechRecognition));
  }, []);
  return supported;
}

export function DictationButton({ onTranscript }: { onTranscript: (text: string) => void }) {
  const supported = useDictationSupport();
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  if (!supported) {
    return (
      <p className="text-xs text-[color:var(--lx-text-muted)]">
        Dictado no disponible en este navegador. / Dictation is not available in this browser.
      </p>
    );
  }

  function toggle() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "es-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      if (transcript) onTranscript(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`min-h-[44px] w-full rounded-lg px-3 py-2 text-xs font-semibold ${
        listening ? "bg-red-700 text-white" : "bg-[#7A1E2C] text-white"
      }`}
    >
      {listening ? "Escuchando… / Listening…" : "Dictar / Dictate"}
    </button>
  );
}

export function CameraFileCapture({
  businessId,
  onUploaded,
}: {
  businessId: string;
  onUploaded?: (fileId: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const network = useNetworkState();

  async function handleFile(file: File) {
    if (network === "offline") {
      setError("Sin conexión. No se puede subir el archivo. / Offline. Cannot upload the file.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("businessId", businessId);
      form.append("fileKind", "photo");
      form.append("file", file);
      const res = await fetch("/api/admin/field-discovery/assets/upload", {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.ok) {
        setError(String(body?.error ?? "upload_failed"));
        return;
      }
      onUploaded?.(String(body.sourceFile?.id ?? ""));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-[#1E1810]">
          Tomar foto / Take photo
        </span>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          disabled={uploading || network === "offline"}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
          className="block min-h-[44px] w-full text-xs file:mr-3 file:min-h-[44px] file:rounded-lg file:border-0 file:bg-[#7A1E2C] file:px-3 file:text-xs file:font-semibold file:text-white"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-[#1E1810]">
          Subir archivo / Upload file
        </span>
        <input
          type="file"
          disabled={uploading || network === "offline"}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
          className="block min-h-[44px] w-full text-xs file:mr-3 file:min-h-[44px] file:rounded-lg file:border-0 file:bg-[#7A1E2C] file:px-3 file:text-xs file:font-semibold file:text-white"
        />
      </label>
      {uploading ? <p className="text-xs text-[#7A7164]">Subiendo… / Uploading…</p> : null}
      {error ? <p role="alert" className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}

export function NetworkStatusIndicator() {
  const network = useNetworkState();
  return (
    <div
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
        network === "online" ? "bg-[#F3F7F4] text-[#1F3A2D]" : "bg-red-100 text-red-800"
      }`}
    >
      {network === "online" ? "En línea / Online" : "Sin conexión / Offline"}
    </div>
  );
}

export function InstallCta() {
  return <BusinessConciergeInstallBanner />;
}

export function BusinessQuickActions({ businessId }: { businessId: string }) {
  const dashboard = `/admin/businesses/${businessId}`;
  const actions: { href: string; label: string }[] = [
    { href: dashboard, label: "Open Business Dashboard" },
    { href: "/admin/businesses", label: "Staff Command Center" },
    { href: `${dashboard}#outreach`, label: "Create Follow-up" },
    { href: `${dashboard}#meetings`, label: "Meeting" },
    { href: `${dashboard}#discover`, label: "Discover" },
    { href: `${dashboard}#opportunity`, label: "Opportunities" },
    { href: `${dashboard}#outreach`, label: "Outreach" },
  ];
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {actions.map((action) => (
        <a
          key={`${action.label}-${action.href}`}
          href={action.href}
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#C9A84A]/70 bg-white px-3 py-2 text-center text-xs font-semibold text-[#1E1810]"
        >
          {action.label}
        </a>
      ))}
    </div>
  );
}
