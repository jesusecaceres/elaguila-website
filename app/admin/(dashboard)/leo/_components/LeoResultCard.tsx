"use client";

import type { ReactNode } from "react";

import type {
  LeoCalendarResultCard,
  LeoCommitmentResultCard,
  LeoConversationEntityRef,
  LeoEmailResultCard,
  LeoPreparedActionResultCard,
  LeoProjectResultCard,
  LeoResultCard,
} from "@/app/leo/_lib/leoTypes";

import { LeoActionBar } from "./LeoActionBar";
import {
  formatOwnerDateTime,
  presentCommitmentDueState,
  presentCommitmentKindLabel,
  presentEmailAttentionLabel,
  presentPreparedLifecycleLabel,
  scrubOwnerFacingText,
} from "./leoOwnerPresentation";

function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "warn" | "danger" | "safe" | "gold";
}) {
  const cls =
    tone === "danger"
      ? "border-rose-200 bg-rose-50 text-rose-900"
      : tone === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-950"
        : tone === "safe"
          ? "border-[#2A4536]/25 bg-[#EEF4F0] text-[#2A4536]"
          : tone === "gold"
            ? "border-[#C9B46A]/50 bg-[#FFFCF7] text-[#5C4E2E]"
            : "border-[color:var(--lx-border)] bg-[color:var(--lx-section)] text-[#5C5346]";
  return (
    <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cls}`}>
      {children}
    </span>
  );
}

function entityRefForCard(card: LeoResultCard): LeoConversationEntityRef {
  switch (card.kind) {
    case "EMAIL":
      return {
        system: "GOOGLE_GMAIL",
        kind: "EMAIL",
        id: card.threadId || card.messageId,
        label: card.subject ?? card.title,
      };
    case "CALENDAR":
      return {
        system: "GOOGLE_CALENDAR",
        kind: "CALENDAR",
        id: card.eventId,
        label: card.title,
      };
    case "COMMITMENT":
      return {
        system: "LEO",
        kind: "COMMITMENT",
        id: card.commitmentId,
        label: card.title,
      };
    case "PROJECT":
      return {
        system: "GITHUB",
        kind: "PROJECT",
        id: card.commitSha || card.deploymentId || card.repository || card.cardId,
        label: card.title,
      };
    case "CLIENT":
      return {
        system: "LEONIX",
        kind: "CLIENT",
        id: card.entityRef.id ?? card.cardId,
        label: card.displayName,
      };
    case "PREPARED_ACTION":
      return {
        system: "LEO",
        kind: "PREPARED_ACTION",
        id: card.preparationId,
        label: card.title,
      };
    default:
      return { system: "LEO", kind: card.kind, id: card.cardId, label: card.title };
  }
}

function EmailBody({ card }: { card: LeoEmailResultCard }) {
  return (
    <>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Badge tone="warn">{presentEmailAttentionLabel(card.attentionLabel)}</Badge>
        {card.readState === "UNREAD" ? <Badge>Unread</Badge> : null}
        {card.readState === "READ" ? <Badge>Read</Badge> : null}
      </div>
      <p className="mt-2 break-words text-sm font-semibold text-[#1E1810]">
        {scrubOwnerFacingText(card.subject || card.title || "(no subject)")}
      </p>
      <p className="mt-1 break-words text-xs text-[#5C5346]">
        <span className="font-semibold text-[#1E1810]">
          {card.senderDisplayName || card.senderAddress || "Unknown sender"}
        </span>
        {card.senderAddress && card.senderDisplayName ? (
          <span className="text-[#5C5346]/80"> · {card.senderAddress}</span>
        ) : null}
      </p>
      {card.snippet ? (
        <p className="mt-2 break-words text-sm leading-relaxed text-[#5C5346]">
          {scrubOwnerFacingText(card.snippet)}
        </p>
      ) : null}
      {formatOwnerDateTime(card.receivedAt) ? (
        <p className="mt-2 text-[11px] text-[#5C5346]/85">{formatOwnerDateTime(card.receivedAt)}</p>
      ) : null}
      {card.whyItMatters ? (
        <p className="mt-2 break-words text-xs text-[#5C5346]">
          <span className="font-semibold text-[#1E1810]">Why it matters: </span>
          {scrubOwnerFacingText(card.whyItMatters)}
        </p>
      ) : null}
    </>
  );
}

function CalendarBody({ card }: { card: LeoCalendarResultCard }) {
  return (
    <>
      <p className="break-words text-sm font-semibold text-[#1E1810]">{scrubOwnerFacingText(card.title)}</p>
      {formatOwnerDateTime(card.start) ? (
        <p className="mt-1 text-xs text-[#5C5346]">
          {formatOwnerDateTime(card.start)}
          {card.durationMinutes != null ? ` · ${card.durationMinutes} min` : null}
        </p>
      ) : null}
      {card.attendees?.length ? (
        <p className="mt-2 break-words text-xs text-[#5C5346]">
          Attendees: {card.attendees.map((a) => a.displayName || a.email).filter(Boolean).slice(0, 6).join(", ")}
        </p>
      ) : null}
      {card.location ? (
        <p className="mt-1 break-words text-xs text-[#5C5346]">Location: {scrubOwnerFacingText(card.location)}</p>
      ) : null}
      {card.meetingUrl ? (
        <p className="mt-1 break-words text-xs text-[#2A4536]">Meeting link available</p>
      ) : null}
      {card.preparationState && card.preparationState !== "NONE" ? (
        <div className="mt-2">
          <Badge tone="gold">
            {card.preparationState === "PREPARED" ? "Prepared" : "Not executed"}
          </Badge>
        </div>
      ) : null}
      {card.whyItMatters ? (
        <p className="mt-2 break-words text-xs text-[#5C5346]">
          <span className="font-semibold text-[#1E1810]">Why it matters: </span>
          {scrubOwnerFacingText(card.whyItMatters)}
        </p>
      ) : null}
    </>
  );
}

function CommitmentBody({ card }: { card: LeoCommitmentResultCard }) {
  const dueTone =
    card.derivedDueState === "OVERDUE" ? "danger" : card.derivedDueState === "DUE_TODAY" ? "warn" : "neutral";
  return (
    <>
      <div className="flex min-w-0 flex-wrap gap-2">
        <Badge tone="gold">{presentCommitmentKindLabel(card.commitmentKind)}</Badge>
        {card.derivedDueState ? (
          <Badge tone={dueTone}>{presentCommitmentDueState(card.derivedDueState)}</Badge>
        ) : null}
        <Badge>{humanStatus(card.status)}</Badge>
      </div>
      <p className="mt-2 break-words text-sm font-semibold text-[#1E1810]">
        {scrubOwnerFacingText(card.title)}
      </p>
      {formatOwnerDateTime(card.dueAt) ? (
        <p className="mt-1 text-xs text-[#5C5346]">Due {formatOwnerDateTime(card.dueAt)}</p>
      ) : null}
      {card.counterparty ? (
        <p className="mt-1 break-words text-xs text-[#5C5346]">With {scrubOwnerFacingText(card.counterparty)}</p>
      ) : null}
      {card.whyItMatters ? (
        <p className="mt-2 break-words text-xs text-[#5C5346]">
          <span className="font-semibold text-[#1E1810]">Why it matters: </span>
          {scrubOwnerFacingText(card.whyItMatters)}
        </p>
      ) : null}
    </>
  );
}

function humanStatus(status: string): string {
  return status
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

function ProjectBody({ card }: { card: LeoProjectResultCard }) {
  return (
    <>
      <p className="break-words text-sm font-semibold text-[#1E1810]">
        {scrubOwnerFacingText(card.projectName || card.repository || card.title)}
      </p>
      <p className="mt-1 break-words text-xs text-[#5C5346]">
        {[card.repository, card.branch].filter(Boolean).join(" · ")}
      </p>
      {card.commitMessage ? (
        <p className="mt-2 break-words text-xs text-[#5C5346]">{scrubOwnerFacingText(card.commitMessage)}</p>
      ) : null}
      {card.whatChanged ? (
        <p className="mt-2 break-words text-xs text-[#5C5346]">
          <span className="font-semibold text-[#1E1810]">What changed: </span>
          {scrubOwnerFacingText(card.whatChanged)}
        </p>
      ) : null}
      <div className="mt-2 flex min-w-0 flex-wrap gap-2">
        {card.deploymentState ? <Badge>{humanStatus(card.deploymentState)}</Badge> : null}
        {card.environment ? <Badge>{card.environment}</Badge> : null}
        {card.launchRisk && card.launchRisk !== "UNKNOWN" ? (
          <Badge tone="warn">{scrubOwnerFacingText(card.launchRisk)}</Badge>
        ) : null}
      </div>
      {card.whyItMatters ? (
        <p className="mt-2 break-words text-xs text-[#5C5346]">
          <span className="font-semibold text-[#1E1810]">Why it matters: </span>
          {scrubOwnerFacingText(card.whyItMatters)}
        </p>
      ) : null}
    </>
  );
}

function PreparedBody({ card }: { card: LeoPreparedActionResultCard }) {
  const life = presentPreparedLifecycleLabel(card.preparationStatus);
  const tone =
    life.tone === "prepared"
      ? "gold"
      : life.tone === "verified"
        ? "safe"
        : life.tone === "failed"
          ? "danger"
          : life.tone === "executed"
            ? "warn"
            : "neutral";
  return (
    <>
      <div className="flex min-w-0 flex-wrap gap-2">
        <Badge tone={tone}>{life.primary}</Badge>
        {life.secondary ? <Badge tone="gold">{life.secondary}</Badge> : null}
      </div>
      <p className="mt-2 break-words text-sm font-semibold text-[#1E1810]">
        {scrubOwnerFacingText(card.title)}
      </p>
      {card.draftBodyPreview ? (
        <p className="mt-2 break-words rounded-lg border border-[#C9B46A]/35 bg-[#FFFCF7] px-3 py-2 text-xs leading-relaxed text-[#5C5346]">
          {scrubOwnerFacingText(card.draftBodyPreview)}
        </p>
      ) : null}
      {card.whyItMatters ? (
        <p className="mt-2 break-words text-xs text-[#5C5346]">
          {scrubOwnerFacingText(card.whyItMatters)}
        </p>
      ) : null}
      <p className="mt-2 text-[11px] font-semibold text-[#5C4E2E]">Useful draft — not sent.</p>
    </>
  );
}

function GenericBody({ card }: { card: LeoResultCard }) {
  return (
    <>
      <p className="break-words text-sm font-semibold text-[#1E1810]">{scrubOwnerFacingText(card.title)}</p>
      {card.subtitle ? (
        <p className="mt-1 break-words text-xs text-[#5C5346]">{scrubOwnerFacingText(card.subtitle)}</p>
      ) : null}
      {card.whyItMatters ? (
        <p className="mt-2 break-words text-xs text-[#5C5346]">{scrubOwnerFacingText(card.whyItMatters)}</p>
      ) : null}
    </>
  );
}

export function LeoResultCardView({
  card,
  selected,
  pending,
  onSelect,
  onAsk,
}: {
  card: LeoResultCard;
  selected?: boolean;
  pending?: boolean;
  onSelect: (card: LeoResultCard, entityRef: LeoConversationEntityRef) => void;
  onAsk: (q: string) => void;
}) {
  const entityRef = entityRefForCard(card);

  return (
    <article
      className={`min-w-0 rounded-2xl border bg-white/90 p-3 shadow-[0_8px_24px_-16px_rgba(42,36,22,0.18)] sm:p-4 ${
        selected
          ? "border-[#7A1E2C]/45 ring-2 ring-[#C9B46A]/40"
          : "border-[color:var(--lx-border)]/70"
      }`}
    >
      <button
        type="button"
        className="w-full min-w-0 text-left"
        onClick={() => onSelect(card, entityRef)}
        aria-pressed={selected}
      >
        {card.kind === "EMAIL" ? (
          <EmailBody card={card} />
        ) : card.kind === "CALENDAR" ? (
          <CalendarBody card={card} />
        ) : card.kind === "COMMITMENT" ? (
          <CommitmentBody card={card} />
        ) : card.kind === "PROJECT" ? (
          <ProjectBody card={card} />
        ) : card.kind === "PREPARED_ACTION" ? (
          <PreparedBody card={card} />
        ) : (
          <GenericBody card={card} />
        )}
      </button>
      <LeoActionBar card={card} actions={card.actions ?? []} pending={pending} onAsk={onAsk} />
    </article>
  );
}

export { entityRefForCard };
