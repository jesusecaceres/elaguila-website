'use client';

import { useMemo, useState } from "react";

type Props = {
  name: string;
  address?: string | null;
};

function buildMapsUrl(name: string, address: string) {
  const q = encodeURIComponent(`${name} ${address}`.trim());
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export default function ShareMapBar({ name, address }: Props) {
  const [copied, setCopied] = useState(false);

  const mapsUrl = useMemo(() => {
    const a = (address || "").trim();
    if (!a) return "";
    return buildMapsUrl(name, a);
  }, [name, address]);

  async function onShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `${name}${address ? ` — ${address}` : ""}`;

    const nav: any = typeof navigator !== "undefined" ? navigator : null;
    try {
      if (nav?.share) {
        await nav.share({ title: name, text, url });
        return;
      }
    } catch {
      // fall through to clipboard
    }

    if (url) {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      } catch {
        // ignore
      }
    }
  }

  async function onCopyAddress() {
    const a = (address || "").trim();
    if (!a) return;
    try {
      await navigator.clipboard.writeText(a);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  }

  if (!mapsUrl && !(address || "").trim()) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {mapsUrl ? (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-100"
        >
          Open in Maps
        </a>
      ) : null}

      <button
        type="button"
        onClick={onShare}
        className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-100"
      >
        Share
      </button>

      {address ? (
        <button
          type="button"
          onClick={onCopyAddress}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-100"
        >
          {copied ? "Copied" : "Copy address"}
        </button>
      ) : null}
    </div>
  );
}
