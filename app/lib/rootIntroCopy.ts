import { DEFAULT_LANG, type SupportedLang } from "@/app/lib/language";

export type RootIntroCopy = {
  heading: string;
  enter: string;
  selectedLabel: string;
};

export const ROOT_INTRO_COPY: Record<SupportedLang, RootIntroCopy> = {
  es: {
    heading: "Elige tu idioma",
    enter: "Entrar a Leonix",
    selectedLabel: "Español",
  },
  en: {
    heading: "Choose your language",
    enter: "Enter Leonix",
    selectedLabel: "English",
  },
  vi: {
    heading: "Chọn ngôn ngữ của bạn",
    enter: "Vào Leonix",
    selectedLabel: "Tiếng Việt",
  },
  pt: {
    heading: "Escolha seu idioma",
    enter: "Entrar na Leonix",
    selectedLabel: "Português",
  },
  tl: {
    heading: "Piliin ang iyong wika",
    enter: "Pumasok sa Leonix",
    selectedLabel: "Tagalog / Filipino",
  },
  km: {
    heading: "ជ្រើសរើសភាសារបស់អ្នក",
    enter: "ចូលទៅ Leonix",
    selectedLabel: "Khmer / Cambodian",
  },
  zh: {
    heading: "选择你的语言",
    enter: "进入 Leonix",
    selectedLabel: "中文",
  },
  ja: {
    heading: "言語を選択",
    enter: "Leonix に入る",
    selectedLabel: "日本語",
  },
  ko: {
    heading: "언어를 선택하세요",
    enter: "Leonix 들어가기",
    selectedLabel: "한국어",
  },
  hi: {
    heading: "अपनी भाषा चुनें",
    enter: "Leonix में प्रवेश करें",
    selectedLabel: "हिन्दी",
  },
  hy: {
    heading: "Ընտրեք ձեր լեզուն",
    enter: "Մուտք գործել Leonix",
    selectedLabel: "Հայերեն",
  },
  ru: {
    heading: "Выберите язык",
    enter: "Войти в Leonix",
    selectedLabel: "Русский",
  },
  pa: {
    heading: "ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ",
    enter: "Leonix ਵਿੱਚ ਦਾਖਲ ਹੋਵੋ",
    selectedLabel: "ਪੰਜਾਬੀ",
  },
};

/** Root intro UI copy for the active public language. */
export function getRootIntroCopy(lang: SupportedLang): RootIntroCopy {
  return ROOT_INTRO_COPY[lang] ?? ROOT_INTRO_COPY[DEFAULT_LANG];
}
