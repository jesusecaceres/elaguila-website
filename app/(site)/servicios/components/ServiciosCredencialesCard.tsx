import type { ServiciosLang, ServiciosProfileResolved } from "../types/serviciosBusinessProfile";
import { getServiciosCredentialsCardCopy } from "../copy/serviciosProfileCopy";
import { SV } from "./serviciosDesignTokens";

export function ServiciosCredencialesCard({
  profile,
  lang,
}: {
  profile: ServiciosProfileResolved;
  lang: ServiciosLang;
}) {
  const c = profile.credentials;
  if (!c) return null;

  const copy = getServiciosCredentialsCardCopy(lang);

  return (
    <section
      className="rounded-2xl border p-4 shadow-sm sm:p-6 md:p-8"
      style={{ backgroundColor: SV.card, borderColor: SV.border, boxShadow: SV.shadowSm }}
      aria-labelledby="servicios-credenciales-heading"
    >
      <div className="min-w-0">
        <h2
          id="servicios-credenciales-heading"
          className="text-lg font-bold tracking-tight text-[color:var(--lx-text)] md:text-xl"
        >
          {copy.title}
        </h2>
        <p className="mt-1 text-sm text-[color:var(--lx-text-2)]">{copy.subtitle}</p>
      </div>

      <div className="mt-5 space-y-4">
        {c.hasLicense ? (
          <div
            className="rounded-xl border border-black/[0.06] bg-white/95 px-4 py-3 shadow-sm"
            style={{ borderColor: SV.goldBorder }}
          >
            <p className="text-sm font-semibold text-[color:var(--lx-text)]">
              <span className="mr-1.5" aria-hidden>
                📄
              </span>
              {copy.licenseProvided}
            </p>
            <ul className="mt-2 list-none space-y-1.5 text-sm text-[color:var(--lx-text)]">
              {c.licenseType ? (
                <li>
                  <span className="font-medium text-[color:var(--lx-text-2)]">{copy.licenseType}: </span>
                  <span className="break-words">{c.licenseType}</span>
                </li>
              ) : null}
              {c.licenseAuthority ? (
                <li>
                  <span className="font-medium text-[color:var(--lx-text-2)]">{copy.issuingAuthority}: </span>
                  <span className="break-words">{c.licenseAuthority}</span>
                </li>
              ) : null}
              {c.licenseNumber ? (
                <li>
                  <span className="font-medium text-[color:var(--lx-text-2)]">{copy.licenseNumber}: </span>
                  <span className="break-all font-medium">{c.licenseNumber}</span>
                </li>
              ) : null}
              {c.licenseExpiration ? (
                <li>
                  <span className="font-medium text-[color:var(--lx-text-2)]">{copy.expires}: </span>
                  <span className="break-words">{c.licenseExpiration}</span>
                </li>
              ) : null}
            </ul>
            {c.licenseDocumentHrefSafe ? (
              <p className="mt-3">
                <a
                  href={c.licenseDocumentHrefSafe}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1e3a5f] underline decoration-[#3B66AD]/40 underline-offset-2 hover:text-[#152a45]"
                >
                  <span aria-hidden>🧾</span>
                  {copy.viewLicenseDocument}
                </a>
              </p>
            ) : null}
          </div>
        ) : c.licenseDocumentHrefSafe ? (
          <div
            className="rounded-xl border border-black/[0.06] bg-white/95 px-4 py-3 shadow-sm"
            style={{ borderColor: SV.goldBorder }}
          >
            <a
              href={c.licenseDocumentHrefSafe}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1e3a5f] underline decoration-[#3B66AD]/40 underline-offset-2 hover:text-[#152a45]"
            >
              <span aria-hidden>🧾</span>
              {copy.viewLicenseDocument}
            </a>
          </div>
        ) : null}

        {c.isInsured ? (
          <div
            className="rounded-xl border border-black/[0.06] bg-white/95 px-4 py-3 shadow-sm"
            style={{ borderColor: SV.goldBorder }}
          >
            <p className="text-sm font-semibold text-[color:var(--lx-text)]">
              <span className="mr-1.5" aria-hidden>
                🛡️
              </span>
              {copy.insuranceProvided}
            </p>
            {c.insuranceType ? (
              <p className="mt-2 text-sm text-[color:var(--lx-text)]">{c.insuranceType}</p>
            ) : null}
            {c.insuranceDocumentHrefSafe ? (
              <p className="mt-3">
                <a
                  href={c.insuranceDocumentHrefSafe}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1e3a5f] underline decoration-[#3B66AD]/40 underline-offset-2 hover:text-[#152a45]"
                >
                  <span aria-hidden>🧾</span>
                  {copy.viewInsuranceDocument}
                </a>
              </p>
            ) : null}
          </div>
        ) : c.insuranceDocumentHrefSafe ? (
          <div
            className="rounded-xl border border-black/[0.06] bg-white/95 px-4 py-3 shadow-sm"
            style={{ borderColor: SV.goldBorder }}
          >
            <a
              href={c.insuranceDocumentHrefSafe}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1e3a5f] underline decoration-[#3B66AD]/40 underline-offset-2 hover:text-[#152a45]"
            >
              <span aria-hidden>🧾</span>
              {copy.viewCertificate}
            </a>
          </div>
        ) : null}

        {c.certifications.length > 0 ? (
          <div>
            <p className="text-sm font-semibold text-[color:var(--lx-text)]">
              <span className="mr-1.5" aria-hidden>
                🎓
              </span>
              {copy.certifications}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {c.certifications.map((label, i) => (
                <span
                  key={`cert-${i}-${label.slice(0, 24)}`}
                  className="inline-flex max-w-full rounded-xl border border-black/[0.06] bg-white/95 px-3 py-2 text-sm font-medium text-[color:var(--lx-text)] shadow-sm"
                  style={{ borderColor: SV.goldBorder }}
                >
                  <span className="min-w-0 break-words">{label}</span>
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
