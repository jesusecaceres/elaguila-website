"use client";

import { ALLOWED_PREFERRED_CHANNEL_KINDS_BY_CONTACT_TYPE } from "@/app/lib/business/constants";
import type { ChannelKind, ContactType } from "@/app/lib/business/types";
import type { BusinessIdentityCopy } from "../../_components/businessIdentityCopy";
import type { WizardContactDraft, WizardDraftPayload } from "../wizardTypes";
import { newContactDraft } from "../wizardTypes";

const CHANNEL_LABELS: Record<ChannelKind, keyof BusinessIdentityCopy["wizard"]["step4"]> = {
  whatsapp: "channelWhatsapp",
  call: "channelCall",
  email: "channelEmail",
};

function updateContact(payload: WizardDraftPayload, id: string, patch: Partial<WizardContactDraft>): WizardDraftPayload {
  return { ...payload, contacts: payload.contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)) };
}

export function Step4Contacts({
  t,
  payload,
  onChange,
  errors,
}: {
  t: BusinessIdentityCopy["wizard"]["step4"];
  payload: WizardDraftPayload;
  onChange: (next: WizardDraftPayload) => void;
  errors: readonly string[];
}) {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-[#1E1810]">{t.title}</h2>

      {payload.contacts.map((contact) => {
        const allowedChannels = contact.contactType ? ALLOWED_PREFERRED_CHANNEL_KINDS_BY_CONTACT_TYPE[contact.contactType] : [];
        return (
          <div key={contact.id} className="rounded-2xl border border-[#E8DFD0] bg-[#FAF7F2]/60 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor={`contact-type-${contact.id}`} className="block text-xs font-semibold text-[#3D3428]">
                  {t.typeLabel}
                </label>
                <select
                  id={`contact-type-${contact.id}`}
                  value={contact.contactType}
                  onChange={(e) =>
                    onChange(
                      updateContact(payload, contact.id, {
                        contactType: e.target.value as ContactType,
                        channelKind: null,
                        preferredChannel: false,
                      }),
                    )
                  }
                  className="mt-1 w-full min-h-[44px] rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm text-[#1E1810]"
                >
                  <option value="">—</option>
                  <option value="phone">{t.typePhone}</option>
                  <option value="email">{t.typeEmail}</option>
                  <option value="website">{t.typeWebsite}</option>
                </select>
              </div>
              <div>
                <label htmlFor={`contact-value-${contact.id}`} className="block text-xs font-semibold text-[#3D3428]">
                  {t.valueLabel}
                </label>
                <input
                  id={`contact-value-${contact.id}`}
                  type="text"
                  value={contact.rawValue}
                  onChange={(e) => onChange(updateContact(payload, contact.id, { rawValue: e.target.value }))}
                  className="mt-1 w-full min-h-[44px] rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm text-[#1E1810]"
                />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-xs font-medium text-[#3D3428]">
                <input
                  type="checkbox"
                  checked={contact.isPrimary}
                  onChange={(e) => onChange(updateContact(payload, contact.id, { isPrimary: e.target.checked }))}
                  className="h-4 w-4"
                />
                {t.primaryLabel}
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-[#3D3428]">
                <input
                  type="checkbox"
                  checked={contact.preferredChannel}
                  disabled={contact.contactType === "website" || !contact.contactType}
                  onChange={(e) =>
                    onChange(updateContact(payload, contact.id, { preferredChannel: e.target.checked, channelKind: e.target.checked ? allowedChannels[0] ?? null : null }))
                  }
                  className="h-4 w-4"
                />
                {t.preferredLabel}
              </label>
              {contact.preferredChannel && allowedChannels.length > 0 ? (
                <select
                  aria-label={t.channelLabel}
                  value={contact.channelKind ?? ""}
                  onChange={(e) => onChange(updateContact(payload, contact.id, { channelKind: e.target.value as ChannelKind }))}
                  className="min-h-[36px] rounded-lg border border-[#E8DFD0] bg-white px-2 py-1 text-xs text-[#1E1810]"
                >
                  {allowedChannels.map((kind) => (
                    <option key={kind} value={kind}>
                      {t[CHANNEL_LABELS[kind]]}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>

            {payload.contacts.length > 1 ? (
              <button
                type="button"
                onClick={() => onChange({ ...payload, contacts: payload.contacts.filter((c) => c.id !== contact.id) })}
                className="mt-3 text-xs font-semibold text-[#7A1E2C] underline"
              >
                {t.removeLabel}
              </button>
            ) : null}
          </div>
        );
      })}

      {errors.length > 0 ? (
        <p role="alert" className="text-xs text-[#7A1E2C]">
          {errors[0]}
        </p>
      ) : payload.contacts.length === 0 ? (
        <p className="text-xs text-[#7A7164]">{t.atLeastOne}</p>
      ) : null}

      <button
        type="button"
        onClick={() => onChange({ ...payload, contacts: [...payload.contacts, newContactDraft()] })}
        className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[#E8DFD0] bg-white px-4 py-2 text-xs font-semibold text-[#3D3428] hover:bg-[#FAF7F2]"
      >
        {t.addAnother}
      </button>
    </div>
  );
}
