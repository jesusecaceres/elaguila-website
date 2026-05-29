import type { ServiciosLang } from "./clasificadosServiciosApplicationTypes";
import { getBusinessTypePreset } from "./businessTypePresets";
import {
  resolveServiciosListingTemplate,
  type ServiciosListingTemplate,
} from "@/app/(site)/clasificados/servicios/lib/serviciosTemplateRouting";

export function resolveServiciosApplicationTemplate(businessTypeId: string): ServiciosListingTemplate {
  const preset = getBusinessTypePreset(businessTypeId);
  return resolveServiciosListingTemplate({
    businessTypeId: businessTypeId.trim() || null,
    internalGroup: preset?.internalGroup ?? null,
    categoryLabel: null,
  });
}

export type ServiciosCredentialPlaceholders = {
  licenseType: string;
  licenseNumber: string;
  licenseAuthority: string;
  insuranceType: string;
  certifications: string;
};

export function getServiciosCredentialPlaceholders(
  template: ServiciosListingTemplate,
  lang: ServiciosLang,
): ServiciosCredentialPlaceholders {
  if (template === "legal_provider") {
    return lang === "en"
      ? {
          licenseType: "Attorney / State Bar",
          licenseNumber: "Bar number",
          licenseAuthority: "State Bar of California",
          insuranceType: "Professional liability (if applicable)",
          certifications: "Specialization, legal association, professional membership",
        }
      : {
          licenseType: "Abogado / State Bar",
          licenseNumber: "Número de barra",
          licenseAuthority: "State Bar of California",
          insuranceType: "Responsabilidad profesional (si aplica)",
          certifications: "Especialización, membresía legal, asociación profesional",
        };
  }
  if (template === "clinic_provider") {
    return lang === "en"
      ? {
          licenseType: "Dentist, physician, therapist, chiropractor",
          licenseNumber: "License number",
          licenseAuthority: "Dental Board of California, Medical Board of California",
          insuranceType: "Malpractice / professional liability",
          certifications: "Board certification, CPR, specialty",
        }
      : {
          licenseType: "Dentista, médico, terapeuta, quiropráctico",
          licenseNumber: "Número de licencia",
          licenseAuthority: "Dental Board of California, Medical Board of California",
          insuranceType: "Mala praxis / responsabilidad profesional",
          certifications: "Board certification, CPR, especialidad",
        };
  }
  if (template === "financial_provider") {
    return lang === "en"
      ? {
          licenseType: "CPA, tax preparer, enrolled agent",
          licenseNumber: "CPA license, PTIN, EA number",
          licenseAuthority: "IRS, CTEC, California Board of Accountancy",
          insuranceType: "Errors & omissions (if applicable)",
          certifications: "CPA, EA, QuickBooks ProAdvisor",
        }
      : {
          licenseType: "CPA, preparador de impuestos, agente registrado",
          licenseNumber: "Licencia CPA, PTIN, número EA",
          licenseAuthority: "IRS, CTEC, California Board of Accountancy",
          insuranceType: "Errores y omisiones (si aplica)",
          certifications: "CPA, EA, QuickBooks ProAdvisor",
        };
  }
  if (template === "advisor_provider") {
    return lang === "en"
      ? {
          licenseType: "Insurance license, RIA, consultant registration",
          licenseNumber: "License or registration number",
          licenseAuthority: "California DOI, SEC, state board",
          insuranceType: "E&O / professional liability",
          certifications: "Designations, carrier appointments",
        }
      : {
          licenseType: "Licencia de seguros, RIA, registro de consultor",
          licenseNumber: "Número de licencia o registro",
          licenseAuthority: "California DOI, SEC, junta estatal",
          insuranceType: "E&O / responsabilidad profesional",
          certifications: "Designaciones, nombramientos con aseguradoras",
        };
  }
  return lang === "en"
    ? {
        licenseType: "Contractor, cosmetology, plumbing",
        licenseNumber: "License number",
        licenseAuthority: "California, CSLB, state board",
        insuranceType: "General liability",
        certifications: "Certified technician, trade certification",
      }
    : {
        licenseType: "Contratista, cosmetología, plomería",
        licenseNumber: "Número de licencia",
        licenseAuthority: "California, CSLB, junta estatal",
        insuranceType: "Responsabilidad general",
        certifications: "Técnico certificado, certificación del oficio",
      };
}

