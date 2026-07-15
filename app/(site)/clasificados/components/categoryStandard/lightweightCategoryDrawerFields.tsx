"use client";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { BUSCO_TYPE_OPTIONS } from "@/app/(site)/publicar/busco/shared/buscoTaxonomy";
import { MASCOTAS_PERDIDOS_NOTICE_OPTIONS } from "@/app/(site)/publicar/mascotas-y-perdidos/shared/mascotasPerdidosTaxonomy";
import {
  CLASES_CATEGORY_OPTIONS,
  CLASES_SKILL_LEVEL_OPTIONS,
  COMUNIDAD_ACCESSIBILITY_OPTIONS,
  COMUNIDAD_CATEGORY_OPTIONS,
  COMMUNITY_AUDIENCE_OPTIONS,
  COMMUNITY_REGISTRATION_OPTIONS,
} from "@/app/(site)/publicar/community/shared/taxonomy/communityTaxonomy";
import {
  CAT_STD_FILTER_INPUT,
  CAT_STD_FILTER_LABEL,
  CAT_STD_FILTER_SELECT,
} from "./categoryStandardStyles";
import { CategoryStandardFilterGroup } from "./CategoryStandardFiltersDrawerShell";

type CommunityDrawerProps = {
  lang: Lang;
  category: "clases" | "comunidad";
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
};

