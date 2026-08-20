/**
 * LEO-18A — Trusted Entity Resolution Foundation (pure).
 *
 * Converts bounded language + available evidence into entity candidates with
 * confidence and ambiguity truth. Fail-closed: never invents identity, email,
 * calendar events, or relationships.
 *
 * No provider calls. No OAuth. No external writes.
 * Future adapters (Google People, Gmail, Calendar, Leonix entities) are
 * reserved as contracts only.
 */

export const LEO_ENTITY_CATEGORIES = [
  "PERSON",
  "BUSINESS",
  "EMAIL_ADDRESS",
  "CALENDAR_EVENT",
  "CONVERSATION_THREAD",
  "LEONIX_ENTITY",
] as const;

export type LeoEntityCategory = (typeof LEO_ENTITY_CATEGORIES)[number];

export const LEO_ENTITY_CONFIDENCE_LEVELS = ["EXACT", "STRONG", "WEAK", "NONE"] as const;
export type LeoEntityConfidence = (typeof LEO_ENTITY_CONFIDENCE_LEVELS)[number];

export const LEO_ENTITY_RESOLUTION_STATES = [
  "RESOLVED",
  "LIKELY",
  "AMBIGUOUS",
  "UNRESOLVED",
] as const;
export type LeoEntityResolutionState = (typeof LEO_ENTITY_RESOLUTION_STATES)[number];

/**
 * Evidence sources. FUTURE_* values are reserved for later provider adapters
 * and must never be emitted as live proof in this gate.
 */
export const LEO_ENTITY_EVIDENCE_SOURCES = [
  "UTTERANCE_LITERAL",
  "CONVERSATION_REFERENT",
  "ACTIVE_CONTEXT",
  "RESULT_CARD",
  "OWNER_SUPPLIED_EVIDENCE",
  "FUTURE_GOOGLE_PEOPLE",
  "FUTURE_GMAIL_THREAD",
  "FUTURE_CALENDAR_EVENT",
  "FUTURE_LEONIX_BUSINESS",
  "FUTURE_LEONIX_CLIENT",
  "FUTURE_LEONIX_ADVERTISER",
] as const;

export type LeoEntityEvidenceSource = (typeof LEO_ENTITY_EVIDENCE_SOURCES)[number];

export const LEO_FUTURE_ENTITY_PROVIDERS = [
  "GOOGLE_PEOPLE",
  "GMAIL_THREADS",
  "CALENDAR_EVENTS",
  "LEONIX_BUSINESSES",
  "LEONIX_CLIENTS",
  "LEONIX_ADVERTISERS",
] as const;

export type LeoFutureEntityProvider = (typeof LEO_FUTURE_ENTITY_PROVIDERS)[number];

/** Contract-only future adapter shape — not implemented / not connected. */
export type LeoEntityProviderAdapterContract = {
  provider: LeoFutureEntityProvider;
  /** Reserved. Must not be called in LEO-18A. */
  lookup?: never;
};

export type LeoEntityEvidence = {
  matchedOn: string;
  reason: string;
  source: LeoEntityEvidenceSource;
  sourceRef?: string | null;
};

export type LeoEntityCandidate = {
  candidateId: string;
  category: LeoEntityCategory;
  displayLabel: string;
  /**
   * Proven stable identifier only (email, threadId, eventId, leonix id).
   * Null when identity is not proven — never invent.
   */
  provenIdentifier: string | null;
  confidence: LeoEntityConfidence;
  evidence: LeoEntityEvidence[];
};

export type LeoEntityKnownPerson = {
  label: string;
  email?: string | null;
  id?: string | null;
};

export type LeoEntityKnownBusiness = {
  label: string;
  id?: string | null;
};

export type LeoEntityResolutionQuery = {
  /** Bounded user language fragment (name, email, "that email", etc.). */
  rawText: string;
  expectedCategories?: readonly LeoEntityCategory[];
  /** Exact emails already proven in utterance or trusted evidence bag. */
  knownEmails?: readonly string[];
  knownThreadIds?: readonly string[];
  knownEventIds?: readonly string[];
  knownPersons?: readonly LeoEntityKnownPerson[];
  knownBusinesses?: readonly LeoEntityKnownBusiness[];
  /** Optional referent-derived hints — never authority by themselves. */
  referentThreadId?: string | null;
  referentEventId?: string | null;
  referentMessageId?: string | null;
  referentLabel?: string | null;
  referentKind?: string | null;
};

