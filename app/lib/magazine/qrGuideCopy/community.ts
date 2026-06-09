import type { SupportedLang } from "@/app/lib/language";
import { QR_GUIDE_EN } from "./en";
import { QR_GUIDE_ES } from "./es";
import type { QrGuideCopy } from "./types";

function g(partial: Partial<QrGuideCopy> & Pick<QrGuideCopy, "heroTitle">): QrGuideCopy {
  return {
    ...QR_GUIDE_EN,
    ...partial,
    cards: { ...QR_GUIDE_EN.cards, ...partial.cards },
    deviceExpand: { ...QR_GUIDE_EN.deviceExpand, ...partial.deviceExpand },
    actions: { ...QR_GUIDE_EN.actions, ...partial.actions },
  };
}

export const QR_GUIDE_VI: QrGuideCopy = g({
  eyebrow: "Hướng dẫn QR · Dịch",
  backToMagazine: "Quay lại tạp chí",
  heroTitle: "Dịch tạp chí",
  truthLine:
    "Tạp chí hình ảnh bằng tiếng Tây Ban Nha. Dùng công cụ dịch trên điện thoại để đọc bằng ngôn ngữ của bạn.",
  trustNote:
    "Leonix không tự dịch PDF hay flipbook. Leonix cung cấp hướng dẫn, liên kết, Media Kit và hành động liên hệ.",
  decisionPrompt: "Bạn đang đọc tạp chí như thế nào?",
  translationOptionsCta: "Xem tùy chọn dịch",
  cards: {
    printed: {
      title: "Tạp chí in",
      steps: [
        "Mở camera điện thoại, Google Lens, camera Google Translate hoặc Apple Live Text.",
        "Hướng vào trang in.",
        "Chạm Dịch / chọn ngôn ngữ.",
        "Quay lại Leonix để xem liên kết, liên hệ, Media Kit và hành động.",
      ],
      announcement:
        "Khi nhận tạp chí in, bạn có thể quét mã QR và dùng cùng quy trình này.",
    },
    desktop: {
      title: "Tạp chí kỹ thuật số trên máy tính, máy tính bảng hoặc màn hình khác",
      steps: [
        "Mở Google Lens, camera Google Translate hoặc Camera/Live Text trên điện thoại.",
        "Hướng điện thoại vào tạp chí trên màn hình này.",
        "Chạm Dịch và chọn ngôn ngữ.",
        "Quay lại Leonix để liên kết và hành động.",
      ],
      captureNote:
        "Trên nhiều điện thoại, bạn có thể lưu văn bản đã dịch để không phải liên tục hướng vào màn hình.",
      qrLabel: "Quét để mở lại hướng dẫn này",
      qrNote: "Mã QR này mở lại hướng dẫn Leonix — không tự mở app dịch.",
    },
    onPhone: {
      title: "Đã ở trên điện thoại này",
      intro: "Bạn không thể quét màn hình điện thoại của chính mình bằng cùng điện thoại đó.",
      steps: [
        "Chụp ảnh màn hình trang tạp chí.",
        "Mở ảnh chụp trong Google Photos, Google Lens, app Google hoặc công cụ ảnh.",
        "Chạm biểu tượng Lens / Dịch.",
        "Chọn hoặc bôi đen văn bản bằng ngón tay nếu cần.",
        "Chọn ngôn ngữ và đọc bản dịch.",
      ],
      screenshotPlaceholder: "Sắp có: hình minh họa quy trình Lens trên ảnh chụp màn hình.",
      htmlCompanionComing: "Sắp có: mở phiên bản văn bản để đọc dễ hơn trên di động.",
      openTextVersionLabel: "Mở phiên bản văn bản (sắp có)",
    },
    website: {
      title: "Dịch trang web Leonix",
      intro: "Muốn duyệt Leonix bằng ngôn ngữ khác?",
      note: "Dùng chế độ dịch trang web Google Translate. Điều này giúp duyệt site, không đảm bảo dịch ảnh PDF/flipbook. Form và CTA nên dùng trang Leonix gốc theo ngôn ngữ bạn chọn.",
      ctaLabel: "Dịch site Leonix (Google)",
    },
  },
  deviceExpand: {
    apple: {
      title: "iPhone / Apple",
      steps: [
        "Mở Camera và hướng vào văn bản tạp chí.",
        "Chạm biểu tượng Live Text khi xuất hiện, rồi Dịch.",
        "Hoặc mở Photos → chọn ảnh chụp → chạm Dịch.",
        "Giao diện có thể khác tùy phiên bản iOS.",
      ],
    },
    android: {
      title: "Android / Google",
      steps: [
        "Mở Google Lens, app Google hoặc camera Google Translate.",
        "Chạm biểu tượng Lens trên thanh tìm kiếm, camera hoặc thư viện.",
        "Hướng vào trang hoặc mở ảnh chụp màn hình.",
        "Bôi đen văn bản nếu cần và chọn ngôn ngữ.",
      ],
    },
  },
  websiteLangNote: "Bộ chọn 🌐 Languages giúp site Leonix — không dịch tạp chí hình ảnh.",
  summaryTitle: "Tóm tắt nhanh Leonix",
  summaryNote: "Tóm tắt này hữu ích, nhưng tạp chí hình ảnh gốc vẫn bằng tiếng Tây Ban Nha.",
  actionsEyebrow: "Hành động Leonix",
  actions: {
    openDigital: "Mở tạp chí kỹ thuật số gốc",
    downloadPdf: "Tải PDF gốc",
    mediaKit: "Xem Media Kit",
    contact: "Liên hệ Leonix",
  },
});

