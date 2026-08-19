"use client";

import type {
  LeoConversationAnswer,
  LeoConversationEntityRef,
  LeoResultCard,
} from "@/app/leo/_lib/leoTypes";

import { LeoResultCardView } from "./LeoResultCard";
import { LeoSpeechResponseControls } from "./LeoVoiceControls";
import {
  formatOwnerDateTime,
  presentGovernanceBanner,
  scrubOwnerFacingText,
} from "./leoOwnerPresentation";

export type LeoStreamTurn = {
  localId: string;
  clientRequestId?: string | null;
  role: "USER" | "LEO";
  boundedText: string;
  createdAt: string;
  persisted?: boolean;
  pending?: boolean;
  error?: string | null;
  turnId?: string | null;
  intent?: string | null;
  resultCardRefs?: string[];
  /** Live answer payload — only for current LEO responses with rich cards. */
  answer?: LeoConversationAnswer | null;
};

function PreparedLegacyBlock({ answer }: { answer: LeoConversationAnswer }) {
  const prepared = answer.preparedAction;
  if (!prepared) return null;
  return (
    <div className="mt-3 rounded-xl border border-[#C9B46A]/50 bg-[#FFFCF7] p-3">
      <div className="flex min-w-0 flex-wrap gap-2">
        <span className="rounded-md border border-[#2A4536]/30 bg-[#EEF4F0] px-2 py-0.5 text-[10px] font-bold uppercase text-[#2A4536]">
          Prepared
        </span>
        <span className="rounded-md border border-[#C9B46A]/60 bg-white/80 px-2 py-0.5 text-[10px] font-bold uppercase text-[#5C4E2E]">
          Not executed
        </span>
      </div>
      <p className="mt-2 break-words text-sm font-semibold text-[#1E1810]">{prepared.title}</p>
      <p className="mt-1 break-words text-xs leading-relaxed text-[#5C5346]">{prepared.purpose}</p>
    </div>
  );
}

