import type { SupportedLang } from "@/app/lib/language";
import type { ComingSoonV2Copy } from "../types";
import { localizeComingSoonV2Copy } from "../assemble";

export function getZhCopy(lang: SupportedLang): ComingSoonV2Copy {
  return localizeComingSoonV2Copy(lang, {
    nav: [
      { label: "首页", href: "#inicio", active: true },
      { label: "您将获得", href: "#que-obtienes" },
      { label: "运作方式", href: "#como-funciona" },
      { label: "二维码访问", href: "#qr" },
      { label: "联系", href: "#contacto" },
    ],
    launchCta: "加入发布",
    brandName: "Leonix Media",
    langToggle: { es: "Español", en: "English" },
    mainAria: "Leonix Media — 首页",
    navAria: "主导航",
    langAria: "语言",
    hero: {
      badge: "即将推出",
      title: "Leonix Media",
      valueLines: [
        {
          parts: [
            { text: "西班牙语" },
            { text: "印刷广告", accent: "burgundy" },
            { text: "。" },
          ],
        },
        {
          parts: [
            { text: "双语" },
            { text: "数字曝光", accent: "burgundy" },
            { text: "。" },
          ],
        },
        {
          parts: [
            { text: "通过" },
            { text: "二维码", accent: "gold" },
            { text: "实现" },
            { text: "多语言", accent: "burgundy" },
            { text: "访问。" },
          ],
        },
      ],
      paragraph:
        "通过优质杂志、双语数字形象和将关注转化为行动的工具，将您的企业与湾区拉丁裔及多元文化社区连接起来。",
      ctas: [
        { label: "与我们投放广告", variant: "primary" },
        { label: "查看媒体资料包", variant: "secondary" },
        { label: "加入发布", variant: "green" },
      ],
      trustChips: ["为我们的社区打造", "本地信任", "数字行动"],
      valueAria: "价值主张",
      trustAria: "信任",
      mediaVisual: {
        label: "优质杂志 + 数字形象",
        qrOverlay: "扫描。选择语言。连接。",
        magazineAlt: "Leonix Media 杂志装饰预览",
      },
      magazineCta: "查看数字版",
    },
    marketplace: {
      eyebrow: "分类信息 + 本地市场",
      headline: "社区为所需而来。企业获得曝光。",
      intro:
        "Leonix 不仅是广告。我们还在建设本地市场，社区可以搜索、发布和分享真实机会：租房、工作、私人汽车、出售物品、活动、美食、宠物等。",
      bridge: "更多访问 Leonix 的理由，意味着企业有更多被看见的机会。",
      cardsAria: "本地市场类别",
      cards: [
        {
          title: "免费物品 / 出售",
          body: "出售物品、家居用品、工具、服装等。旨在吸引本地流量并在邻里间分享机会的发布信息。",
        },
        {
          title: "租房",
          body: "房间、公寓、空间及住房机会，附照片、描述、位置、价格和联系方式。",
        },
        {
          title: "工作",
          body: "正在招聘的企业可与社区中寻找工作和新机会的人建立联系。",
        },
        {
          title: "私人汽车",
          body: "汽车发布信息，附照片、描述、价格和联系方式，面向本地买家。",
        },
        {
          title: "美食 + 活动",
          body: "快闪、本地美食、活动、社区活动以及让人们再次回来的时刻。",
        },
        {
          title: "求购 + 宠物",
          body: "社区还可以搜索、分享需求、围绕宠物、失物、领养或本地支持建立联系。",
        },
      ],
      closing: "分类信息带来流量。Negocios Locales 将这种关注转化为电话、访问和客户。",
      exploreCta: { label: "浏览分类信息" },
    },
    whatYouGet: {
      eyebrow: "您将获得",
      headline: "不止于广告：为您的企业提供完整形象。",
      intro:
        "Leonix 结合印刷杂志、数字形象和二维码驱动的行动，帮助更多客户找到、了解并联系您的企业。",
      expandMore: "了解更多",
      expandLess: "收起",
      cards: [
        {
          title: "优质印刷杂志",
          body: "您的企业出现在为本地拉丁裔社区设计的出版物中。",
          detail:
            "您的广告出现在一份感觉本地、可信且专业的杂志中。目标不仅是好看，更是将您的企业呈现在希望支持本地企业的社区面前。",
          accent: "burgundy",
        },
        {
          title: "双语数字形象",
          body: "您的广告还可以存在于清晰、专业且易于分享的数字体验中。",
          detail:
            "数字形象帮助广告超越单页。客户可以通过手机找到、分享并再次查看您的信息。",
          accent: "gold",
        },
        {
          title: "二维码 + 真实行动",
          body: "将关注转化为电话、消息、地图、链接、优惠和更多信息。",
          detail:
            "二维码帮助人们从杂志转向具体行动：打电话、打开地图、发消息、访问网站、查看社交媒体或索取更多信息。",
          accent: "qr",
        },
        {
          title: "Negocios Locales",
          body: "有序展示电话、位置、社交账号、照片、评价和重要链接。",
          detail:
            "Negocios Locales 将您的信息集中在一处，客户无需在多个平台间搜索。电话、地址、地图、社交、照片和链接可以集中呈现。",
          accent: "green",
        },
        {
          title: "创始发布机会",
          body: "成为发布阶段首批与 Leonix Media 一起亮相的企业之一。",
          detail:
            "在发布阶段，首批企业帮助建立 Leonix Media 的初始网络。这为社区开始了解平台时创造了早期曝光机会。",
          accent: "founder",
        },
      ],
    },
    howItWorks: {
      eyebrow: "运作方式",
      headline: "与 Leonix 一起发布形象的清晰流程。",
      intro: "我们从最初信息引导您，直至准备好印刷、分享和连接的形象。",
      stepsAria: "流程步骤",
      steps: [
        {
          title: "选择您的路径",
          body: "选择您想要的形象类型：印刷广告、数字形象、二维码、媒体资料包或发布套餐。",
        },
        {
          title: "发送您的信息",
          body: "分享徽标、照片、电话、地址、社交账号、链接、优惠及企业主要详情。",
        },
        {
          title: "我们准备您的形象",
          body: "我们整理您的广告、数字信息以及帮助客户了解和联系您企业的要素。",
        },
        {
          title: "发布并连接",
          body: "您的企业已准备好面向社区亮相，并将兴趣转化为电话、消息、访问和联系。",
        },
      ],
    },
    qrAccess: {
      eyebrow: "二维码访问",
      headline: "从印刷广告到客户手机。",
      intro: "二维码将印刷杂志与 Leonix 的数字体验连接起来——您的多语言桥梁。",
      callout: "扫描。选择语言。连接。",
      explanation:
        "从印刷或数字材料扫描二维码。在 Leonix 上选择语言，阅读摘要和本地企业信息，并采取快速行动。网站是多语言桥梁；视觉杂志保持原版。",
      mobileNote:
        "在手机上，请勿尝试扫描自己的手机屏幕。使用 Leonix 语言选择器和您所选语言的摘要。Google Lens 或 Apple 翻译仅适用于印刷材料。",
      openReaderLabel: "查看相机翻译步骤",
      benefitsAria: "二维码访问优势",
      benefits: [
        {
          title: "在 Leonix 选择语言",
          body: "以您在网站上选择的语言提供摘要、企业信息和快速行动。",
        },
        {
          title: "更多行动方式",
          body: "通过手机，他们可以打电话、打开地图、发消息、访问链接、查看社交媒体或索取更多信息。",
        },
        {
          title: "印刷材料可选",
          body: "对于印刷材料，Google Lens 或 Apple 翻译可帮助阅读文字。Leonix 仍是数字内容的主要入口。",
        },
      ],
    },
    mediaKitPreview: {
      eyebrow: "媒体资料包",
      headline: "媒体资料包中的内容",
      intro:
        "媒体资料包完整说明 Leonix Media 如何结合印刷杂志、数字形象、二维码、真实行动和广告套餐，帮助您的企业看起来更强大且更易于联系。",
      pdfHonestyLine:
        "可下载的 PDF 可能是西班牙语原版，我们正在准备翻译版本。网站会以您所选语言说明选项。",
      cardsAria: "媒体资料包内容",
      cards: [
        {
          title: "为何选择 Leonix 投放广告",
          body: "了解 Leonix 如何为希望与拉丁裔及多元文化社区建立联系的本地企业创造覆盖、信任和行动。",
        },
        {
          title: "二维码 + 行动按钮",
          body: "了解印刷广告如何帮助客户打电话、打开地图、发消息、访问网站、查看社交媒体、评价等。",
        },
        {
          title: "Negocios Locales + 数字形象",
          body: "了解您的企业如何拥有包含电话、地址、地图、照片、评价、社交媒体、网站和联系按钮的有序形象。",
        },
        {
          title: "套餐与后续步骤",
          body: "查看广告选项、曝光级别以及开始使用 Leonix Media 的流程。",
        },
      ],
      ctaHeading: "准备好查看详情了吗？",
      viewCta: { label: "查看媒体资料包" },
      downloadCta: { label: "下载媒体资料包" },
      requestInfoCta: { label: "索取广告信息" },
      supportingLine: "打开媒体资料包查看格式、优势、套餐和后续步骤。",
    },
    digitalMagazine: {
      eyebrow: "数字杂志",
      headline: "打开原版视觉杂志——并提供您所选语言的支持",
      intro:
        "您可以打开原版数字杂志并按设计查看页面。Leonix 还提供您所选语言的摘要、亮点和快速行动。",
      visualNote: "视觉杂志页面（PDF/FlipHTML5）是原版——并非全部图文的自动翻译。",
      highlightsNote: "网站上提供您所选语言的摘要和 CTA，用于引导您，而非声称视觉杂志已完全翻译。",
      mobileNote: "在手机上，请在 Leonix 选择语言并使用摘要。请勿扫描自己的屏幕进行翻译。",
      readHighlightsCta: { label: "以您的语言阅读亮点" },
      openOriginalCta: { label: "打开原版数字杂志" },
      learnQrCta: { label: "了解二维码访问方式" },
    },
    finalCta: {
      eyebrow: "准备发布",
      headline: "在发布前预留您的位置。",
      body: "Leonix Media 正在准备发布，以将本地企业与湾区拉丁裔及多元文化社区连接起来。若您希望从一开始就亮相，现在是举手的时候。",
      ctas: [
        { label: "与我们投放广告", variant: "primary" },
        { label: "查看媒体资料包", variant: "secondary", external: true },
        { label: "加入发布", variant: "green" },
      ],
      mediaKitDownload: { label: "下载媒体资料包" },
    },
    contact: {
      title: "联系",
      body: "对广告、媒体资料包或发布阶段有疑问？联系我们，我们将帮助您为企业选择最佳路径。",
      emailLabel: "电子邮件",
      email: "info@leonixmedia.com",
      phoneLabel: "电话",
      phone: "(408) 303-6500",
      phoneHref: "tel:+14083036500",
      addressLabel: "地址",
      address: "871 Coleman Avenue, Suite 202, San Jose, CA 95110",
      areaLabel: "区域",
      area: "San José • Silicon Valley • 拉丁裔社区",
    },
    newsletter: {
      title: "加入发布",
      body: "接收 Leonix Media 的新闻、机会和更新。",
      placeholder: "您的电子邮件",
      button: "通知我",
      formAria: "通讯订阅",
      emailLabel: "电子邮件",
    },
    footer: "© 2026 Leonix Media。为我们的社区打造。",
  });
}