export type LeoEntityResolutionResult = {
  query: LeoEntityResolutionQuery;
  state: LeoEntityResolutionState;
  confidence: LeoEntityConfidence;
  candidates: LeoEntityCandidate[];
  ambiguity: boolean;
  clarificationRequired: boolean;
  clarification: string | null;
  /**
   * True only when a single candidate has proven identity at EXACT or STRONG
   * confidence. Required before governed proposal approval readiness.
   */
  proposalSafe: boolean;
  notClaiming: readonly string[];
};

export const LEO_18A_ENTITY_NOT_CLAIMING = [
  "Not inventing email addresses",
  "Not inventing calendar events",
  "Not inventing people or businesses",
  "Not guessing relationships",
  "Name alone is not a proven identity",
  "No provider lookup in this gate",
] as const;

const LIVE_SOURCES: ReadonlySet<LeoEntityEvidenceSource> = new Set([
  "UTTERANCE_LITERAL",
  "CONVERSATION_REFERENT",
  "ACTIVE_CONTEXT",
  "RESULT_CARD",
  "OWNER_SUPPLIED_EVIDENCE",
]);

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function extractExactEmail(text: string): string | null {
  const m = text.match(/\b([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})\b/i);
  return m?.[1]?.trim().toLowerCase() ?? null;
}

function looksLikePersonName(text: string): string | null {
  const n = text.trim();
  // Reject pronouns / referent phrases / days.
  if (
    /^(that|this|it|the|a|an|my|our|customer|client|business|email|meeting|event|thread)$/i.test(
      n,
    )
  ) {
    return null;
  }
  if (
    /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tomorrow)$/i.test(n)
  ) {
    return null;
  }
  const m = n.match(/^([A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)?)$/);
  return m?.[1]?.trim() ?? null;
}

function candidateId(category: LeoEntityCategory, key: string): string {
  return `${category}:${normalize(key).slice(0, 120)}`;
}

function rankConfidence(c: LeoEntityConfidence): number {
  switch (c) {
    case "EXACT":
      return 4;
    case "STRONG":
      return 3;
    case "WEAK":
      return 2;
    default:
      return 1;
  }
}

function bestConfidence(candidates: LeoEntityCandidate[]): LeoEntityConfidence {
  let best: LeoEntityConfidence = "NONE";
  for (const c of candidates) {
    if (rankConfidence(c.confidence) > rankConfidence(best)) best = c.confidence;
  }
  return best;
}

function isProposalSafe(state: LeoEntityResolutionState, candidates: LeoEntityCandidate[]): boolean {
  if (state !== "RESOLVED" && state !== "LIKELY") return false;
  if (candidates.length !== 1) return false;
  const only = candidates[0];
  if (!only.provenIdentifier) return false;
  if (only.confidence !== "EXACT" && only.confidence !== "STRONG") return false;
  // Live evidence only — never FUTURE_* as proof.
  return only.evidence.some((e) => LIVE_SOURCES.has(e.source));
}

function wantsCategory(
  query: LeoEntityResolutionQuery,
  category: LeoEntityCategory,
): boolean {
  if (!query.expectedCategories || query.expectedCategories.length === 0) return true;
  return query.expectedCategories.includes(category);
}

/**
 * Resolve a bounded entity query against available evidence only.
 * Fail-closed on ambiguity and missing proof.
 */