export const QR_GUIDE_PT: QrGuideCopy = g({
  eyebrow: "Guia QR · Tradução",
  backToMagazine: "Voltar à revista",
  heroTitle: "Traduzir a revista",
  truthLine:
    "A revista visual está em espanhol. Use as ferramentas de tradução do seu telefone para lê-la no seu idioma.",
  trustNote:
    "A Leonix não traduz automaticamente o PDF nem o flipbook. A Leonix oferece o guia, links, Media Kit e ações de contacto.",
  decisionPrompt: "Como você está lendo a revista?",
  translationOptionsCta: "Ver opções de tradução",
  cards: {
    printed: {
      title: "Revista impressa",
      steps: [
        "Abra a câmera do telefone, Google Lens, Google Translate com câmera ou Apple Live Text.",
        "Aponte para a página impressa.",
        "Toque Traduzir / escolha seu idioma.",
        "Volte à Leonix para links, contacto, Media Kit e ações.",
      ],
      announcement:
        "Quando receber a revista impressa, poderá escanear o QR e usar o mesmo processo descrito aqui.",
    },
    desktop: {
      title: "Revista digital no computador, tablet ou outra tela",
      steps: [
        "Abra Google Lens, Google Translate com câmera ou Câmera/Live Text da Apple no telefone.",
        "Aponte o telefone para a revista nesta tela.",
        "Toque Traduzir e escolha seu idioma.",
        "Volte à Leonix para links e ações.",
      ],
      captureNote:
        "Em muitos telefones, você pode capturar o texto traduzido para não precisar continuar apontando para a tela.",
      qrLabel: "Escaneie para reabrir este guia",
      qrNote: "Este QR reabre o guia Leonix — não abre automaticamente um app de tradução.",
    },
    onPhone: {
      title: "Já neste telefone",
      intro: "Você não pode escanear a tela do próprio telefone com o mesmo telefone.",
      steps: [
        "Tire uma captura de tela da página da revista.",
        "Abra a captura no Google Fotos, Google Lens, app Google ou ferramentas de imagem.",
        "Toque no ícone Lens / Traduzir.",
        "Selecione ou destaque o texto com o dedo se necessário.",
        "Escolha seu idioma e leia a tradução.",
      ],
      screenshotPlaceholder: "Em breve: imagem de exemplo do fluxo Lens em captura de tela.",
      htmlCompanionComing: "Em breve: abrir versão em texto para leitura móvel mais fácil.",
      openTextVersionLabel: "Abrir versão em texto (em breve)",
    },
    website: {
      title: "Traduzir o site Leonix",
      intro: "Quer navegar na Leonix em outro idioma?",
      note: "Use o modo site do Google Translate. Isso ajuda a navegar o site, não garante traduzir imagens do PDF/flipbook. Formulários e CTAs devem usar páginas nativas Leonix no seu idioma.",
      ctaLabel: "Traduzir site Leonix (Google)",
    },
  },
  deviceExpand: {
    apple: {
      title: "iPhone / Apple",
      steps: [
        "Abra Câmera e aponte para o texto da revista.",
        "Toque no ícone Live Text quando aparecer, depois Traduzir.",
        "Ou abra Fotos → selecione captura → toque Traduzir.",
        "A interface pode variar conforme a versão do iOS.",
      ],
    },
    android: {
      title: "Android / Google",
      steps: [
        "Abra Google Lens, app Google ou Google Translate com câmera.",
        "Toque no ícone Lens na busca, câmera ou galeria.",
        "Aponte para a página ou abra uma captura de tela.",
        "Destaque o texto com o dedo se necessário e escolha o idioma.",
      ],
    },
  },
  websiteLangNote: "O seletor 🌐 Languages ajuda o site Leonix — não traduz a revista visual.",
  summaryTitle: "Resumo rápido Leonix",
  summaryNote: "Este resumo ajuda, mas a revista visual original permanece em espanhol.",
  actionsEyebrow: "Ações Leonix",
  actions: {
    openDigital: "Abrir revista digital original",
    downloadPdf: "Baixar PDF original",
    mediaKit: "Ver Media Kit",
    contact: "Contactar Leonix",
  },
});

