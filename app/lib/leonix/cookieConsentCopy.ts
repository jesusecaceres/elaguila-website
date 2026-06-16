import type { SupportedLang } from "@/app/lib/language";

export type CookieConsentCopy = {
  title: string;
  body: string;
  body2: string;
  acceptAll: string;
  rejectNonEssential: string;
  manage: string;
  save: string;
  close: string;
  necessary: string;
  necessaryHint: string;
  analytics: string;
  analyticsHint: string;
  personalization: string;
  personalizationHint: string;
};

const ES: CookieConsentCopy = {
  title: "Cookies y preferencias",
  body:
    "Usamos cookies necesarias para el sitio (sesión, seguridad, idioma y continuidad esencial). Con tu permiso, también podemos usar analíticas de primera parte y preferencias para mejorar tu experiencia de navegación en Leonix.",
  body2:
    "La analítica no se activa antes de que elijas. La personalización es opcional y sirve para recordar preferencias en este sitio — no vendemos tus datos ni habilitamos seguimiento entre sitios.",
  acceptAll: "Aceptar todo",
  rejectNonEssential: "Rechazar lo no esencial",
  manage: "Gestionar preferencias",
  save: "Guardar",
  close: "Cerrar",
  necessary: "Necesarias (siempre activas)",
  necessaryHint: "Sesión, seguridad, idioma y continuidad de rutas esenciales.",
  analytics: "Analíticas",
  analyticsHint: "Medición agregada del uso en Leonix (primera parte).",
  personalization: "Personalización",
  personalizationHint: "Recordar preferencias de búsqueda y similares solo en este sitio.",
};

const EN: CookieConsentCopy = {
  title: "Cookies & preferences",
  body:
    "We use strictly necessary cookies for the site (session, security, language, and essential continuity). With your permission, we may also use first-party analytics and preferences to improve your Leonix browsing experience.",
  body2:
    "Analytics do not run before you choose. Personalization is optional and helps remember preferences on this site — we do not sell your data or enable cross-site tracking.",
  acceptAll: "Accept all",
  rejectNonEssential: "Reject non-essential",
  manage: "Manage preferences",
  save: "Save",
  close: "Close",
  necessary: "Necessary (always on)",
  necessaryHint: "Session, security, language, and essential route continuity.",
  analytics: "Analytics",
  analyticsHint: "Aggregated, first-party usage measurement on Leonix.",
  personalization: "Personalization",
  personalizationHint: "Remember search preferences and similar only on this site.",
};

function fromEn(partial: Partial<CookieConsentCopy>): CookieConsentCopy {
  return { ...EN, ...partial };
}

export const COOKIE_CONSENT_COPY: Record<SupportedLang, CookieConsentCopy> = {
  es: ES,
  en: EN,
  vi: fromEn({
    title: "Cookie và tùy chọn",
    body: "Chúng tôi dùng cookie cần thiết cho trang (phiên, bảo mật, ngôn ngữ và liên tục thiết yếu). Với sự cho phép của bạn, chúng tôi có thể dùng phân tích first-party và tùy chọn để cải thiện trải nghiệm trên Leonix.",
    body2: "Phân tích không chạy trước khi bạn chọn. Cá nhân hóa là tùy chọn — chúng tôi không bán dữ liệu của bạn.",
    acceptAll: "Chấp nhận tất cả",
    rejectNonEssential: "Từ chối không cần thiết",
    manage: "Quản lý tùy chọn",
    save: "Lưu",
    close: "Đóng",
    necessary: "Cần thiết (luôn bật)",
    necessaryHint: "Phiên, bảo mật, ngôn ngữ và liên tục tuyến đường thiết yếu.",
    analytics: "Phân tích",
    analyticsHint: "Đo lường sử dụng tổng hợp trên Leonix (first-party).",
    personalization: "Cá nhân hóa",
    personalizationHint: "Ghi nhớ tùy chọn tìm kiếm chỉ trên trang này.",
  }),
  pt: fromEn({
    title: "Cookies e preferências",
    body: "Usamos cookies necessários para o site (sessão, segurança, idioma e continuidade essencial). Com sua permissão, podemos usar analíticas first-party e preferências para melhorar sua experiência na Leonix.",
    body2: "Analíticas não rodam antes de você escolher. Personalização é opcional — não vendemos seus dados.",
    acceptAll: "Aceitar tudo",
    rejectNonEssential: "Rejeitar não essenciais",
    manage: "Gerenciar preferências",
    save: "Salvar",
    close: "Fechar",
    necessary: "Necessários (sempre ativos)",
    analytics: "Analíticas",
    personalization: "Personalização",
  }),
  tl: fromEn({
    title: "Cookies at preferences",
    acceptAll: "Tanggapin lahat",
    rejectNonEssential: "Tanggihan ang non-essential",
    manage: "Pamahalaan ang preferences",
    save: "I-save",
    close: "Isara",
  }),
  km: fromEn({ title: "Cookies និងការកំណត់", acceptAll: "ទទួលយកទាំងអស់", manage: "គ្រប់គ្រងការកំណត់", save: "រក្សាទុក", close: "បិទ" }),
  zh: fromEn({ title: "Cookie 与偏好", acceptAll: "全部接受", rejectNonEssential: "拒绝非必要", manage: "管理偏好", save: "保存", close: "关闭" }),
  ja: fromEn({
    title: "Cookieと設定",
    body: "サイトに必要なCookie（セッション、セキュリティ、言語、基本の継続性）を使用します。許可いただければ、ファーストパーティ分析と設定でLeonixの体験を改善できます。",
    body2: "分析は選択前には実行されません。パーソナライズは任意です — データを販売しません。",
    acceptAll: "すべて同意",
    rejectNonEssential: "不要なものを拒否",
    manage: "設定を管理",
    save: "保存",
    close: "閉じる",
    necessary: "必要（常にオン）",
    analytics: "分析",
    personalization: "パーソナライズ",
  }),
  ko: fromEn({ title: "쿠키 및 설정", acceptAll: "모두 수락", rejectNonEssential: "필수 아님 거부", manage: "설정 관리", save: "저장", close: "닫기" }),
  hi: fromEn({ title: "कुकीज़ और प्राथमिकताएँ", acceptAll: "सभी स्वीकारें", manage: "प्राथमिकताएँ प्रबंधित करें", save: "सहेजें", close: "बंद करें" }),
  hy: fromEn({ title: "Cookie-ներ և կարգավորումներ", acceptAll: "Ընդունել բոլորը", manage: "Կառավարել կարգավորումները", save: "Պահպանել", close: "Փակել" }),
  ru: fromEn({ title: "Cookie и настройки", acceptAll: "Принять все", rejectNonEssential: "Отклонить необязательные", manage: "Управление настройками", save: "Сохранить", close: "Закрыть" }),
  pa: fromEn({ title: "ਕੁਕੀਜ਼ ਅਤੇ ਪਸੰਦਾਂ", acceptAll: "ਸਭ ਸਵੀਕਾਰ ਕਰੋ", manage: "ਪਸੰਦਾਂ ਪ੍ਰਬੰਧਿਤ ਕਰੋ", save: "ਸੇਵ ਕਰੋ", close: "ਬੰਦ ਕਰੋ" }),
};

export function getCookieConsentCopy(lang: SupportedLang): CookieConsentCopy {
  return COOKIE_CONSENT_COPY[lang];
}
