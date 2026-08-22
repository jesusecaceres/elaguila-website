import Link from "next/link";
import { redirect } from "next/navigation";
import { actorHasCapability, requireSalesWorkspaceAccess, type SalesWorkspaceDenialReason } from "../../_lib/businessWorkspaceAccess";
import { getBusinessWorkspaceDetail } from "../../_lib/businessWorkspaceData";
import { listEvidenceForBusiness } from "@/app/lib/business/livingBook/repository";
import { BusinessQuickActions, CameraFileCapture, NetworkStatusIndicator } from "../FieldAgentComponents";
import { FieldAgentBusinessHeader } from "../FieldAgentIdentity";
import { FieldAgentDictationSection } from "./FieldAgentDictationSection";

/**
 * Program 7, Gate 7G / Gate 03 — Mobile Field Agent per-business capture screen.
 * Reuses the canonical staff access resolver + Field Discovery upload pipeline.
 */

export const dynamic = "force-dynamic";

const IDENTITY_DENIAL_REASONS: readonly SalesWorkspaceDenialReason[] = ["no_admin_cookie", "bootstrap_session_not_allowed", "no_operator_identity", "auth_user_not_found"];

function previewNote(text: string | null, title: string): string {
  const source = (text ?? title).replace(/\s+/g, " ").trim();
  if (!source) return "—";
  return source.length > 140 ? `${source.slice(0, 137)}…` : source;
}

export default async function FieldAgentBusinessPage({ params }: { params: Promise<{ businessId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    redirect(IDENTITY_DENIAL_REASONS.includes(access.reason) ? "/admin/login" : "/admin/team?access_denied=1");
  }

  const { businessId } = await params;
  const detail = await getBusinessWorkspaceDetail(businessId, access.actor);
  if (!detail) {
    return (
      <div className="mx-auto max-w-md overflow-x-hidden px-4 pt-4">
        <p className="text-sm text-[#1E1810]">Negocio no encontrado. / Business not found.</p>
        <Link href="/admin/field" className="mt-3 inline-flex min-h-[44px] items-center text-xs font-semibold text-[#7A1E2C] underline">
          ← Field Agent
        </Link>
      </div>
    );
  }

  let recentNotes: { id: string; createdAt: string; preview: string; actorLabel: string | null }[] = [];
  let notesUnavailable = false;
  if (actorHasCapability(access.actor, "view_business_book")) {
    try {
      const evidence = await listEvidenceForBusiness(businessId);
      recentNotes = evidence
        .filter((row) => row.evidenceType === "staff_note")
        .slice(0, 5)
        .map((row) => ({
          id: row.id,
          createdAt: row.createdAt,
          preview: previewNote(row.capturedText, row.sourceTitle),
          actorLabel: row.collectedByRole || null,
        }));
    } catch {
      notesUnavailable = true;
    }
  }

  const business = detail.business;

  return (
    <div className="mx-auto max-w-md overflow-x-hidden space-y-4 px-4 pb-24 pt-4">
      <div className="flex justify-end">
        <NetworkStatusIndicator />
      </div>
      <FieldAgentBusinessHeader businessName={business.displayName} businessId={businessId} />

      <section className="rounded-2xl border border-[#D6C7AD]/85 bg-[#FFFDF7] p-4">
        <h2 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Business Identity</h2>
        <p className="mt-1 font-serif text-lg font-bold leading-tight text-[#1E1810]">{business.displayName}</p>
        <p className="mt-1 text-xs text-[#7A7164]">
          {business.broadBusinessType.replace(/_/g, " ")} · {business.businessStage.replace(/_/g, " ")}
        </p>
      </section>

      <section className="rounded-2xl border border-[#D6C7AD]/85 bg-[#FFFDF7] p-4">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Quick Capture</h2>
        <CameraFileCapture businessId={businessId} />
      </section>

      <section className="rounded-2xl border border-[#D6C7AD]/85 bg-[#FFFDF7] p-4">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Voice Note</h2>
        <FieldAgentDictationSection businessId={businessId} />
      </section>

      <section className="rounded-2xl border border-[#D6C7AD]/85 bg-[#FFFDF7] p-4">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Quick Actions</h2>
        <BusinessQuickActions businessId={businessId} />
      </section>

      <section className="rounded-2xl border border-[#D6C7AD]/85 bg-[#FFFDF7] p-4">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Recent field notes</h2>
        {notesUnavailable ? (
          <p className="text-xs text-[#7A7164]">Notas recientes no disponibles. / Recent field notes unavailable.</p>
        ) : recentNotes.length === 0 ? (
          <p className="text-xs text-[#7A7164]">No hay notas de campo recientes. / No recent field notes.</p>
        ) : (
          <ul className="space-y-2">
            {recentNotes.map((note) => (
              <li key={note.id} className="rounded-lg border border-[#E8DFD0] bg-white p-2">
                <p className="text-[10px] text-[#7A7164]">
                  {note.createdAt.replace("T", " ").slice(0, 16)}
                  {note.actorLabel ? ` · ${note.actorLabel}` : ""}
                </p>
                <p className="mt-0.5 text-xs text-[#1E1810]">{note.preview}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
