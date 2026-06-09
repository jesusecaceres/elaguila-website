import type { SupportedLang } from "@/app/lib/language";
import type { ComingSoonV2Copy } from "../types";
import { localizeComingSoonV2Copy } from "../assemble";

export function getKoCopy(lang: SupportedLang): ComingSoonV2Copy {
  return localizeComingSoonV2Copy(lang, {
    nav: [
      { label: "홈", href: "#inicio", active: true },
      { label: "제공 혜택", href: "#que-obtienes" },
      { label: "작동 방식", href: "#como-funciona" },
      { label: "QR 접근", href: "#qr" },
      { label: "문의", href: "#contacto" },
    ],
    launchCta: "출시에 참여",
    brandName: "Leonix Media",
    langToggle: { es: "Español", en: "English" },
    mainAria: "Leonix Media — 홈",
    navAria: "주요 내비게이션",
    langAria: "언어",
    hero: {
      badge: "곧 출시",
      title: "Leonix Media",
      valueLines: [
        {
          parts: [
            { text: "스페인어 " },
            { text: "인쇄 광고", accent: "burgundy" },
            { text: "." },
          ],
        },
        {
          parts: [
            { text: "이중언어 " },
            { text: "디지털 노출", accent: "burgundy" },
            { text: "." },
          ],
        },
        {
          parts: [
            { text: "QR을 통한 " },
            { text: "다국어", accent: "burgundy" },
            { text: " 접근." },
          ],
        },
      ],
      paragraph:
        "프리미엄 매거진, 이중언어 디지털 프레즌스, 관심을 행동으로 바꾸는 도구를 통해 베이에어리어의 라티노 및 다문화 커뮤니티와 비즈니스를 연결합니다.",
      ctas: [
        { label: "광고 문의", variant: "primary" },
        { label: "미디어 키트 보기", variant: "secondary" },
        { label: "출시에 참여", variant: "green" },
      ],
      trustChips: ["우리 커뮤니티를 위해", "지역 신뢰", "디지털 액션"],
      valueAria: "가치 제안",
      trustAria: "신뢰",
      mediaVisual: {
        label: "프리미엄 매거진 + 디지털 프레즌스",
        qrOverlay: "스캔. 언어 선택. 연결.",
        magazineAlt: "Leonix Media 매거진 장식 미리보기",
      },
      magazineCta: "디지털 판 보기",
    },
    marketplace: {
      eyebrow: "분류광고 + 로컬 마켓플레이스",
      headline: "커뮤니티는 필요한 것을 위해 옵니다. 비즈니스는 노출을 얻습니다.",
      intro:
        "Leonix는 광고만이 아닙니다. 임대, 일자리, 개인 자동차, 판매 물품, 이벤트, 음식, 반려동물 등 커뮤니티가 검색·게시·공유할 수 있는 로컬 마켓플레이스도 구축하고 있습니다.",
      bridge: "Leonix를 방문할 이유가 많을수록 비즈니스가 보일 기회도 많아집니다.",
      cardsAria: "로컬 마켓플레이스 카테고리",
      cards: [
        {
          title: "무료 물품 / 판매",
          body: "판매 물품, 가정용품, 도구, 의류 등. 지역 트래픽을 유도하고 이웃 간 기회를 공유하는 게시물.",
        },
        {
          title: "임대",
          body: "방, 아파트, 공간 및 주거 기회. 사진, 설명, 위치, 가격, 연락처 포함.",
        },
        {
          title: "일자리",
          body: "채용 중인 비즈니스는 일자리와 새로운 기회를 찾는 커뮤니티 구성원과 연결할 수 있습니다.",
        },
        {
          title: "개인 자동차",
          body: "사진, 설명, 가격, 연락처가 있는 자동차 게시물. 지역 구매자용.",
        },
        {
          title: "음식 + 이벤트",
          body: "팝업, 지역 음식, 활동, 커뮤니티 이벤트, 사람들이 다시 찾아오게 하는 순간.",
        },
        {
          title: "구함 + 반려동물",
          body: "커뮤니티는 검색, 필요 사항 공유, 반려동물, 분실물, 입양, 지역 지원에 대해서도 연결할 수 있습니다.",
        },
      ],
      closing:
        "분류광고가 트래픽을 가져옵니다. Negocios Locales 가 그 관심을 전화, 방문, 고객으로 바꿉니다.",
      exploreCta: { label: "분류광고 둘러보기" },
    },
    whatYouGet: {
      eyebrow: "제공 혜택",
      headline: "광고 그 이상: 비즈니스를 위한 완전한 프레즌스.",
      intro:
        "Leonix는 월간 인쇄 매거진, Negocios Locales Local Business Hub, QR 기반 액션을 결합해 더 많은 고객이 비즈니스를 찾고 이해하고 연락하도록 돕습니다.",
      expandMore: "더 알아보기",
      expandLess: "접기",
      cards: [
        {
          title: "월간 인쇄 매거진",
          body: "비즈니스는 지역 라티노 커뮤니티를 위해 설계된 월간 매거진에 등장할 수 있습니다.",
          detail:
            "Leonix는 신뢰할 수 있는 지역 노출을 위해 월간 스페인어 인쇄 매거진을 발행합니다. 인쇄 게재는 광고 패키지에 따라 다릅니다 — 계약 없이 모든 비즈니스가 매 호에 등장하는 것은 아닙니다.",
          accent: "burgundy",
        },
        {
          title: "이중언어 디지털 프레즌스",
          body: "비즈니스는 고객이 선택한 언어의 네이티브 폼과 액션이 있는 Leonix 웹 페이지에도 등장할 수 있습니다.",
          detail:
            "디지털 페이지는 인쇄 광고와 Local Business Hub 프로필을 보완하며, 고객이 휴대폰에서 다시 방문할 수 있는 공유 가능한 정보를 제공합니다.",
          accent: "gold",
        },
        {
          title: "QR + 실제 액션",
          body: "인쇄 관심을 전화, 메시지, 지도, 웹사이트 방문, SNS, 혜택, 연락 경로로 전환합니다.",
          detail:
            "QR은 각 월간 호를 디지털 액션에 연결합니다. 독자는 스캔하고, 휴대폰 번역 도구나 Leonix 언어 페이지를 사용해 플랫폼을 오가지 않고 비즈니스에 도달할 수 있습니다.",
          accent: "qr",
        },
        {
          title: "Negocios Locales + 디지털 프레즌스",
          body: "고객이 SNS, 웹사이트, 전화, 위치, 사진, 리뷰, 혜택, 연락 방법을 한곳에서 찾을 수 있는 중앙 비즈니스 페이지를 만듭니다.",
          detail:
            "Negocios Locales는 광고 그 이상 — 온라인 프레즌스를 모아 고객이 별도 플랫폼을 검색하지 않고 비즈니스를 발견하고 탐색할 수 있게 합니다.",
          accent: "green",
        },
        {
          title: "창립 출시 기회",
          body: "출시 단계에서 Leonix Media 와 함께 처음 등장하는 비즈니스 중 하나가 되세요.",
          detail:
            "출시 시 초기 비즈니스가 Leonix Media 의 초기 네트워크를 구축합니다. 이는 조기 노출 기회이며 — 별도의 광고 형식이 아닙니다.",
          accent: "founder",
        },
      ],
    },
    howItWorks: {
      eyebrow: "작동 방식",
      headline: "Leonix 와 함께 프레즌스를 출시하는 명확한 프로세스.",
      intro: "초기 정보부터 인쇄·공유·연결 준비가 된 프레즌스까지 안내합니다.",
      stepsAria: "프로세스 단계",
      steps: [
        {
          title: "프레즌스 선택",
          body: "월간 인쇄 노출, Negocios Locales 디지털 Local Business Hub 페이지, QR 기반 고객 액션, 또는 출시 조합 중 선택하세요.",
        },
        {
          title: "정보 전송",
          body: "로고, 사진, 전화, 주소, SNS, 링크, 혜택, 비즈니스 주요 세부 정보를 공유하세요.",
        },
        {
          title: "프레즌스 준비",
          body: "광고, 디지털 정보, 고객이 이해하고 연락하는 데 도움이 되는 요소를 정리합니다.",
        },
        {
          title: "출시 및 연결",
          body: "비즈니스가 커뮤니티 앞에 나설 준비가 되었고 관심을 전화, 메시지, 방문, 연결로 바꿉니다.",
        },
      ],
    },
    qrAccess: {
      eyebrow: "QR 접근",
      headline: "인쇄 광고에서 고객의 휴대폰으로.",
      intro:
        "각 월간 호는 실물 매거진을 디지털 액션에 연결할 수 있습니다: 스캔, 번역, 지도 열기, 전화, SNS 방문, 혜택 보기, 비즈니스 연락.",
      callout: "스캔. 번역. 읽기. 연결.",
      explanation:
        "인쇄 매거진이 배포되면 독자는 광고의 QR 코드를 스캔할 수 있습니다. 시각적 매거진을 읽으려면 인쇄 페이지, 데스크톱 화면, 스크린샷에서 휴대폰 카메라, Google Lens, Google Translate, Apple Live Text를 사용할 수 있습니다. Leonix 웹사이트를 탐색하려면 Leonix 번역 페이지 또는 Google Translate 웹사이트 모드를 대체 수단으로 사용할 수 있습니다. 네이티브 Leonix 연락 및 광고 양식이 공식 리드 경로입니다.",
      mobileNote:
        "모바일에서는 자신의 화면을 스캔하지 마세요. 먼저 Leonix 언어 페이지와 요약을 사용하세요. Google Lens와 Apple Live Text는 인쇄물 또는 스크린샷용 선택 사항입니다.",
      openReaderLabel: "QR 번역 단계 보기",
      heroStripSummary:
        "각 월간 인쇄 호는 독자를 전화, 지도, 링크, SNS, 네이티브 Leonix 연락 경로에 연결할 수 있습니다.",
      detailNote: "자세한 QR 번역 가이드",
      benefitsAria: "QR 접근 혜택",
      benefits: [
        {
          title: "인쇄에서 휴대폰으로",
          body: "QR은 매거진 관심을 전화, 지도, 웹사이트 방문, SNS, 혜택, 네이티브 연락 양식으로 전환합니다.",
        },
        {
          title: "카메라 및 웹 번역",
          body: "Google Lens, Google Translate, Apple Live Text가 시각 페이지 읽기를 돕습니다. Google Translate 웹사이트 모드가 Leonix 탐색을 돕습니다 — 네이티브 양식이 공식입니다.",
        },
        {
          title: "스페인어 원본 시각 매거진",
          body: "PDF/FlipHTML5 시각 판은 스페인어로 유지됩니다. Leonix는 완전히 번역된 시각 매거진을 주장하지 않습니다.",
        },
      ],
    },
    mediaKitPreview: {
      eyebrow: "미디어 키트",
      headline: "미디어 키트에서 찾을 수 있는 것",
      intro:
        "미디어 키트는 Leonix Media 가 인쇄 매거진, 디지털 프레즌스, QR, 실제 액션, 광고 패키지를 어떻게 결합해 비즈니스를 더 강하게 보이고 연락하기 쉽게 하는지 설명합니다.",
      pdfHonestyLine:
        "다운로드 가능한 PDF는 번역본을 준비하는 동안 스페인어 원본 판일 수 있습니다. 사이트는 선택한 언어로 옵션을 설명합니다.",
      cardsAria: "미디어 키트 내용",
      cards: [
        {
          title: "Leonix 에 광고하는 이유",
          body: "라티노 및 다문화 커뮤니티와 연결하려는 지역 비즈니스의 도달, 신뢰, 액션을 Leonix 가 어떻게 돕는지 확인하세요.",
        },
        {
          title: "QR + 액션 버튼",
          body: "인쇄 광고가 고객의 전화, 지도, 메시지, 웹사이트, SNS, 리뷰 등으로 이어지는 방법을 확인하세요.",
        },
        {
          title: "Negocios Locales + 디지털 프레즌스",
          body: "전화, 주소, 지도, 사진, 리뷰, SNS, 웹사이트, 연락 버튼이 있는 정리된 프레즌스를 이해하세요.",
        },
        {
          title: "패키지 및 다음 단계",
          body: "광고 옵션, 노출 수준, Leonix Media 시작 프로세스를 검토하세요.",
        },
      ],
      ctaHeading: "세부 정보를 볼 준비가 되셨나요?",
      viewCta: { label: "미디어 키트 보기" },
      downloadCta: { label: "미디어 키트 다운로드" },
      dualPdfEsLabel: "Media Kit (스페인어 원본 PDF)",
      dualPdfEnLabel: "Media Kit (영어 PDF)",
      requestInfoCta: { label: "광고 정보 요청" },
      supportingLine: "미디어 키트를 열어 형식, 혜택, 패키지, 다음 단계를 확인하세요.",
    },
    digitalMagazine: {
      eyebrow: "디지털 매거진",
      headline: "원본 시각 판 + 다국어 지원",
      intro:
        "스페인어 원본 시각 매거진을 열고 설계된 대로 페이지를 볼 수 있습니다. Leonix는 선택한 언어로 요약, 하이라이트, 빠른 액션도 제공합니다(가능한 경우).",
      visualNote:
        "시각적 매거진 페이지(PDF/FlipHTML5)는 스페인어 원본 판 — 모든 아트워크의 자동 번역이 아닙니다.",
      highlightsNote:
        "Leonix 페이지에서 선택 언어의 맥락과 CTA를 이용하세요. Google Lens나 스크린샷이 시각 페이지 읽기를 돕습니다. 향후 HTML 동반 콘텐츠가 원본 시각 판을 대체하지 않고 언어 도달을 개선합니다.",
      mobileNote:
        "모바일에서는 Leonix 에서 언어를 선택하고 요약을 사용하세요. 휴대폰 카메라 도구가 인쇄물 또는 화면 페이지를 돕습니다 — 번역을 위해 자신의 화면을 스캔하지 마세요.",
      readHighlightsCta: { label: "선택한 언어로 하이라이트 읽기" },
      openOriginalCta: { label: "원본 디지털 매거진 열기" },
      learnQrCta: { label: "QR 접근 작동 방식 알아보기" },
    },
    finalCta: {
      eyebrow: "출시 준비 완료",
      headline: "출시 전에 자리를 예약하세요.",
      body: "Leonix Media 는 지역 비즈니스와 베이에어리어 라티노·다문화 커뮤니티를 연결하는 출시를 준비하고 있습니다. 처음부터 등장하고 싶다면 지금이 그 순간입니다.",
      ctas: [
        { label: "광고 문의", variant: "primary" },
        { label: "미디어 키트 보기", variant: "secondary", external: true },
        { label: "출시에 참여", variant: "green" },
      ],
      mediaKitDownload: { label: "미디어 키트 다운로드" },
    },
    contact: {
      title: "문의",
      body: "광고, 미디어 키트, 출시 단계에 대한 질문이 있으신가요? 문의해 주시면 비즈니스에 가장 좋은 경로를 선택하도록 도와드리겠습니다.",
      emailLabel: "이메일",
      email: "info@leonixmedia.com",
      phoneLabel: "전화",
      phone: "(408) 303-6500",
      phoneHref: "tel:+14083036500",
      addressLabel: "주소",
      address: "871 Coleman Avenue, Suite 202, San Jose, CA 95110",
      areaLabel: "지역",
      area: "San José • Silicon Valley • 라티노 커뮤니티",
    },
    newsletter: {
      title: "출시에 참여",
      body: "Leonix Media 의 뉴스, 기회, 업데이트를 받으세요.",
      placeholder: "이메일 주소",
      button: "알림 받기",
      formAria: "뉴스레터 가입",
      emailLabel: "이메일",
      consent: "Leonix Media 출시 업데이트 수신에 동의합니다.",
      consentError: "업데이트 수신 동의를 확인해 주세요.",
    },
    footer: "© 2026 Leonix Media. 우리 커뮤니티를 위해.",
  });
}