export const QR_GUIDE_JA: QrGuideCopy = g({
  eyebrow: "QRガイド · 翻訳",
  backToMagazine: "雑誌に戻る",
  heroTitle: "雑誌を翻訳する",
  truthLine:
    "視覚的な雑誌はスペイン語です。スマートフォンの翻訳ツールで自分の言語で読んでください。",
  trustNote:
    "LeonixはPDFやflipbookを自動翻訳しません。Leonixはガイド、リンク、Media Kit、連絡アクションを提供します。",
  decisionPrompt: "雑誌をどのように読んでいますか？",
  translationOptionsCta: "翻訳オプションを見る",
  cards: {
    printed: {
      title: "印刷雑誌",
      steps: [
        "スマートフォンのカメラ、Google Lens、Google Translateカメラ、またはApple Live Textを開く。",
        "印刷ページに向ける。",
        "翻訳をタップ / 言語を選択。",
        "Leonixに戻ってリンク、連絡、Media Kit、アクションを利用。",
      ],
      announcement: "印刷雑誌を手に入れたら、QRをスキャンして同じ手順を使えます。",
    },
    desktop: {
      title: "デスクトップ・タブレット・別画面のデジタル雑誌",
      steps: [
        "スマートフォンでGoogle Lens、Google Translateカメラ、またはAppleカメラ/Live Textを開く。",
        "この画面の雑誌に向ける。",
        "翻訳をタップして言語を選択。",
        "Leonixに戻ってリンクとアクションを利用。",
      ],
      captureNote: "多くの端末では翻訳テキストを保存でき、画面を向け続ける必要がありません。",
      qrLabel: "このガイドを再度開くにはスキャン",
      qrNote: "このQRはLeonixガイドを再開します — 翻訳アプリは自動で開きません。",
    },
    onPhone: {
      title: "すでにこのスマートフォン上",
      intro: "同じスマートフォンで自分の画面をスキャンすることはできません。",
      steps: [
        "雑誌ページのスクリーンショットを撮る。",
        "Google フォト、Google Lens、Googleアプリ、または画像ツールで開く。",
        "Lens / 翻訳アイコンをタップ。",
        "必要なら指でテキストを選択・ハイライト。",
        "言語を選んで翻訳を読む。",
      ],
      screenshotPlaceholder: "近日公開：スクリーンショットのLensフロー例。",
      htmlCompanionComing: "近日：モバイル向けテキスト版を開く。",
      openTextVersionLabel: "テキスト版を開く（近日）",
    },
    website: {
      title: "Leonixサイトを翻訳",
      intro: "Leonixを別の言語で閲覧しますか？",
      note: "Google Translateのウェブサイトモードを使用。サイト閲覧の助けになりますが、PDF/flipbook画像の翻訳は保証されません。フォームとCTAはLeonixのネイティブページを使用してください。",
      ctaLabel: "Leonixサイトを翻訳（Google）",
    },
  },
  deviceExpand: {
    apple: {
      title: "iPhone / Apple",
      steps: [
        "カメラを開き雑誌の文字に向ける。",
        "Live Textアイコンが表示されたらタップし、翻訳を選択。",
        "または写真 → スクリーンショット → 翻訳。",
        "iOSバージョンによりUIは異なる場合があります。",
      ],
    },
    android: {
      title: "Android / Google",
      steps: [
        "Google Lens、Googleアプリ、またはGoogle Translateカメラを開く。",
        "検索、カメラ、ギャラリーのLensアイコンをタップ。",
        "ページに向けるかスクリーンショットを開く。",
        "必要なら指でテキストをハイライトし言語を選択。",
      ],
    },
  },
  websiteLangNote: "🌐 LanguagesセレクターはLeonixサイト用 — 視覚雑誌は翻訳しません。",
  summaryTitle: "Leonixクイックサマリー",
  summaryNote: "このサマリーは役立ちますが、視覚雑誌の原版はスペイン語のままです。",
  actionsEyebrow: "Leonixアクション",
  actions: {
    openDigital: "オリジナルデジタル雑誌を開く",
    downloadPdf: "オリジナルPDFをダウンロード",
    mediaKit: "Media Kitを見る",
    contact: "Leonixに連絡",
  },
});

