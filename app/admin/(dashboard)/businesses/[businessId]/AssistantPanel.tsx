"use client";

import { useState } from "react";

/**
 * Program 7 — Admin UI panel for Contextual Business Concierge Assistant.
 * Server data is passed in as props. Client-side interactions use fetch.
 * businessId scopes the API. threadId is the conversation inside that business.
 */

export type ThreadRow = {
  id: string;
  status: string;
  titleEn: string | null;
  titleEs: string | null;
  primaryContextType: string;
  lastMessageAt: string | null;
  createdAt: string;
};

type MessageRow = { id: string; role: string; content: string; createdAt: string };

export function AssistantPanel({ businessId, threads }: { businessId: string; threads: ThreadRow[] }) {
  const [expanded, setExpanded] = useState(true);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMessages(threadId: string) {
    setSelectedThreadId(threadId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/businesses/${businessId}/assistant/${threadId}`);
      if (!res.ok) {
        setMessages([]);
        setError("Assistant messages could not be loaded for this business.");
        return;
      }
      const data = await res.json();
      setMessages(data.messages ?? []);
    } catch {
      setMessages([]);
      setError("Assistant messages could not be loaded for this business.");
    }
  }

  async function handleStartThread() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/businesses/${businessId}/assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryContextType: "general" }),
      });
      if (!res.ok) {
        setError("A new assistant thread could not be opened.");
        return;
      }
      window.location.reload();
    } catch {
      setError("A new assistant thread could not be opened.");
    } finally {
      setCreating(false);
    }
  }

  async function handleSend() {
    if (!draft.trim() || !selectedThreadId) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/businesses/${businessId}/assistant/${selectedThreadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draft }),
      });
      const data = await res.json().catch(() => null);
      if (Array.isArray(data?.messages)) {
        setMessages(data.messages);
      }
      if (!res.ok) {
        if (data?.failureCode === "provider_unavailable") {
          setError("Assistant provider is unavailable. No assistant answer was invented.");
        } else {
          setError(typeof data?.failureReason === "string" ? data.failureReason : "Assistant request failed. No fake answer is shown.");
        }
        return;
      }
      setDraft("");
    } catch {
      setError("Assistant request failed. No fake answer is shown.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-[color:var(--lx-border)] bg-[color:var(--lx-card)] p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex min-h-[44px] w-full items-center justify-between text-left"
      >
        <h3 className="text-sm font-bold text-[color:var(--lx-text)]">
          Business Concierge Assistant ({threads.length} threads)
        </h3>
        <span className="text-xs text-[color:var(--lx-text-muted)]">{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-[#7A7164]">
            Assistant may READ, EXPLAIN, SUMMARIZE, GUIDE, DRAFT, or SUGGEST. It cannot execute, charge, approve, publish, send, or rewrite facts.
          </p>
          {error ? <p className="text-xs text-[#7A1E2C]">{error}</p> : null}
          {threads.length === 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-[color:var(--lx-text-muted)]">No assistant thread is open yet.</p>
              <button
                onClick={() => void handleStartThread()}
                disabled={creating}
                className="inline-flex min-h-[44px] items-center rounded bg-[#7A1E2C] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                Start assistant thread
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {threads.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => void loadMessages(t.id)}
                    className={`inline-flex min-h-[44px] items-center rounded px-3 py-2 text-xs font-semibold ${
                      selectedThreadId === t.id
                        ? "bg-[#7A1E2C] text-white"
                        : "bg-[color:var(--lx-badge-bg)] text-[color:var(--lx-text)]"
                    }`}
                  >
                    {t.titleEn ?? t.primaryContextType}
                  </button>
                ))}
                <button
                  onClick={() => void handleStartThread()}
                  disabled={creating}
                  className="inline-flex min-h-[44px] items-center rounded border border-[#D9C9A7] bg-[#FFFDF7] px-3 py-2 text-xs font-semibold text-[#1E1810] disabled:opacity-50"
                >
                  New thread
                </button>
              </div>
              {selectedThreadId && (
                <div className="mt-3 space-y-1">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`break-words rounded p-2 text-xs ${
                        m.role === "assistant"
                          ? "bg-[color:var(--lx-badge-bg)]"
                          : "bg-[color:var(--lx-card)] border border-[color:var(--lx-border)]"
                      }`}
                    >
                      <span className="font-semibold">{m.role}:</span> {m.content}
                    </div>
                  ))}
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Type a message..."
                      className="min-h-[44px] flex-1 rounded border border-[color:var(--lx-border)] px-3 py-2 text-xs"
                    />
                    <button
                      onClick={() => void handleSend()}
                      disabled={sending || !draft.trim()}
                      className="inline-flex min-h-[44px] items-center justify-center rounded bg-[#7A1E2C] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