export function ComunidadClasesDrawerFields({ lang, category, values, onChange }: CommunityDrawerProps) {
  const L = lang === "es";

  return (
    <div className="space-y-4">
      <CategoryStandardFilterGroup label={L ? "Ubicación" : "Location"}>
        <p className="text-xs text-[#5C5346]">
          {L ? "Usa la barra de búsqueda para ciudad, estado, ZIP y país." : "Use the search bar for city, state, ZIP, and country."}
        </p>
      </CategoryStandardFilterGroup>

      {category === "comunidad" ? (
        <>
          <CategoryStandardFilterGroup label={L ? "Tipo de publicación" : "Post type"}>
            <label className={CAT_STD_FILTER_LABEL}>
              {L ? "Tipo de evento" : "Event type"}
              <select
                className={CAT_STD_FILTER_SELECT}
                value={values.eventType ?? ""}
                onChange={(e) => onChange("eventType", e.target.value)}
              >
                <option value="">{L ? "Todos" : "All"}</option>
                {COMUNIDAD_CATEGORY_OPTIONS.filter((o) => o.value).map((o) => (
                  <option key={o.value} value={o.value}>
                    {lang === "en" ? o.labelEn : o.labelEs}
                  </option>
                ))}
              </select>
            </label>
            <label className={CAT_STD_FILTER_LABEL}>
              {L ? "Costo del evento" : "Event cost"}
              <select
                className={CAT_STD_FILTER_SELECT}
                value={values.eventCost ?? "all"}
                onChange={(e) => onChange("eventCost", e.target.value)}
              >
                <option value="all">{L ? "Todos" : "All"}</option>
                <option value="gratis">{L ? "Gratis" : "Free"}</option>
                <option value="pagado">{L ? "Pagado" : "Paid"}</option>
                <option value="donacion">{L ? "Donación" : "Donation"}</option>
                <option value="noConfirmado">{L ? "Por confirmar" : "TBD"}</option>
              </select>
            </label>
          </CategoryStandardFilterGroup>
          <CategoryStandardFilterGroup label={L ? "Fecha" : "Date"}>
            <label className={CAT_STD_FILTER_LABEL}>
              {L ? "Desde" : "From"}
              <input
                type="date"
                className={CAT_STD_FILTER_INPUT}
                value={values.dateFrom ?? ""}
                onChange={(e) => onChange("dateFrom", e.target.value)}
              />
            </label>
            <label className={CAT_STD_FILTER_LABEL}>
              {L ? "Hasta" : "To"}
              <input
                type="date"
                className={CAT_STD_FILTER_INPUT}
                value={values.dateTo ?? ""}
                onChange={(e) => onChange("dateTo", e.target.value)}
              />
            </label>
          </CategoryStandardFilterGroup>
        </>
      ) : (
        <CategoryStandardFilterGroup label={L ? "Clase" : "Class"}>
          <label className={CAT_STD_FILTER_LABEL}>
            {L ? "Tipo / materia" : "Subject / type"}
            <select
              className={CAT_STD_FILTER_SELECT}
              value={values.classType ?? ""}
              onChange={(e) => onChange("classType", e.target.value)}
            >
              <option value="">{L ? "Todos" : "All"}</option>
              {CLASES_CATEGORY_OPTIONS.filter((o) => o.value).map((o) => (
                <option key={o.value} value={o.value}>
                  {lang === "en" ? o.labelEn : o.labelEs}
                </option>
              ))}
            </select>
          </label>
          <label className={CAT_STD_FILTER_LABEL}>
            {L ? "Costo" : "Cost"}
            <select
              className={CAT_STD_FILTER_SELECT}
              value={values.cost ?? "all"}
              onChange={(e) => onChange("cost", e.target.value)}
            >
              <option value="all">{L ? "Todos" : "All"}</option>
              <option value="gratis">{L ? "Gratis" : "Free"}</option>
              <option value="pagada">{L ? "Pagada" : "Paid"}</option>
            </select>
          </label>
          <label className={CAT_STD_FILTER_LABEL}>
            {L ? "Modalidad" : "Mode"}
            <select
              className={CAT_STD_FILTER_SELECT}
              value={values.mode ?? "all"}
              onChange={(e) => onChange("mode", e.target.value)}
            >
              <option value="all">{L ? "Todas" : "All"}</option>
              <option value="presencial">{L ? "Presencial" : "In person"}</option>
              <option value="enLinea">{L ? "En línea" : "Online"}</option>
              <option value="hibrida">{L ? "Híbrida" : "Hybrid"}</option>
            </select>
          </label>
          <label className={CAT_STD_FILTER_LABEL}>
            {L ? "Nivel" : "Level"}
            <select
              className={CAT_STD_FILTER_SELECT}
              value={values.level ?? "all"}
              onChange={(e) => onChange("level", e.target.value)}
            >
              <option value="all">{L ? "Todos" : "All"}</option>
              {CLASES_SKILL_LEVEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {lang === "en" ? o.labelEn : o.labelEs}
                </option>
              ))}
            </select>
          </label>
        </CategoryStandardFilterGroup>
      )}

      <CategoryStandardFilterGroup label={L ? "Audiencia y registro" : "Audience & registration"}>
        <label className={CAT_STD_FILTER_LABEL}>
          {L ? "Para quién" : "Audience"}
          <select
            className={CAT_STD_FILTER_SELECT}
            value={values.audience ?? "all"}
            onChange={(e) => onChange("audience", e.target.value)}
          >
            <option value="all">{L ? "Todos" : "All"}</option>
            {COMMUNITY_AUDIENCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {lang === "en" ? o.labelEn : o.labelEs}
              </option>
            ))}
          </select>
        </label>
        <label className={CAT_STD_FILTER_LABEL}>
          {L ? "Registro" : "Registration"}
          <select
            className={CAT_STD_FILTER_SELECT}
            value={values.registration ?? "all"}
            onChange={(e) => onChange("registration", e.target.value)}
          >
            <option value="all">{L ? "Todos" : "All"}</option>
            {COMMUNITY_REGISTRATION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {lang === "en" ? o.labelEn : o.labelEs}
              </option>
            ))}
          </select>
        </label>
        {category === "comunidad" ? (
          <label className={CAT_STD_FILTER_LABEL}>
            {L ? "Acceso" : "Access"}
            <select
              className={CAT_STD_FILTER_SELECT}
              value={values.accessibility ?? "all"}
              onChange={(e) => onChange("accessibility", e.target.value)}
            >
              <option value="all">{L ? "Todos" : "All"}</option>
              {COMUNIDAD_ACCESSIBILITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {lang === "en" ? o.labelEn : o.labelEs}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </CategoryStandardFilterGroup>
    </div>
  );
}

export function BuscoDrawerFields({
  lang,
  values,
  onChange,
}: {
  lang: Lang;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  const L = lang === "es";
  return (
    <div className="space-y-4">
      <CategoryStandardFilterGroup label={L ? "Tipo de solicitud" : "Request type"}>
        <label className={CAT_STD_FILTER_LABEL}>
          {L ? "Tipo" : "Type"}
          <select
            className={CAT_STD_FILTER_SELECT}
            value={values.tipo ?? "all"}
            onChange={(e) => onChange("tipo", e.target.value)}
          >
            <option value="all">{L ? "Todos" : "All"}</option>
            {BUSCO_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {lang === "en" ? o.labelEn : o.labelEs}
              </option>
            ))}
          </select>
        </label>
        <label className={CAT_STD_FILTER_LABEL}>
          {L ? "Zona / área" : "Zone / area"}
          <input
            className={CAT_STD_FILTER_INPUT}
            value={values.zone ?? ""}
            onChange={(e) => onChange("zone", e.target.value)}
          />
        </label>
        <label className={CAT_STD_FILTER_LABEL}>
          {L ? "Presupuesto" : "Budget"}
          <input
            className={CAT_STD_FILTER_INPUT}
            value={values.budget ?? ""}
            onChange={(e) => onChange("budget", e.target.value)}
          />
        </label>
      </CategoryStandardFilterGroup>
      <CategoryStandardFilterGroup label={L ? "Contacto" : "Contact"}>
        <label className={CAT_STD_FILTER_LABEL}>
          {L ? "Método de contacto" : "Contact method"}
          <select
            className={CAT_STD_FILTER_SELECT}
            value={values.contact ?? "all"}
            onChange={(e) => onChange("contact", e.target.value)}
          >
            <option value="all">{L ? "Cualquiera" : "Any"}</option>
            <option value="phone">{L ? "Teléfono / WhatsApp" : "Phone / WhatsApp"}</option>
            <option value="email">{L ? "Correo" : "Email"}</option>
            <option value="any">{L ? "Teléfono o correo" : "Phone or email"}</option>
          </select>
        </label>
      </CategoryStandardFilterGroup>
    </div>
  );
}

