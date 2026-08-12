"use client";

import { useState } from "react";

/**
 * Program 7 — Admin UI panel for Contextual Business Concierge Assistant.
 * Server data is passed in as props. Client-side interactions use fetch.
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

export function AssistantPanel({ threads }: { threads: ThreadRow[] }) {
  const [expanded, setExpanded] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ id: string; role: string; content: string; createdAt: string }[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  async function loadMessages(threadId: string) {
    setSelectedThreadId(threadId);
    try {
      const res = await fetch(`/api/admin/businesses/${threadId}/assistant/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
      }
    } catch {
      setMessages([]);
    }
  }

  async function handleSend() {
    if (!draft.trim() || !selectedThreadId) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/businesses/${selectedThreadId}/assistant/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draft, role: "user" }),
      });
      if (res.ok) {
        setDraft("");
        await loadMessages(selectedThreadId);
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-6 rounded-lg border border-[color:var(--lx-border)] bg-[color:var(--lx-card)] p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-left"
      >
        <h3 className="text-sm font-bold text-[color:var(--lx-text)]">
          Program 7 — Business Concierge Assistant ({threads.length} threads)
        </h3>
        <span className="text-xs text-[color:var(--lx-text-muted)]">{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded && (
        <div className="mt-3 space-y-2">
          {threads.length === 0 ? (
            <p className="text-xs text-[color:var(--lx-text-muted)]">No assistant threads yet.</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {threads.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => loadMessages(t.id)}
                    className={`rounded px-2 py-1 text-xs font-semibold ${
                      selectedThreadId === t.id
                        ? "bg-[#7A1E2C] text-white"
                        : "bg-[color:var(--lx-badge-bg)] text-[color:var(--lx-text)]"
                    }`}
                  >
                    {t.titleEn ?? t.primaryContextType}
                  </button>
                ))}
              </div>
              {selectedThreadId && (
                <div className="mt-3 space-y-1">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`rounded p-2 text-xs ${
                        m.role === "assistant"
                          ? "bg-[color:var(--lx-badge-bg)]"
                          : "bg-[color:var(--lx-card)] border border-[color:var(--lx-border)]"
                      }`}
                    >
                      <span className="font-semibold">{m.role}:</span> {m.content}
                    </div>
                  ))}
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 rounded border border-[color:var(--lx-border)] px-2 py-1 text-xs"
                    />
                    <button
                      onClick={handleSend}
                      disabled={sending || !draft.trim()}
                      className="rounded bg-[#7A1E2C] px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
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