export function LeoConversationTurnView({
  turn,
  isLatestLeo,
  selectedCardId,
  pending,
  onAsk,
  onSelectCard,
  onRetry,
}: {
  turn: LeoStreamTurn;
  isLatestLeo?: boolean;
  selectedCardId?: string | null;
  pending?: boolean;
  onAsk: (q: string) => void;
  onSelectCard: (card: LeoResultCard, entityRef: LeoConversationEntityRef) => void;
  onRetry?: () => void;
}) {
  if (turn.role === "USER") {
    return (
      <div className="flex justify-end" data-role="user-turn">
        <div className="max-w-[92%] rounded-2xl rounded-br-md border border-[color:var(--lx-border)]/60 bg-[color:var(--lx-section)] px-3.5 py-2.5 sm:max-w-[75%]">
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[#1E1810]">
            {turn.boundedText}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-[#5C5346]/80">
            {formatOwnerDateTime(turn.createdAt) ? <span>{formatOwnerDateTime(turn.createdAt)}</span> : null}
            {turn.pending ? <span>Sending…</span> : null}
            {turn.persisted === false && !turn.pending && !turn.error ? <span>Not saved yet</span> : null}
            {turn.error ? (
              <span className="font-semibold text-rose-800" role="alert">
                {turn.error}
              </span>
            ) : null}
            {turn.error && onRetry ? (
              <button type="button" className="font-bold text-[#7A1E2C] underline" onClick={onRetry}>
                Retry
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  const answer = turn.answer ?? null;
  const cards = answer?.resultCards ?? null;
  const governance = presentGovernanceBanner(answer?.governance?.level ?? null);
  const suggestions = isLatestLeo ? (answer?.suggestedQuestions ?? []).slice(0, 3) : [];
  const keyPoints = answer?.keyPoints ?? [];

  return (
    <div className="flex justify-start" data-role="leo-turn">
      <div className="w-full max-w-3xl min-w-0 space-y-3 rounded-2xl border border-[#7A1E2C]/12 bg-white/90 p-3.5 shadow-[0_10px_28px_-18px_rgba(122,30,44,0.22)] sm:p-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#A67C52]">LEO</p>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm font-semibold leading-relaxed text-[#1E1810]">
            {scrubOwnerFacingText(answer?.summary ?? turn.boundedText)}
          </p>
          {formatOwnerDateTime(turn.createdAt) ? (
            <p className="mt-1 text-[10px] text-[#5C5346]/80">{formatOwnerDateTime(turn.createdAt)}</p>
          ) : null}
        </div>

        {governance?.show ? (
          <p
            className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
              governance.tone === "red"
                ? "border-rose-200 bg-rose-50 text-rose-900"
                : governance.tone === "never"
                  ? "border-[#1E1810]/20 bg-[#F4F1EA] text-[#1E1810]"
                  : "border-[#C9B46A]/50 bg-[#FFFCF7] text-[#5C4E2E]"
            }`}
          >
            {governance.text}
          </p>
        ) : null}

        {keyPoints.length > 0 ? (
          <ul className="space-y-1.5">
            {keyPoints.slice(0, 5).map((kp, i) => (
              <li key={`kp-${turn.localId}-${i}`} className="break-words text-xs leading-relaxed text-[#5C5346]">
                {scrubOwnerFacingText(kp.text)}
              </li>
            ))}
          </ul>
        ) : null}

        {cards && cards.length > 0 ? (
          <div className="space-y-3" data-result-cards>
            {cards.map((card) => (
              <LeoResultCardView
                key={card.cardId}
                card={card}
                selected={selectedCardId === card.cardId}
                pending={pending}
                onSelect={onSelectCard}
                onAsk={onAsk}
              />
            ))}
          </div>
        ) : turn.resultCardRefs && turn.resultCardRefs.length > 0 ? (
          <p className="text-[11px] text-[#5C5346]">
            Earlier results referenced ({turn.resultCardRefs.length}). Full cards are available on live answers.
          </p>
        ) : null}

        {answer ? <PreparedLegacyBlock answer={answer} /> : null}

        {answer ? (
          <details className="min-w-0">
            <summary className="cursor-pointer text-xs font-bold uppercase tracking-wide text-[#A67C52]">
              Why LEO says this
            </summary>
            <div className="mt-2 space-y-2 border-t border-[color:var(--lx-border)]/50 pt-2">
              {answer.evidence.length > 0 ? (
                <ul className="space-y-1.5">
                  {answer.evidence.slice(0, 8).map((e, i) => (
                    <li key={`${turn.localId}-ev-${i}`} className="break-words text-xs text-[#5C5346]">
                      {scrubOwnerFacingText(e.summary)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#5C5346]">No additional evidence rows for this answer.</p>
              )}
              {answer.unknowns.slice(0, 4).map((u, i) => (
                <p key={`${turn.localId}-unk-${i}`} className="break-words text-xs text-[#5C5346]">
                  · {scrubOwnerFacingText(u)}
                </p>
              ))}
              {answer.limitations
                .filter((l) => !/Conversation history persistence/i.test(l))
                .slice(0, 4)
                .map((l, i) => (
                  <p key={`${turn.localId}-lim-${i}`} className="break-words text-xs text-[#5C5346]">
                    · {scrubOwnerFacingText(l)}
                  </p>
                ))}
              {answer.governance?.blockedReason ? (
                <p className="break-words text-xs text-[#5C5346]">
                  · {scrubOwnerFacingText(answer.governance.blockedReason)}
                </p>
              ) : null}
            </div>
          </details>
        ) : null}

        {isLatestLeo && answer ? <LeoSpeechResponseControls answer={answer} /> : null}

        {suggestions.length > 0 ? (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#A67C52]">Ask next</p>
            <div className="mt-2 flex min-w-0 flex-wrap gap-2">
              {suggestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={pending}
                  className="inline-flex min-h-[44px] max-w-full items-center rounded-lg border border-[color:var(--lx-border)] bg-[color:var(--lx-section)] px-3 py-2 text-left text-xs font-semibold text-[#1E1810] transition hover:bg-white disabled:opacity-60"
                  onClick={() => onAsk(q)}
                >
                  <span className="break-words">{q}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
