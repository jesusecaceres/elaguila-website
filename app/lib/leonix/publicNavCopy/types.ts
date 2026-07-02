import type { SupportedLang } from "@/app/lib/language";

export type PublicNavItemLabels = {
  inicio: string;
  revista: string;
  clasificados: string;
  "negocios-locales": string;
  "recursos-comunitarios": string;
  "recursos-all": string;
  "comunidad-eventos": string;
  clases: string;
  iglesias: string;
  "ayuda-comunitaria": string;
  viajes: string;
  "productos-promocionales": string;
  "productos-promocionalesShort"?: string;
  "compact-overflow": string;
  anunciate: string;
  "about-us": string;
  "contact-us": string;
};

export type NavbarChromeCopy = {
  brandName: string;
  navAria: string;
  recursosMenu: string;
  langAria: string;
  signIn: string;
  createAccount: string;
  myAccount: string;
  myListings: string;
  signOut: string;
  account: string;
  manageAccount: string;
  signedOutToast: string;
  openMenu: string;
  closeMenu: string;
  menu: string;
};

export type PublicNavCopyBundle = {
  items: PublicNavItemLabels;
  chrome: NavbarChromeCopy;
};

export type PublicNavCopyRegistry = Record<SupportedLang, PublicNavCopyBundle>;