export function resolveLeoEntity(query: LeoEntityResolutionQuery): LeoEntityResolutionResult {
  const raw = (query.rawText ?? "").trim();
  const candidates: LeoEntityCandidate[] = [];
  const n = normalize(raw);

  // 1) Exact email literal in utterance or knownEmails
  if (wantsCategory(query, "EMAIL_ADDRESS")) {
    const fromText = extractExactEmail(raw);
    const knownExact = (query.knownEmails ?? [])
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
      .find((e) => e === fromText || (!fromText && (query.knownEmails?.length ?? 0) === 1 && e));

    const email = fromText ?? (knownExact && (query.knownEmails?.length ?? 0) === 1 ? knownExact : null);

    if (fromText) {
      candidates.push({
        candidateId: candidateId("EMAIL_ADDRESS", fromText),
        category: "EMAIL_ADDRESS",
        displayLabel: fromText,
        provenIdentifier: fromText,
        confidence: "EXACT",
        evidence: [
          {
            matchedOn: fromText,
            reason: "Exact email address present in utterance.",
            source: "UTTERANCE_LITERAL",
            sourceRef: fromText,
          },
        ],
      });
    } else if (email && (query.knownEmails?.length ?? 0) === 1) {
      candidates.push({
        candidateId: candidateId("EMAIL_ADDRESS", email),
        category: "EMAIL_ADDRESS",
        displayLabel: email,
        provenIdentifier: email,
        confidence: "EXACT",
        evidence: [
          {
            matchedOn: email,
            reason: "Single exact email supplied in evidence bag.",
            source: "OWNER_SUPPLIED_EVIDENCE",
            sourceRef: email,
          },
        ],
      });
    } else if ((query.knownEmails?.length ?? 0) > 1 && !fromText) {
      for (const e of query.knownEmails ?? []) {
        const em = e.trim().toLowerCase();
        if (!em) continue;
        candidates.push({
          candidateId: candidateId("EMAIL_ADDRESS", em),
          category: "EMAIL_ADDRESS",
          displayLabel: em,
          provenIdentifier: em,
          confidence: "STRONG",
          evidence: [
            {
              matchedOn: em,
              reason: "Multiple exact emails in evidence — clarification required.",
              source: "OWNER_SUPPLIED_EVIDENCE",
              sourceRef: em,
            },
          ],
        });
      }
    }
  }

  // 2) Conversation thread from referent / known ids
  if (wantsCategory(query, "CONVERSATION_THREAD")) {
    const threadId =
      (query.referentThreadId?.trim() || null) ??
      ((query.knownThreadIds?.length ?? 0) === 1 ? query.knownThreadIds![0].trim() : null);
    if (threadId) {
      candidates.push({
        candidateId: candidateId("CONVERSATION_THREAD", threadId),
        category: "CONVERSATION_THREAD",
        displayLabel: query.referentLabel?.trim() || `thread ${threadId.slice(0, 12)}`,
        provenIdentifier: threadId,
        confidence: "EXACT",
        evidence: [
          {
            matchedOn: threadId,
            reason: query.referentThreadId
              ? "Thread id proven by conversation referent."
              : "Single known thread id in evidence bag.",
            source: query.referentThreadId ? "CONVERSATION_REFERENT" : "OWNER_SUPPLIED_EVIDENCE",
            sourceRef: threadId,
          },
        ],
      });
    } else if ((query.knownThreadIds?.length ?? 0) > 1) {
      for (const t of query.knownThreadIds ?? []) {
        const id = t.trim();
        if (!id) continue;
        candidates.push({
          candidateId: candidateId("CONVERSATION_THREAD", id),
          category: "CONVERSATION_THREAD",
          displayLabel: `thread ${id.slice(0, 12)}`,
          provenIdentifier: id,
          confidence: "STRONG",
          evidence: [
            {
              matchedOn: id,
              reason: "Multiple thread ids in evidence — clarification required.",
              source: "OWNER_SUPPLIED_EVIDENCE",
              sourceRef: id,
            },
          ],
        });
      }
    }
  }

  // 3) Calendar event from referent / known ids
  if (wantsCategory(query, "CALENDAR_EVENT")) {
    const eventId =
      (query.referentEventId?.trim() || null) ??
      ((query.knownEventIds?.length ?? 0) === 1 ? query.knownEventIds![0].trim() : null);
    if (eventId) {
      candidates.push({
        candidateId: candidateId("CALENDAR_EVENT", eventId),
        category: "CALENDAR_EVENT",
        displayLabel: query.referentLabel?.trim() || `event ${eventId.slice(0, 12)}`,
        provenIdentifier: eventId,
        confidence: "EXACT",
        evidence: [
          {
            matchedOn: eventId,
            reason: query.referentEventId
              ? "Event id proven by conversation referent."
              : "Single known event id in evidence bag.",
            source: query.referentEventId ? "CONVERSATION_REFERENT" : "OWNER_SUPPLIED_EVIDENCE",
            sourceRef: eventId,
          },
        ],
      });
    } else if ((query.knownEventIds?.length ?? 0) > 1) {
      for (const ev of query.knownEventIds ?? []) {
        const id = ev.trim();
        if (!id) continue;
        candidates.push({
          candidateId: candidateId("CALENDAR_EVENT", id),
          category: "CALENDAR_EVENT",
          displayLabel: `event ${id.slice(0, 12)}`,
          provenIdentifier: id,
          confidence: "STRONG",
          evidence: [
            {
              matchedOn: id,
              reason: "Multiple event ids in evidence — clarification required.",
              source: "OWNER_SUPPLIED_EVIDENCE",
              sourceRef: id,
            },
          ],
        });
      }
    }
  }

  // 4) Person name matching against known persons only — never invent email
  if (wantsCategory(query, "PERSON")) {
    const personName =
      looksLikePersonName(raw) ||
      (/\b(the )?customer\b/i.test(raw) ? "customer" : null) ||
      (/\b(the )?client\b/i.test(raw) ? "client" : null);

    if (personName && personName !== "customer" && personName !== "client") {
      const matches = (query.knownPersons ?? []).filter(
        (p) => normalize(p.label) === normalize(personName),
      );
      if (matches.length === 1) {
        const p = matches[0];
        const email = p.email?.trim().toLowerCase() || null;
        candidates.push({
          candidateId: candidateId("PERSON", email ?? p.id ?? p.label),
          category: "PERSON",
          displayLabel: p.label,
          provenIdentifier: email,
          confidence: email ? "STRONG" : "WEAK",
          evidence: [
            {
              matchedOn: p.label,
              reason: email
                ? "Single known person match with proven email."
                : "Single known person label match — email not proven; not proposal-safe.",
              source: "OWNER_SUPPLIED_EVIDENCE",
              sourceRef: email ?? p.id ?? null,
            },
          ],
        });
      } else if (matches.length > 1) {
        for (const p of matches) {
          const email = p.email?.trim().toLowerCase() || null;
          candidates.push({
            candidateId: candidateId("PERSON", `${p.label}:${email ?? p.id ?? "unknown"}`),
            category: "PERSON",
            displayLabel: p.label,
            provenIdentifier: email,
            confidence: email ? "STRONG" : "WEAK",
            evidence: [
              {
                matchedOn: p.label,
                reason: "Multiple people share this label — clarification required.",
                source: "OWNER_SUPPLIED_EVIDENCE",
                sourceRef: email ?? p.id ?? null,
              },
            ],
          });
        }
      } else {
        // Name with no evidence — unresolved candidate without proven id
        candidates.push({
          candidateId: candidateId("PERSON", personName),
          category: "PERSON",
          displayLabel: personName,
          provenIdentifier: null,
          confidence: "NONE",
          evidence: [
            {
              matchedOn: personName,
              reason: "Person name mentioned without proven identity evidence.",
              source: "UTTERANCE_LITERAL",
              sourceRef: null,
            },
          ],
        });
      }
    } else if (personName === "customer" || personName === "client") {
      const matches = (query.knownPersons ?? []).filter((p) =>
        /\b(customer|client)\b/i.test(p.label),
      );
      if (matches.length === 1 && matches[0].email) {
        const p = matches[0];
        const email = p.email!.trim().toLowerCase();
        candidates.push({
          candidateId: candidateId("PERSON", email),
          category: "PERSON",
          displayLabel: p.label,
          provenIdentifier: email,
          confidence: "STRONG",
          evidence: [
            {
              matchedOn: p.label,
              reason: `Single known ${personName} with proven email.`,
              source: "OWNER_SUPPLIED_EVIDENCE",
              sourceRef: email,
            },
          ],
        });
      } else if (matches.length > 1) {
        for (const p of matches) {
          candidates.push({
            candidateId: candidateId("PERSON", p.email ?? p.id ?? p.label),
            category: "PERSON",
            displayLabel: p.label,
            provenIdentifier: p.email?.trim().toLowerCase() || null,
            confidence: "WEAK",
            evidence: [
              {
                matchedOn: p.label,
                reason: `Multiple ${personName} matches — clarification required.`,
                source: "OWNER_SUPPLIED_EVIDENCE",
                sourceRef: p.email ?? p.id ?? null,
              },
            ],
          });
        }
      } else {
        candidates.push({
          candidateId: candidateId("PERSON", personName),
          category: "PERSON",
          displayLabel: `the ${personName}`,
          provenIdentifier: null,
          confidence: "NONE",
          evidence: [
            {
              matchedOn: personName,
              reason: `Generic ${personName} reference without proven identity.`,
              source: "UTTERANCE_LITERAL",
              sourceRef: null,
            },
          ],
        });
      }
    }
  }

  // 5) Business label matching — never invent ids
  if (wantsCategory(query, "BUSINESS") || wantsCategory(query, "LEONIX_ENTITY")) {
    const businessPhrase = /\b(that|the|this)\s+business\b/i.test(raw)
      ? "business"
      : looksLikePersonName(raw); // allow Proper Name as business label only if knownBusinesses provided

    if (businessPhrase === "business") {
      const matches = query.knownBusinesses ?? [];
      if (matches.length === 1 && matches[0].id) {
        const b = matches[0];
        candidates.push({
          candidateId: candidateId("BUSINESS", b.id!),
          category: "BUSINESS",
          displayLabel: b.label,
          provenIdentifier: b.id!,
          confidence: "STRONG",
          evidence: [
            {
              matchedOn: b.label,
              reason: "Single known business with proven id.",
              source: "OWNER_SUPPLIED_EVIDENCE",
              sourceRef: b.id!,
            },
          ],
        });
      } else if (matches.length > 1) {
        for (const b of matches) {
          candidates.push({
            candidateId: candidateId("BUSINESS", b.id ?? b.label),
            category: "BUSINESS",
            displayLabel: b.label,
            provenIdentifier: b.id ?? null,
            confidence: "WEAK",
            evidence: [
              {
                matchedOn: b.label,
                reason: "Multiple businesses — clarification required.",
                source: "OWNER_SUPPLIED_EVIDENCE",
                sourceRef: b.id ?? null,
              },
            ],
          });
        }
      } else {
        candidates.push({
          candidateId: candidateId("BUSINESS", "unresolved"),
          category: "BUSINESS",
          displayLabel: "that business",
          provenIdentifier: null,
          confidence: "NONE",
          evidence: [
            {
              matchedOn: "business",
              reason: "Business referent without proven Leonix identity.",
              source: "UTTERANCE_LITERAL",
              sourceRef: null,
            },
          ],
        });
      }
    } else if (businessPhrase && (query.knownBusinesses?.length ?? 0) > 0) {
      const matches = (query.knownBusinesses ?? []).filter(
        (b) => normalize(b.label) === normalize(businessPhrase),
      );
      if (matches.length === 1 && matches[0].id) {
        const b = matches[0];
        candidates.push({
          candidateId: candidateId("BUSINESS", b.id!),
          category: "BUSINESS",
          displayLabel: b.label,
          provenIdentifier: b.id!,
          confidence: "STRONG",
          evidence: [
            {
              matchedOn: b.label,
              reason: "Single known business label match with proven id.",
              source: "OWNER_SUPPLIED_EVIDENCE",
              sourceRef: b.id!,
            },
          ],
        });
      } else if (matches.length > 1) {
        for (const b of matches) {
          candidates.push({
            candidateId: candidateId("BUSINESS", b.id ?? b.label),
            category: "BUSINESS",
            displayLabel: b.label,
            provenIdentifier: b.id ?? null,
            confidence: "WEAK",
            evidence: [
              {
                matchedOn: b.label,
                reason: "Multiple business label matches — clarification required.",
                source: "OWNER_SUPPLIED_EVIDENCE",
                sourceRef: b.id ?? null,
              },
            ],
          });
        }
      }
    }
  }

  // Deduplicate by candidateId
  const dedup = new Map<string, LeoEntityCandidate>();
  for (const c of candidates) {
    const prev = dedup.get(c.candidateId);
    if (!prev || rankConfidence(c.confidence) > rankConfidence(prev.confidence)) {
      dedup.set(c.candidateId, c);
    }
  }
  const unique = [...dedup.values()];

  // Apply resolution rules
  let state: LeoEntityResolutionState = "UNRESOLVED";
  let clarification: string | null = null;
  let clarificationRequired = false;
  let ambiguity = false;

  const proven = unique.filter((c) => c.provenIdentifier && (c.confidence === "EXACT" || c.confidence === "STRONG"));
  const weakOrNone = unique.filter((c) => !c.provenIdentifier || c.confidence === "WEAK" || c.confidence === "NONE");

  if (proven.length === 1 && unique.length === 1) {
    state = proven[0].confidence === "EXACT" ? "RESOLVED" : "LIKELY";
  } else if (proven.length === 1 && weakOrNone.every((w) => w.category !== proven[0].category)) {
    // One proven + unrelated weak noise — keep likely on proven
    state = proven[0].confidence === "EXACT" ? "RESOLVED" : "LIKELY";
  } else if (proven.length > 1 || unique.filter((c) => c.provenIdentifier).length > 1) {
    state = "AMBIGUOUS";
    ambiguity = true;
    clarificationRequired = true;
    clarification =
      "I found more than one matching entity. Which one do you mean? LEO will not guess.";
  } else if (unique.length > 1 && proven.length === 0) {
    state = "AMBIGUOUS";
    ambiguity = true;
    clarificationRequired = true;
    clarification =
      "That reference is ambiguous and no proven identity is available. Please clarify.";
  } else if (unique.length === 1 && !unique[0].provenIdentifier) {
    state = "UNRESOLVED";
    clarificationRequired = true;
    clarification =
      unique[0].category === "PERSON" || unique[0].category === "BUSINESS"
        ? `I heard “${unique[0].displayLabel}”, but I do not have a proven identifier (email/id). I will not invent one.`
        : "No proven entity identifier is available. I will not invent one.";
  } else if (unique.length === 0) {
    state = "UNRESOLVED";
    if (n.length > 0) {
      clarificationRequired = true;
      clarification = "No entity evidence matched that reference. I will not invent an identity.";
    }
  } else if (proven.length === 1) {
    state = proven[0].confidence === "EXACT" ? "RESOLVED" : "LIKELY";
  }

  // Prefer returning only the safe candidate set for RESOLVED/LIKELY
  let outputCandidates = unique;
  if ((state === "RESOLVED" || state === "LIKELY") && proven.length === 1) {
    outputCandidates = [proven[0]];
  }

  const confidence = bestConfidence(outputCandidates);
  const proposalSafe = isProposalSafe(state, outputCandidates);

  return {
    query,
    state,
    confidence: outputCandidates.length ? confidence : "NONE",
    candidates: outputCandidates,
    ambiguity,
    clarificationRequired,
    clarification,
    proposalSafe,
    notClaiming: LEO_18A_ENTITY_NOT_CLAIMING,
  };
}