export const QR_GUIDE_TL: QrGuideCopy = g({
  eyebrow: "QR guide · Pagsasalin",
  backToMagazine: "Bumalik sa magazine",
  heroTitle: "Isalin ang magazine",
  truthLine:
    "Ang visual magazine ay nasa Espanyol. Gamitin ang translation tools ng phone mo para basahin sa iyong wika.",
  trustNote:
    "Hindi awtomatikong isinasalin ng Leonix ang PDF o flipbook. Binibigyan ka ng Leonix ng guide, links, Media Kit, at contact actions.",
  decisionPrompt: "Paano mo binabasa ang magazine?",
  translationOptionsCta: "Tingnan ang mga opsyon sa pagsasalin",
  cards: {
    printed: {
      title: "Printed magazine",
      steps: [
        "Buksan ang camera, Google Lens, Google Translate camera, o Apple Live Text.",
        "Ituro sa printed page.",
        "I-tap ang Translate / piliin ang wika.",
        "Bumalik sa Leonix para sa links, contact, Media Kit, at actions.",
      ],
      announcement:
        "Kapag nakuha mo ang printed magazine, maaari mong i-scan ang QR at gamitin ang parehong proseso.",
    },
    desktop: {
      title: "Digital magazine sa desktop, tablet, o ibang screen",
      steps: [
        "Buksan ang Google Lens, Google Translate camera, o Apple Camera/Live Text sa phone.",
        "Ituro ang phone sa magazine sa screen na ito.",
        "I-tap ang Translate at piliin ang wika.",
        "Bumalik sa Leonix para sa links at actions.",
      ],
      captureNote:
        "Sa maraming phone, maaari mong i-save ang translated text para hindi na kailangan ituro nang tuloy-tuloy.",
      qrLabel: "I-scan para buksan muli ang guide na ito",
      qrNote: "Ang QR na ito ay nagbubukas muli ng Leonix guide — hindi awtomatikong nagbubukas ng translation app.",
    },
    onPhone: {
      title: "Nasa phone na ito ka na",
      intro: "Hindi mo maaaring i-scan ang sarili mong screen gamit ang parehong phone.",
      steps: [
        "Kumuha ng screenshot ng magazine page.",
        "Buksan ang screenshot sa Google Photos, Google Lens, Google app, o image tools.",
        "I-tap ang Lens / Translate icon.",
        "Piliin o i-highlight ang text gamit ang daliri kung kailangan.",
        "Piliin ang wika at basahin ang salin.",
      ],
      screenshotPlaceholder: "Malapit na: halimbawang larawan ng Lens screenshot flow.",
      htmlCompanionComing: "Susunod: buksan ang text version para mas madaling basahin sa mobile.",
      openTextVersionLabel: "Buksan ang text version (malapit na)",
    },
    website: {
      title: "Isalin ang Leonix website",
      intro: "Gusto mong mag-browse sa Leonix sa ibang wika?",
      note: "Gamitin ang Google Translate website mode. Tumutulong ito sa pag-browse — hindi garantisadong isasalin ang PDF/flipbook images. Gamitin ang native Leonix pages para sa forms at CTAs.",
      ctaLabel: "Isalin ang Leonix site (Google)",
    },
  },
  deviceExpand: {
    apple: {
      title: "iPhone / Apple",
      steps: [
        "Buksan ang Camera at ituro sa text ng magazine.",
        "I-tap ang Live Text icon kapag lumabas, pagkatapos Translate.",
        "O buksan ang Photos → piliin ang screenshot → i-tap ang Translate.",
        "Maaaring mag-iba ang interface depende sa iOS version.",
      ],
    },
    android: {
      title: "Android / Google",
      steps: [
        "Buksan ang Google Lens, Google app, o Google Translate camera.",
        "I-tap ang Lens icon sa search, camera, o gallery.",
        "Ituro sa page o buksan ang screenshot.",
        "I-highlight ang text kung kailangan at piliin ang wika.",
      ],
    },
  },
  websiteLangNote: "Ang 🌐 Languages selector ay para sa Leonix site — hindi isinasalin ang visual magazine.",
  summaryTitle: "Leonix quick summary",
  summaryNote: "Tumutulong ang summary na ito, ngunit nananatili sa Espanyol ang orihinal na visual magazine.",
  actionsEyebrow: "Leonix actions",
  actions: {
    openDigital: "Buksan ang orihinal na digital magazine",
    downloadPdf: "I-download ang orihinal na PDF",
    mediaKit: "Tingnan ang Media Kit",
    contact: "Makipag-ugnayan sa Leonix",
  },
});