export type ServiciosPromoCopyHints = {
  promotionsSectionIntro: string;
  promoTitlePlaceholder: string;
  promoDetailsPlaceholder: string;
  offerTitleHelp: string;
  offerDetailsHelp: string;
};

export function getServiciosPromoCopyHints(
  template: ServiciosListingTemplate,
  lang: ServiciosLang,
): ServiciosPromoCopyHints {
  if (template === "legal_provider") {
    return lang === "en"
      ? {
          promotionsSectionIntro:
            "Add up to 4 clear offers for your profile. Use professional language; only claim “no fee unless we win” if it is true.",
          promoTitlePlaceholder: "Ex: Free initial consultation",
          promoDetailsPlaceholder: "Ex: Case review at no cost for new clients",
          offerTitleHelp: "Direct headline: what you offer (e.g. “Free case review”).",
          offerDetailsHelp: "Who qualifies, conditions, and timing. Avoid misleading guarantees.",
        }
      : {
          promotionsSectionIntro:
            "Añade hasta 4 ofertas claras. Usa lenguaje profesional; solo indica “no cobramos si no ganamos” si es verdad.",
          promoTitlePlaceholder: "Ej.: Consulta inicial gratis",
          promoDetailsPlaceholder: "Ej.: Revisión de caso sin costo para clientes nuevos",
          offerTitleHelp: "Titular directo: qué ofreces (ej. “Revisión de caso gratis”).",
          offerDetailsHelp: "Quién califica, condiciones y vigencia. Evita garantías engañosas.",
        };
  }
  if (template === "clinic_provider") {
    return lang === "en"
      ? {
          promotionsSectionIntro:
            "Add up to 4 offers patients can understand quickly — exams, packages, or payment plans.",
          promoTitlePlaceholder: "Ex: Discount on first visit",
          promoDetailsPlaceholder: "Ex: New patient special · payment plans available",
          offerTitleHelp: "What the promo is and who it is for.",
          offerDetailsHelp: "Include discount, eligible services, and expiration if any.",
        }
      : {
          promotionsSectionIntro:
            "Añade hasta 4 ofertas que el paciente entienda rápido: consultas, paquetes o planes de pago.",
          promoTitlePlaceholder: "Ej.: Primera consulta con descuento",
          promoDetailsPlaceholder: "Ej.: Especial para pacientes nuevos · planes de pago disponibles",
          offerTitleHelp: "Qué es la promoción y para quién aplica.",
          offerDetailsHelp: "Incluye descuento, servicios elegibles y vigencia si aplica.",
        };
  }
  if (template === "financial_provider") {
    return lang === "en"
      ? {
          promotionsSectionIntro:
            "Add up to 4 professional offers — new client discounts, free consults, or small-business packages.",
          promoTitlePlaceholder: "Ex: Discount for new clients",
          promoDetailsPlaceholder: "Ex: Free tax consultation · small business package",
          offerTitleHelp: "Clear offer headline for your practice.",
          offerDetailsHelp: "Scope, eligibility, and any limits or deadlines.",
        }
      : {
          promotionsSectionIntro:
            "Añade hasta 4 ofertas profesionales: descuento para nuevos clientes, consulta gratis o paquete PYME.",
          promoTitlePlaceholder: "Ej.: Descuento para nuevos clientes",
          promoDetailsPlaceholder: "Ej.: Consulta de impuestos gratis · paquete para pequeñas empresas",
          offerTitleHelp: "Titular claro para tu práctica.",
          offerDetailsHelp: "Alcance, elegibilidad y límites o fechas si aplican.",
        };
  }
  return lang === "en"
    ? {
        promotionsSectionIntro:
          "Add up to 4 short offers for your profile. Use clear, professional promotions customers can understand quickly.",
        promoTitlePlaceholder: "Ex: Limited-time special",
        promoDetailsPlaceholder: "Ex: Discount for new customers",
        offerTitleHelp: "Direct headline: what you offer and for whom.",
        offerDetailsHelp: "Include the offer, who qualifies, conditions, and timing if relevant.",
      }
    : {
        promotionsSectionIntro:
          "Añade hasta 4 ofertas breves. Usa promociones claras y profesionales que el cliente entienda al instante.",
        promoTitlePlaceholder: "Ej.: Promoción especial por tiempo limitado",
        promoDetailsPlaceholder: "Ej.: Descuento para nuevos clientes",
        offerTitleHelp: "Titular directo: qué ofreces y para quién.",
        offerDetailsHelp: "Incluye la oferta, quién califica, condiciones y vigencia si aplica.",
      };
}