/** Proposal gate: only EXACT/STRONG single proven identity may proceed. */
export function isLeoEntityResolutionProposalSafe(
  result: LeoEntityResolutionResult | null | undefined,
): boolean {
  return result?.proposalSafe === true;
}

/**
 * Map conversation referent fields into an entity resolution query.
 * Reuses referent truth — does not create a second referent system.
 */
export function entityQueryFromReferentFields(input: {
  rawText: string;
  expectedCategories?: readonly LeoEntityCategory[];
  referentStatus?: "RESOLVED" | "AMBIGUOUS" | "NONE" | null;
  threadId?: string | null;
  eventId?: string | null;
  messageId?: string | null;
  label?: string | null;
  kind?: string | null;
  knownEmails?: readonly string[];
  knownPersons?: readonly LeoEntityKnownPerson[];
  knownBusinesses?: readonly LeoEntityKnownBusiness[];
}): LeoEntityResolutionQuery {
  return {
    rawText: input.rawText,
    expectedCategories: input.expectedCategories,
    knownEmails: input.knownEmails,
    knownPersons: input.knownPersons,
    knownBusinesses: input.knownBusinesses,
    referentThreadId: input.threadId ?? null,
    referentEventId: input.eventId ?? null,
    referentMessageId: input.messageId ?? null,
    referentLabel: input.label ?? null,
    referentKind: input.kind ?? null,
    knownThreadIds: input.threadId ? [input.threadId] : undefined,
    knownEventIds: input.eventId ? [input.eventId] : undefined,
  };
}

/** Bounded snapshot safe to attach to proposal referent_snapshot. */
export function leoEntityResolutionSnapshot(
  result: LeoEntityResolutionResult,
): Record<string, unknown> {
  return {
    state: result.state,
    confidence: result.confidence,
    proposalSafe: result.proposalSafe,
    ambiguity: result.ambiguity,
    clarificationRequired: result.clarificationRequired,
    clarification: result.clarification,
    candidates: result.candidates.slice(0, 8).map((c) => ({
      candidateId: c.candidateId,
      category: c.category,
      displayLabel: c.displayLabel,
      provenIdentifier: c.provenIdentifier,
      confidence: c.confidence,
      evidence: c.evidence.slice(0, 4).map((e) => ({
        matchedOn: e.matchedOn,
        reason: e.reason,
        source: e.source,
        sourceRef: e.sourceRef ?? null,
      })),
    })),
    notClaiming: [...result.notClaiming],
  };
}