export function MascotasDrawerFields({
  lang,
  values,
  onChange,
}: {
  lang: Lang;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  const L = lang === "es";
  return (
    <div className="space-y-4">
      <CategoryStandardFilterGroup label={L ? "Tipo de aviso" : "Notice type"}>
        <label className={CAT_STD_FILTER_LABEL}>
          {L ? "Tipo" : "Type"}
          <select
            className={CAT_STD_FILTER_SELECT}
            value={values.tipo ?? "all"}
            onChange={(e) => onChange("tipo", e.target.value)}
          >
            <option value="all">{L ? "Todos" : "All"}</option>
            {MASCOTAS_PERDIDOS_NOTICE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {lang === "en" ? o.labelEn : o.labelEs}
              </option>
            ))}
          </select>
        </label>
      </CategoryStandardFilterGroup>
      <CategoryStandardFilterGroup label={L ? "Ubicación / aviso" : "Location / notice"}>
        <label className={CAT_STD_FILTER_LABEL}>
          {L ? "Última vez visto / zona" : "Last seen / area"}
          <input
            className={CAT_STD_FILTER_INPUT}
            value={values.lastSeenArea ?? ""}
            onChange={(e) => onChange("lastSeenArea", e.target.value)}
            placeholder={L ? "ej. parque, colonia" : "e.g. park, neighborhood"}
          />
        </label>
        <label className={`${CAT_STD_FILTER_LABEL} flex items-center gap-2`}>
          <input
            type="checkbox"
            checked={values.hasPhoto === "1"}
            onChange={(e) => onChange("hasPhoto", e.target.checked ? "1" : "")}
            className="h-4 w-4 rounded"
          />
          {L ? "Con foto" : "Has photo"}
        </label>
      </CategoryStandardFilterGroup>
    </div>
  );
}