export const QR_GUIDE_COMMUNITY: Partial<Record<SupportedLang, QrGuideCopy>> = {
  vi: QR_GUIDE_VI,
  pt: QR_GUIDE_PT,
  ja: QR_GUIDE_JA,
  tl: QR_GUIDE_TL,
  zh: g({
    eyebrow: "二维码指南 · 翻译",
    backToMagazine: "返回杂志",
    heroTitle: "翻译杂志",
    truthLine: "视觉杂志为西班牙语。请使用手机翻译工具以您的语言阅读。",
    trustNote: "Leonix 不会自动翻译 PDF 或 flipbook。Leonix 提供指南、链接、Media Kit 和联系操作。",
    decisionPrompt: "您如何阅读杂志？",
    translationOptionsCta: "查看翻译选项",
    cards: {
      printed: {
        title: "印刷杂志",
        steps: ["打开手机相机、Google Lens、Google Translate 相机或 Apple Live Text。", "对准印刷页面。", "点击翻译 / 选择语言。", "返回 Leonix 获取链接、联系、Media Kit 和操作。"],
        announcement: "收到印刷杂志后，可扫描二维码并使用相同流程。",
      },
      desktop: {
        title: "电脑、平板或其他屏幕上的数字杂志",
        steps: ["在手机上打开 Google Lens、Google Translate 相机或 Apple 相机/Live Text。", "将手机对准此屏幕上的杂志。", "点击翻译并选择语言。", "返回 Leonix 获取链接和操作。"],
        captureNote: "许多手机可保存翻译文本，无需一直对准屏幕。",
        qrLabel: "扫描以重新打开本指南",
        qrNote: "此二维码重新打开 Leonix 指南 — 不会自动打开翻译应用。",
      },
      onPhone: {
        title: "已在此手机上",
        intro: "无法用同一部手机扫描自己的屏幕。",
        steps: ["截取杂志页面屏幕截图。", "在 Google 相册、Google Lens、Google 应用或图片工具中打开。", "点击 Lens / 翻译图标。", "如需要用手指选择或高亮文本。", "选择语言并阅读翻译。"],
        screenshotPlaceholder: "即将推出：Lens 截图流程示例图。",
        htmlCompanionComing: "即将推出：打开文本版以便移动端阅读。",
        openTextVersionLabel: "打开文本版（即将推出）",
      },
      website: {
        title: "翻译 Leonix 网站",
        intro: "想用其他语言浏览 Leonix？",
        note: "使用 Google Translate 网站模式。这有助于浏览网站，不保证翻译 PDF/flipbook 图片。表单和 CTA 应使用 Leonix 原生页面。",
        ctaLabel: "翻译 Leonix 网站（Google）",
      },
    },
    deviceExpand: {
      apple: { title: "iPhone / Apple", steps: ["打开相机并对准杂志文字。", "出现 Live Text 图标后点击，然后翻译。", "或打开照片 → 选择截图 → 点击翻译。", "界面可能因 iOS 版本而异。"] },
      android: { title: "Android / Google", steps: ["打开 Google Lens、Google 应用或 Google Translate 相机。", "点击搜索、相机或相册中的 Lens 图标。", "对准页面或打开截图。", "如需要用手指高亮文本并选择语言。"] },
    },
    websiteLangNote: "🌐 Languages 选择器帮助 Leonix 网站 — 不翻译视觉杂志。",
    summaryTitle: "Leonix 快速摘要",
    summaryNote: "此摘要有帮助，但原版视觉杂志仍为西班牙语。",
    actionsEyebrow: "Leonix 操作",
    actions: { openDigital: "打开原版数字杂志", downloadPdf: "下载原版 PDF", mediaKit: "查看 Media Kit", contact: "联系 Leonix" },
  }),
  ko: g({
    eyebrow: "QR 가이드 · 번역",
    backToMagazine: "매거진으로 돌아가기",
    heroTitle: "매거진 번역하기",
    truthLine: "시각적 매거진은 스페인어입니다. 휴대폰 번역 도구로 원하는 언어로 읽으세요.",
    trustNote: "Leonix는 PDF나 flipbook을 자동 번역하지 않습니다. Leonix는 가이드, 링크, Media Kit, 연락 액션을 제공합니다.",
    decisionPrompt: "매거진을 어떻게 읽고 있나요?",
    translationOptionsCta: "번역 옵션 보기",
    cards: {
      printed: {
        title: "인쇄 매거진",
        steps: ["휴대폰 카메라, Google Lens, Google Translate 카메라 또는 Apple Live Text를 여세요.", "인쇄 페이지에 비추세요.", "번역을 탭 / 언어를 선택하세요.", "Leonix로 돌아와 링크, 연락, Media Kit, 액션을 이용하세요."],
        announcement: "인쇄 매거진을 받으면 QR을 스캔해 같은 과정을 사용할 수 있습니다.",
      },
      desktop: {
        title: "데스크톱·태블릿·다른 화면의 디지털 매거진",
        steps: ["휴대폰에서 Google Lens, Google Translate 카메라 또는 Apple 카메라/Live Text를 여세요.", "이 화면의 매거진에 비추세요.", "번역을 탭하고 언어를 선택하세요.", "Leonix로 돌아와 링크와 액션을 이용하세요."],
        captureNote: "많은 휴대폰에서 번역된 텍스트를 저장해 화면을 계속 비출 필요가 없습니다.",
        qrLabel: "이 가이드를 다시 열려면 스캔",
        qrNote: "이 QR은 Leonix 가이드를 다시 엽니다 — 번역 앱이 자동으로 열리지 않습니다.",
      },
      onPhone: {
        title: "이미 이 휴대폰에서",
        intro: "같은 휴대폰으로 자신의 화면을 스캔할 수 없습니다.",
        steps: ["매거진 페이지 스크린샷을 찍으세요.", "Google 포토, Google Lens, Google 앱 또는 이미지 도구에서 여세요.", "Lens / 번역 아이콘을 탭하세요.", "필요하면 손가락으로 텍스트를 선택/강조하세요.", "언어를 선택하고 번역을 읽으세요."],
        screenshotPlaceholder: "곧 제공: Lens 스크린샷 흐름 예시 이미지.",
        htmlCompanionComing: "다음: 모바일 읽기를 위한 텍스트 버전.",
        openTextVersionLabel: "텍스트 버전 열기(곧 제공)",
      },
      website: {
        title: "Leonix 웹사이트 번역",
        intro: "다른 언어로 Leonix를 탐색하시겠습니까?",
        note: "Google Translate 웹사이트 모드를 사용하세요. 사이트 탐색에 도움이 되며 PDF/flipbook 이미지 번역을 보장하지 않습니다. 양식과 CTA는 Leonix 네이티브 페이지를 사용하세요.",
        ctaLabel: "Leonix 사이트 번역(Google)",
      },
    },
    deviceExpand: {
      apple: { title: "iPhone / Apple", steps: ["카메라를 열고 매거진 텍스트에 비추세요.", "Live Text 아이콘이 나타나면 탭 후 번역을 선택하세요.", "또는 사진 → 스크린샷 → 번역.", "iOS 버전에 따라 UI가 다를 수 있습니다."] },
      android: { title: "Android / Google", steps: ["Google Lens, Google 앱 또는 Google Translate 카메라를 여세요.", "검색, 카메라 또는 갤러리의 Lens 아이콘을 탭하세요.", "페이지에 비추거나 스크린샷을 여세요.", "필요하면 손가락으로 텍스트를 강조하고 언어를 선택하세요."] },
    },
    websiteLangNote: "🌐 Languages 선택기는 Leonix 사이트용 — 시각 매거진은 번역하지 않습니다.",
    summaryTitle: "Leonix 빠른 요약",
    summaryNote: "이 요약은 도움이 되지만 원본 시각 매거진은 스페인어입니다.",
    actionsEyebrow: "Leonix 액션",
    actions: { openDigital: "원본 디지털 매거진 열기", downloadPdf: "원본 PDF 다운로드", mediaKit: "Media Kit 보기", contact: "Leonix 연락" },
  }),
  km: g({ eyebrow: "ការណែនាំ QR · បកប្រែ", backToMagazine: "ត្រឡប់ទៅទស្សនាវដ្តី", heroTitle: "បកប្រែទស្សនាវដ្តី", truthLine: "ទស្សនាវដ្តីរូបភាពជាភាសាអេស្ប៉ាញ។ ប្រើឧបករណ៍បកប្រែលើទូរស័ព្តរបស់អ្នក។", trustNote: "Leonix មិនបកប្រែ PDF ឬ flipbook ដោយស្វ័យប្រវត្តិទេ។", decisionPrompt: "តើអ្នកអានទស្សនាវដ្តីដោយរបៀបណា?", translationOptionsCta: "មើលជម្រើសបកប្រែ", websiteLangNote: "ឧបករណ៍ជ្រើស 🌐 Languages ជួយគេហទំព័រ Leonix — មិនបកប្រែទស្សនាវដ្តីរូបភាពទេ។", summaryTitle: "សង្ខេប Leonix", summaryNote: "សង្ខេបនេះជួយបាន ប៉ុន្តែទស្សនាវដ្តីដើមនៅតែជាភាសាអេស្ប៉ាញ។", actionsEyebrow: "សកម្មភាព Leonix", actions: { openDigital: "បើកទស្សនាវដ្តីឌីជីថលដើម", downloadPdf: "ទាញយក PDF ដើម", mediaKit: "មើល Media Kit", contact: "ទាក់ទង Leonix" } }),
  hi: g({ eyebrow: "QR गाइड · अनुवाद", backToMagazine: "पत्रिका पर वापस", heroTitle: "पत्रिका का अनुवाद करें", truthLine: "दृश्य पत्रिका स्पेनिश में है। अपनी भाषा में पढ़ने के लिए फ़ोन के अनुवाद टूल का उपयोग करें।", trustNote: "Leonix PDF या flipbook का स्वचालित अनुवाद नहीं करता।", decisionPrompt: "आप पत्रिका कैसे पढ़ रहे हैं?", translationOptionsCta: "अनुवाद विकल्प देखें", websiteLangNote: "🌐 Languages चयनकर्ता Leonix साइट के लिए है — दृश्य पत्रिका का अनुवाद नहीं।", summaryTitle: "Leonix त्वरित सारांश", summaryNote: "यह सारांश मदद करता है, लेकिन मूल दृश्य पत्रिका स्पेनिश में रहती है।", actionsEyebrow: "Leonix कार्रवाइयाँ", actions: { openDigital: "मूल डिजिटल पत्रिका खोलें", downloadPdf: "मूल PDF डाउनलोड", mediaKit: "Media Kit देखें", contact: "Leonix से संपर्क" } }),
  hy: g({ eyebrow: "QR ուղեցույց · Թարգմանություն", backToMagazine: "Վերադառնալ ամսագրին", heroTitle: "Թարգманել ամսագիրը", truthLine: "Տեսողական ամսագիրը իսպաներեն է։ Օգտագործեք հեռախոսի թարգմանության գործիքները։", trustNote: "Leonix-ը ավտոմատ չի թարգմանում PDF-ը կամ flipbook-ը։", decisionPrompt: "Ինչպե՞ս եք կարդում ամսագիրը", translationOptionsCta: "Դիտել թարգմանության տարբերակները", websiteLangNote: "🌐 Languages ընտրիչը Leonix կայքի համար է — տեսողական ամսագիրը չի թարգմանվում։", summaryTitle: "Leonix արագ ամփոփում", summaryNote: "Այս ամփոփումը օգնում է, բայց բնօրինակ տեսողական ամսագիրը մնում է իսպաներեն։", actionsEyebrow: "Leonix գործողություններ", actions: { openDigital: "Բացել բնօրինակ թվային ամսագիրը", downloadPdf: "Ներբեռնել բնօրինակ PDF", mediaKit: "Դիտել Media Kit", contact: "Կապ Leonix-ի հետ" } }),
  ru: g({ eyebrow: "QR-гид · Перевод", backToMagazine: "Назад к журналу", heroTitle: "Перевести журнал", truthLine: "Визуальный журнал на испанском. Используйте инструменты перевода на телефоне.", trustNote: "Leonix не переводит PDF или flipbook автоматически.", decisionPrompt: "Как вы читаете журнал?", translationOptionsCta: "Смотреть варианты перевода", websiteLangNote: "Переключатель 🌐 Languages помогает сайту Leonix — не переводит визуальный журнал.", summaryTitle: "Краткое резюме Leonix", summaryNote: "Резюме помогает, но оригинальный визуальный журнал остаётся на испанском.", actionsEyebrow: "Действия Leonix", actions: { openDigital: "Открыть оригинальный цифровой журнал", downloadPdf: "Скачать оригинальный PDF", mediaKit: "Смотреть Media Kit", contact: "Связаться с Leonix" } }),
  pa: g({ eyebrow: "QR ਗਾਈਡ · ਅਨੁਵਾਦ", backToMagazine: "ਮੈਗਜ਼ੀਨ 'ਤੇ ਵਾਪਸ", heroTitle: "ਮੈਗਜ਼ੀਨ ਦਾ ਅਨੁਵਾਦ ਕਰੋ", truthLine: "ਦ੍ਰਿਸ਼ਟੀਗਤ ਮੈਗਜ਼ੀਨ ਸਪੈਨਿਸ਼ ਵਿੱਚ ਹੈ। ਆਪਣੀ ਭਾਸ਼ਾ ਵਿੱਚ ਪੜ੍ਹਨ ਲਈ ਫੋਨ ਦੇ ਅਨੁਵਾਦ ਟੂਲ ਵਰਤੋ।", trustNote: "Leonix PDF ਜਾਂ flipbook ਦਾ ਆਟੋ ਅਨੁਵਾਦ ਨਹੀਂ ਕਰਦਾ।", decisionPrompt: "ਤੁਸੀਂ ਮੈਗਜ਼ੀਨ ਕਿਵੇਂ ਪੜ੍ਹ ਰਹੇ ਹੋ?", translationOptionsCta: "ਅਨੁਵਾਦ ਵਿਕਲਪ ਦੇਖੋ", websiteLangNote: "🌐 Languages ਚੋਣਕਾਰ Leonix ਸਾਈਟ ਲਈ ਹੈ — ਦ੍ਰਿਸ਼ਟੀਗਤ ਮੈਗਜ਼ੀਨ ਦਾ ਅਨੁਵਾਦ ਨਹੀਂ।", summaryTitle: "Leonix ਤੇਜ਼ ਸਾਰ", summaryNote: "ਇਹ ਸਾਰ ਮਦਦ ਕਰਦਾ ਹੈ, ਪਰ ਮੂਲ ਦ੍ਰਿਸ਼ਟੀਗਤ ਮੈਗਜ਼ੀਨ ਸਪੈਨਿਸ਼ ਵਿੱਚ ਰਹਿੰਦੀ ਹੈ।", actionsEyebrow: "Leonix ਕਾਰਵਾਈਆਂ", actions: { openDigital: "ਮੂਲ ਡਿਜੀਟਲ ਮੈਗਜ਼ੀਨ ਖੋਲ੍ਹੋ", downloadPdf: "ਮੂਲ PDF ਡਾਊਨਲੋਡ", mediaKit: "Media Kit ਦੇਖੋ", contact: "Leonix ਨਾਲ ਸੰਪਰਕ" } }),
};
