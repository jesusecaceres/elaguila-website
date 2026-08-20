"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { adminCardBase } from "@/app/admin/_components/adminTheme";
import type {
  LeoConversationAnswer,
  LeoConversationClientContext,
  LeoConversationEntityRef,
  LeoConversationMode,
  LeoConversationPersistenceState,
  LeoResultCard,
} from "@/app/leo/_lib/leoTypes";

import { LeoComposer, LeoNewConversationButton } from "./LeoComposer";
import { LeoConversationStream } from "./LeoConversationStream";
import type { LeoStreamTurn } from "./LeoConversationTurn";
import { LeoHandsFreeMode } from "./LeoHandsFreeMode";
import { LeoSessionStatus } from "./LeoSessionStatus";
import {
  LEO_OFFLINE_SUBMIT_MESSAGE,
  LEO_PWA_DRAFT_STORAGE_KEY,
  LEO_PWA_SESSION_POINTER_KEY,
} from "@/app/leo/_lib/leoPwaCapabilities";

const SESSION_KEY = LEO_PWA_SESSION_POINTER_KEY;
const DRAFT_KEY = LEO_PWA_DRAFT_STORAGE_KEY;

const STARTER_PROMPTS = [
  "What needs my attention?",
  "Who is waiting on my reply?",
  "What commitments are overdue?",
  "What changed in LEO?",
  "What did you prepare?",
] as const;

type ApiOk = {
  ok: true;
  answer: LeoConversationAnswer;
  sessionId?: string | null;
  persistenceState?: LeoConversationPersistenceState | null;
};

type ApiErr = {
  ok: false;
  error?: string;
  message?: string;
  reason?: string;
  newSessionRequired?: boolean;
};

type HistoryOk = {
  ok: true;
  session: { id: string; mode?: string };
  turns: Array<{
    id: string;
    role: "USER" | "LEO" | "SYSTEM";
    boundedText: string;
    intent: string | null;
    resultCardRefs: string[];
    createdAt: string;
  }>;
};

function newClientRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `leo-req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readSessionPointer(): string | null {
  try {
    const v = localStorage.getItem(SESSION_KEY)?.trim();
    return v || null;
  } catch {
    return null;
  }
}

function writeSessionPointer(sessionId: string | null) {
  try {
    if (!sessionId) localStorage.removeItem(SESSION_KEY);
    else localStorage.setItem(SESSION_KEY, sessionId);
  } catch {
    /* ignore quota / private mode */
  }
}

function readDraft(): string {
  try {
    return localStorage.getItem(DRAFT_KEY) ?? "";
  } catch {
    return "";
  }
}

function writeDraft(text: string) {
  try {
    if (!text.trim()) localStorage.removeItem(DRAFT_KEY);
    else localStorage.setItem(DRAFT_KEY, text.slice(0, 2000));
  } catch {
    /* ignore */
  }
}

function historyToStream(turns: HistoryOk["turns"]): LeoStreamTurn[] {
  return turns
    .filter((t) => t.role === "USER" || t.role === "LEO")
    .slice()
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
    .map((t) => ({
      localId: t.id,
      turnId: t.id,
      role: t.role as "USER" | "LEO",
      boundedText: t.boundedText,
      createdAt: t.createdAt,
      persisted: true,
      intent: t.intent,
      resultCardRefs: t.resultCardRefs ?? [],
      answer: null,
    }));
}

export function LeoConversationPanel() {
  const [question, setQuestion] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [turns, setTurns] = useState<LeoStreamTurn[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [persistenceState, setPersistenceState] = useState<LeoConversationPersistenceState | null>(null);
  const [historyWarning, setHistoryWarning] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedEntityRef, setSelectedEntityRef] = useState<LeoConversationEntityRef | null>(null);
  const [pending, startTransition] = useTransition();
  const [online, setOnline] = useState(true);
  const [handsFree, setHandsFree] = useState(false);
  const [showFullConversation, setShowFullConversation] = useState(false);
  const [handsFreePersistWarning, setHandsFreePersistWarning] = useState<string | null>(null);
  const bootstrapped = useRef(false);
  const composerFocusRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    const draft = readDraft();
    if (draft) setQuestion(draft);

    const pointer = readSessionPointer();
    if (!pointer) {
      setRestoring(false);
      return;
    }

    void (async () => {
      try {
        const res = await fetch(`/api/leo/conversation/session?sessionId=${encodeURIComponent(pointer)}`, {
          credentials: "same-origin",
          cache: "no-store",
        });
        const data = (await res.json()) as HistoryOk | ApiErr;
        if (!res.ok || !data.ok || !("session" in data)) {
          writeSessionPointer(null);
          if ((data as ApiErr).error === "persistence_unavailable") {
            setHistoryWarning("Conversation history isn’t being saved right now.");
          } else {
            setHistoryWarning("Previous conversation couldn’t be restored. Starting fresh.");
          }
          setRestoring(false);
          return;
        }
        setSessionId(data.session.id);
        setTurns(historyToStream(data.turns));
        setPersistenceState("PERSISTED");
        // Never auto-start Hands-Free from restored session.mode.
      } catch {
        writeSessionPointer(null);
        setHistoryWarning("Previous conversation couldn’t be restored. Starting fresh.");
      } finally {
        setRestoring(false);
      }
    })();
  }, []);

  useEffect(() => {
    writeDraft(question);
  }, [question]);

  const persistConversationMode = useCallback(async (mode: LeoConversationMode) => {
    if (!sessionId) {
      setHandsFreePersistWarning(
        "Hands-Free is on this page only — conversation mode wasn’t saved.",
      );
      return;
    }
    try {
      const res = await fetch("/api/leo/conversation/session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ sessionId, mode }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setHandsFreePersistWarning(
          "Hands-Free is on this page only — conversation mode wasn’t saved.",
        );
        return;
      }
      setHandsFreePersistWarning(null);
    } catch {
      setHandsFreePersistWarning(
        "Hands-Free is on this page only — conversation mode wasn’t saved.",
      );
    }
  }, [sessionId]);

  const startHandsFree = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setError("LEO needs a connection for live company intelligence.");
      return;
    }
    setError(null);
    setHandsFree(true);
    setShowFullConversation(false);
    void persistConversationMode("HANDS_FREE");
  }, [persistConversationMode]);

  const endHandsFree = useCallback(() => {
    setHandsFree(false);
    setShowFullConversation(false);
    void persistConversationMode("TEXT");
  }, [persistConversationMode]);

  useEffect(() => {
    if (!handsFree || !sessionId) return;
    void persistConversationMode("HANDS_FREE");
  }, [handsFree, persistConversationMode, sessionId]);

  const startNewConversation = useCallback(() => {
    setSessionId(null);
    writeSessionPointer(null);
    setTurns([]);
    setError(null);
    setPersistenceState(null);
    setHistoryWarning(null);
    setSelectedCardId(null);
    setSelectedEntityRef(null);
    setHandsFree(false);
    setShowFullConversation(false);
    setHandsFreePersistWarning(null);
  }, []);

  const submit = useCallback(
    (raw: string, opts?: { retryLocalId?: string }) => {
      const trimmed = raw.trim();
      if (!trimmed || pending) return;

      // Offline: preserve draft, do not invent intelligence or fire a doomed request.
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        writeDraft(trimmed);
        setQuestion(trimmed);
        setError(LEO_OFFLINE_SUBMIT_MESSAGE);
        return;
      }

      const clientRequestId = newClientRequestId();
      const localUserId = opts?.retryLocalId ?? `local-user-${clientRequestId}`;
      const createdAt = new Date().toISOString();

      setError(null);

      setTurns((prev) => {
        const withoutFailed = opts?.retryLocalId
          ? prev.filter((t) => t.localId !== opts.retryLocalId)
          : prev;
        // Dedupe optimistic duplicate for same text+pending
        const cleaned = withoutFailed.filter(
          (t) => !(t.role === "USER" && t.pending && t.boundedText === trimmed),
        );
        return [
          ...cleaned,
          {
            localId: localUserId,
            clientRequestId,
            role: "USER",
            boundedText: trimmed,
            createdAt,
            pending: true,
            persisted: false,
          },
        ];
      });

      const clientContext: LeoConversationClientContext = {
        selectedCardId,
        selectedEntityRef,
        visibleCardIds: turns
          .flatMap((t) => t.answer?.resultCards?.map((c) => c.cardId) ?? t.resultCardRefs ?? [])
          .filter(Boolean)
          .slice(-40),
      };

      startTransition(async () => {
        try {
          const body: Record<string, unknown> = {
            question: trimmed,
            clientRequestId,
            clientContext,
          };
          if (sessionId) body.sessionId = sessionId;

          const res = await fetch("/api/leo/conversation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify(body),
          });
          const data = (await res.json()) as ApiOk | ApiErr;

          if (!res.ok || !data.ok || !("answer" in data)) {
            const errCode = data && "error" in data ? data.error : null;
            if (errCode === "session_not_found" || errCode === "session_archived") {
              writeSessionPointer(null);
              setSessionId(null);
              setError(
                (data as ApiErr).message ??
                  "That conversation is no longer available. Start a new one.",
              );
            } else {
              setError(
                (data as ApiErr).message ??
                  "Could not retrieve an answer from available Leonix evidence.",
              );
            }
            setTurns((prev) =>
              prev.map((t) =>
                t.localId === localUserId
                  ? {
                      ...t,
                      pending: false,
                      error: "Couldn’t send. You can retry.",
                    }
                  : t,
              ),
            );
            return;
          }

          const answer = data.answer;
          const nextSessionId = data.sessionId ?? answer.sessionId ?? sessionId;
          if (nextSessionId) {
            setSessionId(nextSessionId);
            writeSessionPointer(nextSessionId);
          } else if (data.persistenceState === "NOT_PERSISTED_UNAVAILABLE") {
            // keep null — do not fabricate
          }

          setPersistenceState(data.persistenceState ?? answer.persistenceState ?? null);
          setQuestion("");
          writeDraft("");

          setTurns((prev) => {
            const withoutOptimistic = prev.filter((t) => t.localId !== localUserId);
            // Drop server duplicate USER if history-style id matches clientRequestId already present
            const deduped = withoutOptimistic.filter((t) => {
              if (t.role !== "USER") return true;
              if (answer.userTurnId && t.turnId === answer.userTurnId) return false;
              return true;
            });
            const userTurn: LeoStreamTurn = {
              localId: answer.userTurnId ?? localUserId,
              turnId: answer.userTurnId ?? null,
              clientRequestId,
              role: "USER",
              boundedText: trimmed,
              createdAt,
              pending: false,
              persisted: Boolean(answer.userTurnId),
            };
            const leoTurn: LeoStreamTurn = {
              localId: answer.turnId ?? `local-leo-${clientRequestId}`,
              turnId: answer.turnId ?? null,
              role: "LEO",
              boundedText: answer.summary,
              createdAt: answer.generatedAt ?? new Date().toISOString(),
              persisted: Boolean(answer.turnId),
              intent: answer.intent,
              resultCardRefs: (answer.resultCards ?? []).map((c) => c.cardId),
              answer,
            };
            return [...deduped, userTurn, leoTurn];
          });
          composerFocusRef.current = true;
        } catch {
          setError("Could not reach LEO conversation. Try again.");
          setTurns((prev) =>
            prev.map((t) =>
              t.localId === localUserId
                ? { ...t, pending: false, error: "Network error. You can retry." }
                : t,
            ),
          );
        }
      });
    },
    [pending, selectedCardId, selectedEntityRef, sessionId, turns],
  );

  const onSelectCard = useCallback((card: LeoResultCard, entityRef: LeoConversationEntityRef) => {
    setSelectedCardId(card.cardId);
    setSelectedEntityRef(entityRef);
  }, []);

  const hasConversation = turns.length > 0;

  return (
    <section className="min-w-0" aria-labelledby="leo-ask-heading">
      <div
        className={`${adminCardBase} relative min-w-0 overflow-hidden border-[#7A1E2C]/15 p-4 shadow-[0_12px_40px_-16px_rgba(122,30,44,0.18)] sm:p-5`}
      >
        <div className="mb-3 flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="leo-ask-heading" className="text-xl font-bold tracking-tight text-[#1E1810] sm:text-2xl">
              Ask LEO
            </h2>
            <p className="mt-1 text-sm text-[#5C5346]">
              Your executive conversation — priorities, commitments, and clear next moves.
            </p>
            <div className="mt-1.5">
              <LeoSessionStatus
                persistenceState={persistenceState}
                restoring={restoring}
                historyWarning={historyWarning}
                handsFreeLocalOnly={Boolean(handsFree && handsFreePersistWarning)}
              />
            </div>
          </div>
          <LeoNewConversationButton onClick={startNewConversation} disabled={pending || restoring} />
        </div>

        {!hasConversation && !restoring && !handsFree ? (
          <div className="mb-4 flex min-w-0 flex-wrap gap-2" aria-label="Starter prompts">
            {STARTER_PROMPTS.map((q) => (
              <button
                key={q}
                type="button"
                disabled={pending}
                className="inline-flex min-h-[44px] max-w-full items-center rounded-lg border border-[color:var(--lx-border)] bg-[color:var(--lx-section)] px-3 py-2 text-left text-xs font-semibold text-[#1E1810] transition hover:bg-white disabled:opacity-60"
                onClick={() => {
                  setQuestion(q);
                  submit(q);
                }}
              >
                <span className="break-words">{q}</span>
              </button>
            ))}
          </div>
        ) : null}

        {handsFree ? (
          <LeoHandsFreeMode
            active={handsFree}
            pending={pending || restoring}
            online={online}
            latestAnswer={[...turns].reverse().find((t) => t.role === "LEO")?.answer ?? null}
            lastUserTranscript={[...turns].reverse().find((t) => t.role === "USER")?.boundedText ?? ""}
            submitError={error}
            persistWarning={handsFreePersistWarning}
            showFullConversation={showFullConversation}
            onToggleFullConversation={() => setShowFullConversation((v) => !v)}
            onSubmit={(text) => submit(text)}
            onEnded={endHandsFree}
          />
        ) : null}

        {(!handsFree || showFullConversation) ? (
        <div className="mb-3 max-h-[min(62vh,720px)] min-h-[120px] overflow-y-auto overscroll-contain pr-1">
          <LeoConversationStream
            turns={turns}
            pending={pending || handsFree}
            selectedCardId={selectedCardId}
            onAsk={(q) => {
              setQuestion(q);
              submit(q);
            }}
            onSelectCard={onSelectCard}
            onRetryUser={(localId) => {
              const t = turns.find((x) => x.localId === localId);
              if (t) submit(t.boundedText, { retryLocalId: localId });
            }}
          />
        </div>
        ) : null}

        {error && !handsFree ? (
          <p
            className={`mb-3 break-words rounded-lg border px-3 py-2 text-sm ${
              /offline/i.test(error)
                ? "border-amber-200 bg-amber-50 text-amber-950"
                : "border-rose-200 bg-rose-50 text-rose-900"
            }`}
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {!handsFree ? (
        <LeoComposer
          value={question}
          onChange={setQuestion}
          onSubmit={() => submit(question)}
          pending={pending || restoring}
          offline={!online}
          onStartHandsFree={startHandsFree}
        />
        ) : null}
      </div>
    </section>
  );
}
