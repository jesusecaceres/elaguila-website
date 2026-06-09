import type { AudienceType, InquiryType, PreferredContactMethod } from "@/app/lib/leonix/inquiryTypes";
import type { SupportedLang } from "@/app/lib/language";

export type ContactPageCopy = {
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  business: string;
  emailLabel: string;
  hoursLabel: string;
  hours: string;
  phoneLabel: string;
  addressLabel: string;
  openMap: string;
  promoHelpTitle: string;
  promoHelpBody: string;
  promoHelpCta: string;
};

export type ContactFormCopy = {
  formTitle: string;
  formIntro: string;
  sending: string;
  send: string;
  consent: string;
  wantsLaunch: string;
  consentError: string;
  optional: string;
  errorOrEmail: string;
  errorOrCall: string;
  fields: {
    inquiryType: string;
    fullName: string;
    email: string;
    phone: string;
    businessName: string;
    preferredContact: string;
    cityArea: string;
    websiteOrSocial: string;
    businessCategory: string;
    message: string;
  };
  placeholders: {
    fullName: string;
    email: string;
    phone: string;
    businessName: string;
    cityArea: string;
    websiteOrSocial: string;
    businessCategory: string;
    message: string;
  };
  preferred: Record<PreferredContactMethod, string>;
  promoHint: string;
  promoLink: string;
};

export type NewsletterFormCopy = {
  title: string;
  subtitle: string;
  body: string;
  fields: {
    email: string;
    name: string;
    business: string;
    city: string;
    zip: string;
    audienceType: string;
    preferredLanguage: string;
    interests: string;
  };
  audienceOptions: Record<AudienceType | "", string>;
  preferredOptions: { value: string; label: string }[];
  consent: string;
  consentError: string;
  submit: string;
  submitting: string;
  successTitle: string;
  fromComingSoon: string;
  placeholders: {
    email: string;
    name: string;
    business: string;
    city: string;
    zip: string;
    interests: string;
  };
  languageLabel: string;
};

export type TiendaContactPageCopy = {
  metaTitle: string;
  metaDescription: string;
  navLabel: string;
  howToReach: string;
  openMap: string;
  serviceInterestPrefix: string;
};

export type TiendaContactFormCopy = {
  title: string;
  intro: string;
  productInterest: string;
  fullName: string;
  email: string;
  phone: string;
  business: string;
  cityArea: string;
  message: string;
  consent: string;
  consentError: string;
  submit: string;
  submitting: string;
  errorOrCall: string;
  inquiryOptions: { value: string; label: string }[];
};

export type LeadMessagesCopy = {
  leadSuccess: Record<InquiryType, string>;
  newsletterSuccess: string;
  publicError: string;
};

export type InquiryLabelsCopy = Record<InquiryType, string>;

export type EmailBlockCopy = {
  openEmail: string;
  shareApps: string;
  copied: string;
  copyAria: string;
};

export type PublicLocaleCopy = {
  contactPage: ContactPageCopy;
  contactForm: ContactFormCopy;
  newsletter: NewsletterFormCopy;
  tiendaPage: TiendaContactPageCopy;
  tiendaForm: TiendaContactFormCopy;
  leads: LeadMessagesCopy;
  inquiryLabels: InquiryLabelsCopy;
  emailBlock: EmailBlockCopy;
};

export type PublicFormLang = SupportedLang;
