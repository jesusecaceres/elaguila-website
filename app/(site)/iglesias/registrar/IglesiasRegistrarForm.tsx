"use client";

import { useState } from "react";
import Link from "next/link";
import { IGLESIAS_NEED_CATALOG } from "@/app/lib/iglesias/taxonomy";
import { getIglesiasCopy } from "@/app/lib/iglesias/copy";
import { IglesiasPageShell } from "../components/IglesiasPageShell";
import { IglesiasLogoUploadField } from "./IglesiasLogoUploadField";

const DAYS_ES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const DAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function IglesiasRegistrarForm({ lang }: { lang: "es" | "en" }) {
  const copy = getIglesiasCopy(lang);
  const days = lang === "en" ? DAYS_EN : DAYS_ES;
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "error">("idle");
  const [logoUrl, setLogoUrl] = useState("");
  const [services, setServices] = useState([{ dayOfWeek: 0, startsAt: "10:00", language: "es", mode: "in_person", label: "" }]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const ministries = fd.getAll("ministries").map(String);
    const languages = fd.getAll("languages").map(String);
    setStatus("saving");
    const payload = {
      name: String(fd.get("name") ?? ""),
      denomination: String(fd.get("denomination") ?? ""),
      churchType: String(fd.get("churchType") ?? ""),
      mission: String(fd.get("mission") ?? ""),
      city: String(fd.get("city") ?? ""),
      state: String(fd.get("state") ?? ""),
      country: String(fd.get("country") ?? ""),
      zip: String(fd.get("zip") ?? ""),
      addressLine1: String(fd.get("addressLine1") ?? ""),
      addressLine2: String(fd.get("addressLine2") ?? ""),
      publicLocation: fd.get("publicLocation") === "on",
      languages,
      phone: String(fd.get("phone") ?? ""),
      email: String(fd.get("email") ?? ""),
      website: String(fd.get("website") ?? ""),
      whatsapp: String(fd.get("whatsapp") ?? ""),
      livestreamUrl: String(fd.get("livestreamUrl") ?? ""),
      facebook: String(fd.get("facebook") ?? ""),
      instagram: String(fd.get("instagram") ?? ""),
      youtube: String(fd.get("youtube") ?? ""),
      logoUrl,
      heroUrl: String(fd.get("heroUrl") ?? ""),
      applicantName: String(fd.get("applicantName") ?? ""),
      applicantEmail: String(fd.get("applicantEmail") ?? ""),
      applicantPhone: String(fd.get("applicantPhone") ?? ""),
      prayerTeamIntent: String(fd.get("prayerTeamIntent") ?? ""),
      website_extra: String(fd.get("website_extra") ?? ""),
      services: services.filter((s) => s.startsAt),
      ministries,
    };
    try {
      const res = await fetch("/api/iglesias/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { ok?: boolean };
      setStatus(json.ok ? "ok" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "ok") {
    return (
      <IglesiasPageShell>
        <div className="mx-auto max-w-2xl overflow-x-hidden px-4 py-16">
          <div className="rounded-[1.5rem] border border-[#C9A84A]/35 bg-[#FFFDF7] px-6 py-10 shadow-[0_20px_50px_-36px_rgba(31,36,28,0.4)]">
            <h1 className="font-serif text-3xl font-bold text-[#1F241C]">{copy.applySuccessTitle}</h1>
            <p className="mt-3 text-sm leading-relaxed text-[#3D3428]">{copy.applySuccessBody}</p>
            <Link href={`/iglesias?lang=${lang}`} className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-[#7A1E2C] underline-offset-2 hover:underline">
              {copy.profileBack}
            </Link>
          </div>
        </div>
      </IglesiasPageShell>
    );
  }

  const field = "min-h-11 w-full rounded-lg border border-[#D6C7AD] bg-white px-3 text-sm outline-none focus:border-[#7A1E2C] focus:ring-2 focus:ring-[#7A1E2C]/20";
  const label = "mb-1 block text-xs font-semibold text-[#5C5346]";

  return (
    <IglesiasPageShell>
      <div className="mx-auto max-w-3xl overflow-x-hidden px-4 py-10 sm:px-6">
        <Link href={`/iglesias?lang=${lang}`} className="text-sm font-semibold text-[#7A1E2C] underline-offset-2 hover:underline">
          {copy.profileBack}
        </Link>
        <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-[#C9A84A]/35 bg-[#FFFDF7] px-5 py-8 shadow-[0_20px_50px_-36px_rgba(31,36,28,0.4)] sm:px-8">
        <h1 className="font-serif text-3xl font-bold text-[#1F241C] sm:text-4xl">{copy.applyTitle}</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#3D3428]">{copy.applySupport}</p>
        <p className="mt-1 text-xs font-semibold text-[#2A4536]">{copy.applyPendingNote}</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-8" noValidate>
          <input type="text" name="website_extra" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

          <fieldset className="grid gap-3 sm:grid-cols-2">
            <legend className="mb-2 font-serif text-xl font-bold text-[#1F241C]">{lang === "en" ? "Church" : "Iglesia"}</legend>
            <label className="sm:col-span-2">
              <span className={label}>{lang === "en" ? "Church name" : "Nombre de la iglesia"} *</span>
              <input name="name" required className={field} />
            </label>
            <label>
              <span className={label}>{lang === "en" ? "Denomination / type" : "Denominación / tipo"}</span>
              <input name="denomination" className={field} />
            </label>
            <label>
              <span className={label}>{lang === "en" ? "Church type" : "Tipo"}</span>
              <input name="churchType" className={field} />
            </label>
            <label className="sm:col-span-2">
              <span className={label}>{lang === "en" ? "Mission / about" : "Misión / acerca de"}</span>
              <textarea name="mission" rows={4} className={`${field} py-2`} />
            </label>
          </fieldset>

          <fieldset className="grid gap-3 sm:grid-cols-2">
            <legend className="mb-2 font-serif text-xl font-bold text-[#1F241C]">{lang === "en" ? "Location" : "Ubicación"}</legend>
            <label className="sm:col-span-2">
              <span className={label}>{lang === "en" ? "Street address" : "Dirección"}</span>
              <input name="addressLine1" className={field} />
            </label>
            <label>
              <span className={label}>{lang === "en" ? "City" : "Ciudad"}</span>
              <input name="city" className={field} />
            </label>
            <label>
              <span className={label}>{lang === "en" ? "State / province" : "Estado / provincia"}</span>
              <input name="state" className={field} defaultValue="California" />
            </label>
            <label>
              <span className={label}>{lang === "en" ? "Country" : "País"}</span>
              <input name="country" className={field} defaultValue="United States" />
            </label>
            <label>
              <span className={label}>{lang === "en" ? "Postal code" : "Código postal"}</span>
              <input name="zip" className={field} />
            </label>
            <label className="sm:col-span-2 flex items-start gap-2 text-sm text-[#3D3428]">
              <input type="checkbox" name="publicLocation" className="mt-1 h-4 w-4" />
              <span>
                {lang === "en"
                  ? "You may show this address publicly for directions."
                  : "Pueden mostrar esta dirección al público para cómo llegar."}
              </span>
            </label>
          </fieldset>

          <fieldset>
            <legend className="mb-2 font-serif text-xl font-bold text-[#1F241C]">{copy.searchLanguage}</legend>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="inline-flex min-h-11 items-center gap-2">
                <input type="checkbox" name="languages" value="es" defaultChecked /> {copy.langEs}
              </label>
              <label className="inline-flex min-h-11 items-center gap-2">
                <input type="checkbox" name="languages" value="en" /> {copy.langEn}
              </label>
              <label className="inline-flex min-h-11 items-center gap-2">
                <input type="checkbox" name="languages" value="bilingual" /> {copy.langBilingual}
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 font-serif text-xl font-bold text-[#1F241C]">{copy.profileServices}</legend>
            <div className="space-y-3">
              {services.map((s, i) => (
                <div key={i} className="grid gap-2 rounded-lg border border-[#D6C7AD]/70 p-3 sm:grid-cols-4">
                  <label>
                    <span className={label}>{lang === "en" ? "Day" : "Día"}</span>
                    <select
                      className={field}
                      value={s.dayOfWeek}
                      onChange={(e) =>
                        setServices((prev) => prev.map((row, idx) => (idx === i ? { ...row, dayOfWeek: Number(e.target.value) } : row)))
                      }
                    >
                      {days.map((d, di) => (
                        <option key={d} value={di}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className={label}>{lang === "en" ? "Time" : "Hora"}</span>
                    <input
                      type="time"
                      className={field}
                      value={s.startsAt}
                      onChange={(e) => setServices((prev) => prev.map((row, idx) => (idx === i ? { ...row, startsAt: e.target.value } : row)))}
                    />
                  </label>
                  <label>
                    <span className={label}>{copy.searchLanguage}</span>
                    <select
                      className={field}
                      value={s.language}
                      onChange={(e) => setServices((prev) => prev.map((row, idx) => (idx === i ? { ...row, language: e.target.value } : row)))}
                    >
                      <option value="es">{copy.langEs}</option>
                      <option value="en">{copy.langEn}</option>
                      <option value="bilingual">{copy.langBilingual}</option>
                    </select>
                  </label>
                  <label>
                    <span className={label}>{lang === "en" ? "Mode" : "Modalidad"}</span>
                    <select
                      className={field}
                      value={s.mode}
                      onChange={(e) => setServices((prev) => prev.map((row, idx) => (idx === i ? { ...row, mode: e.target.value } : row)))}
                    >
                      <option value="in_person">{copy.modeInPerson}</option>
                      <option value="online">{copy.modeOnline}</option>
                      <option value="hybrid">{copy.modeHybrid}</option>
                    </select>
                  </label>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="mt-2 text-sm font-semibold text-[#7A1E2C] underline-offset-2 hover:underline"
              onClick={() => setServices((prev) => [...prev, { dayOfWeek: 0, startsAt: "10:00", language: "es", mode: "in_person", label: "" }])}
            >
              {lang === "en" ? "Add another service" : "Agregar otro servicio"}
            </button>
          </fieldset>

          <fieldset>
            <legend className="mb-2 font-serif text-xl font-bold text-[#1F241C]">{copy.profileHelp}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {IGLESIAS_NEED_CATALOG.map((n) => (
                <label key={n.key} className="inline-flex min-h-11 items-center gap-2 text-sm">
                  <input type="checkbox" name="ministries" value={n.key} />
                  {lang === "en" ? n.labelEn : n.labelEs}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="grid gap-3 sm:grid-cols-2">
            <legend className="mb-2 font-serif text-xl font-bold text-[#1F241C]">{copy.profileContact}</legend>
            <label>
              <span className={label}>{lang === "en" ? "Public phone" : "Teléfono público"}</span>
              <input name="phone" className={field} />
            </label>
            <label>
              <span className={label}>{copy.profileEmail}</span>
              <input name="email" type="email" className={field} />
            </label>
            <label>
              <span className={label}>{copy.profileWebsite}</span>
              <input name="website" type="url" className={field} placeholder="https://" />
            </label>
            <label>
              <span className={label}>WhatsApp</span>
              <input name="whatsapp" className={field} />
            </label>
            <label className="sm:col-span-2">
              <span className={label}>{copy.profileLivestream}</span>
              <input name="livestreamUrl" type="url" className={field} placeholder="https://" />
            </label>
            <label>
              <span className={label}>Facebook</span>
              <input name="facebook" type="url" className={field} />
            </label>
            <label>
              <span className={label}>Instagram</span>
              <input name="instagram" type="url" className={field} />
            </label>
            <label className="sm:col-span-2">
              <span className={label}>YouTube</span>
              <input name="youtube" type="url" className={field} />
            </label>
            <IglesiasLogoUploadField
              lang={lang}
              logoUrl={logoUrl}
              onLogoUrlChange={setLogoUrl}
              fieldClass={field}
              labelClass={label}
            />
            <label>
              <span className={label}>{lang === "en" ? "Hero image URL" : "URL de imagen principal"}</span>
              <input name="heroUrl" type="url" className={field} placeholder="https://" />
            </label>
          </fieldset>

          <fieldset id="oracion-equipo" className="scroll-mt-24">
            <legend className="mb-2 font-serif text-xl font-bold text-[#1F241C]">{copy.applyPrayerTeamLegend}</legend>
            <p className="mb-3 text-sm leading-relaxed text-[#3D3428]">{copy.applyPrayerTeamHelp}</p>
            <div className="grid gap-2">
              {(
                [
                  ["YES", copy.applyPrayerTeamYes],
                  ["NO", copy.applyPrayerTeamNo],
                  ["INTERESTED", copy.applyPrayerTeamInterested],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm">
                  <input type="radio" name="prayerTeamIntent" value={value} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="grid gap-3 sm:grid-cols-2">
            <legend className="mb-2 font-serif text-xl font-bold text-[#1F241C]">{lang === "en" ? "Your contact for review" : "Tu contacto para la revisión"}</legend>
            <label>
              <span className={label}>{lang === "en" ? "Your name" : "Tu nombre"}</span>
              <input name="applicantName" className={field} />
            </label>
            <label>
              <span className={label}>{lang === "en" ? "Your email" : "Tu correo"} *</span>
              <input name="applicantEmail" type="email" required className={field} />
            </label>
            <label className="sm:col-span-2">
              <span className={label}>{lang === "en" ? "Your phone" : "Tu teléfono"}</span>
              <input name="applicantPhone" className={field} />
            </label>
          </fieldset>

          {status === "error" ? <p className="text-sm font-semibold text-[#7A1E2C]">{copy.applyError}</p> : null}

          <button
            type="submit"
            disabled={status === "saving"}
            className="inline-flex min-h-12 items-center rounded-xl bg-[#7A1E2C] px-6 text-sm font-semibold text-white hover:bg-[#6B1A26] disabled:opacity-60"
          >
            {copy.applySubmit}
          </button>
        </form>
        </div>
      </div>
    </IglesiasPageShell>
  );
}
