/**
 * Static UI copy keys — extend per namespace; do not call Google on page load.
 * Full page migration is out of scope for GLOBAL-TRANS1.
 */

export type StaticCopyNamespace = "magazine.demo" | "platform.lang";

export type StaticCopyKey =
  | "magazine.demo.spanishVisualNote"
  | "magazine.demo.readerIntro"
  | "platform.lang.moreLanguages";

export type StaticCopyDictionary = Partial<Record<StaticCopyKey, Partial<Record<"es" | "en" | "vi", string>>>>;

/** Hand-authored static strings only — no provider calls. */
export const STATIC_COPY: StaticCopyDictionary = {
  "magazine.demo.spanishVisualNote": {
    es: "La edición visual impresa y digital permanece en español.",
    en: "The print and digital visual edition remains in Spanish.",
    vi: "Phiên bản hình ảnh in và kỹ thuật số vẫn là tiếng Tây Ban Nha.",
  },
  "magazine.demo.readerIntro": {
    es: "Este lector resume información clave en su idioma seleccionado.",
    en: "This reader summarizes key information in your selected language.",
    vi: "Trình đọc này tóm tắt thông tin chính bằng ngôn ngữ bạn chọn.",
  },
  "platform.lang.moreLanguages": {
    es: "Más idiomas",
    en: "More languages",
    vi: "Thêm ngôn ngữ",
  },
};

export const STATIC_COPY_NAMESPACE_KEYS: Record<StaticCopyNamespace, StaticCopyKey[]> = {
  "magazine.demo": ["magazine.demo.spanishVisualNote", "magazine.demo.readerIntro"],
  "platform.lang": ["platform.lang.moreLanguages"],
};
