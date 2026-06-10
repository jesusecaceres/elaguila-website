import type { SupportedLang } from "@/app/lib/language";
import type { ComingSoonV2Copy } from "../types";
import { localizeComingSoonV2Copy } from "../assemble";

export function getViCopy(lang: SupportedLang): ComingSoonV2Copy {
  return localizeComingSoonV2Copy(lang, {
    nav: [
      { label: "Trang chủ", href: "#inicio", active: true },
      { label: "Bạn nhận được gì", href: "#que-obtienes" },
      { label: "Cách hoạt động", href: "#como-funciona" },
      { label: "Truy cập QR", href: "#qr" },
      { label: "Liên hệ", href: "#contacto" },
    ],
    launchCta: "Tham gia ra mắt",
    brandName: "Leonix Media",
    langToggle: { es: "Español", en: "English" },
    mainAria: "Leonix Media — Trang chủ",
    navAria: "Điều hướng chính",
    langAria: "Ngôn ngữ",
    hero: {
      badge: "SẮP RA MẮT",
      title: "Leonix Media",
      valueLines: [
        {
          parts: [
            { text: "Quảng cáo in bằng " },
            { text: "tiếng Tây Ban Nha", accent: "burgundy" },
            { text: "." },
          ],
        },
        {
          parts: [
            { text: "Hiện diện kỹ thuật số " },
            { text: "song ngữ", accent: "burgundy" },
            { text: "." },
          ],
        },
        {
          parts: [
            { text: "Truy cập " },
            { text: "đa ngôn ngữ", accent: "burgundy" },
            { text: " qua " },
            { text: "QR", accent: "gold" },
            { text: "." },
          ],
        },
      ],
      paragraph:
        "Kết nối doanh nghiệp của bạn với cộng đồng Latinh và đa văn hóa tại Bay Area thông qua tạp chí cao cấp, hiện diện kỹ thuật số song ngữ và công cụ biến sự chú ý thành hành động.",
      ctas: [
        { label: "Quảng cáo cùng chúng tôi", variant: "primary" },
        { label: "Xem Media Kit", variant: "secondary" },
        { label: "Tham gia ra mắt", variant: "green" },
      ],
      trustChips: ["Dành cho cộng đồng chúng ta", "Tin cậy địa phương", "Hành động kỹ thuật số"],
      valueAria: "Giá trị cốt lõi",
      trustAria: "Niềm tin",
      mediaVisual: {
        label: "Tạp chí cao cấp + hiện diện kỹ thuật số",
        qrOverlay: "Quét. Chọn ngôn ngữ. Kết nối.",
        magazineAlt: "Xem trước tạp chí Leonix Media",
      },
      magazineCta: "Xem ấn bản kỹ thuật số",
    },
    marketplace: {
      eyebrow: "RAO VẶT + MARKETPLACE ĐỊA PHƯƠNG",
      headline: "Cộng đồng đến vì điều họ cần. Doanh nghiệp được nhìn thấy.",
      intro:
        "Leonix không chỉ là quảng cáo. Chúng tôi cũng đang xây dựng một marketplace địa phương nơi cộng đồng có thể tìm kiếm, đăng tin và chia sẻ cơ hội thực: thuê nhà, việc làm, ô tô cá nhân, đồ bán, sự kiện, ẩm thực, thú cưng và hơn thế nữa.",
      bridge:
        "Càng nhiều lý do ghé Leonix, càng nhiều cơ hội để doanh nghiệp được nhìn thấy.",
      featuredCard: {
        badge: "New category",
        title: "Local Deals",
        body:
          "Weekly flyers, coupons, and specials from local businesses in a clear experience designed to help the community discover real savings and help businesses gain more visibility.",
        supportingLine:
          "More reasons to visit Leonix means more opportunities for local businesses to be seen.",
      },
      cardsAria: "Danh mục marketplace địa phương",
      cards: [
        {
          title: "Đồ dùng & đồ miễn phí",
          body: "Đồ dùng địa phương, đồ gia dụng, dụng cụ, quần áo, đồ miễn phí và tin đăng hàng ngày giúp hàng xóm mua, bán, chia sẻ và khám phá cơ hội hữu ích.",
        },
        {
          title: "Thuê nhà",
          body: "Phòng, căn hộ, không gian và cơ hội nhà ở với ảnh, mô tả, vị trí, giá và liên hệ.",
        },
        {
          title: "Việc làm",
          body: "Doanh nghiệp đang tuyển dụng có thể kết nối với người trong cộng đồng đang tìm việc và cơ hội mới.",
        },
        {
          title: "Ô tô cá nhân",
          body: "Tin ô tô với ảnh, mô tả, giá và liên hệ cho người mua địa phương.",
        },
        {
          title: "Ẩm thực + sự kiện",
          body: "Pop-up, món địa phương, hoạt động, sự kiện cộng đồng và khoảnh khắc khiến mọi người quay lại.",
        },
        {
          title: "Tìm kiếm + thú cưng",
          body: "Cộng đồng cũng có thể tìm kiếm, chia sẻ nhu cầu, kết nối về thú cưng, đồ thất lạc, nhận nuôi hoặc hỗ trợ địa phương.",
        },
      ],
      closing:
        "Rao vặt mang lại lưu lượng. Negocios Locales biến sự chú ý đó thành cuộc gọi, lượt ghé và khách hàng.",
      exploreCta: { label: "Khám phá Rao vặt" },
    },
    whatYouGet: {
      eyebrow: "BẠN NHẬN ĐƯỢC GÌ",
      headline: "Hơn một quảng cáo: sự hiện diện đầy đủ cho doanh nghiệp.",
      intro:
        "Leonix kết hợp tạp chí in hàng tháng, trung tâm Negocios Locales và hành động qua QR để giúp nhiều khách hàng tìm thấy, hiểu và liên hệ doanh nghiệp của bạn.",
      expandMore: "Xem thêm",
      expandLess: "Thu gọn",
      cards: [
        {
          title: "Tạp chí in hàng tháng",
          body: "Doanh nghiệp của bạn có thể xuất hiện trên tạp chí hàng tháng được thiết kế để kết nối với cộng đồng Latinh địa phương.",
          detail:
            "Leonix xuất bản tạp chí in tiếng Tây Ban Nha hàng tháng để có sự hiện diện địa phương đáng tin. Vị trí in phụ thuộc vào gói quảng cáo — không phải doanh nghiệp nào cũng xuất hiện trong mỗi số nếu không có hợp đồng.",
          accent: "burgundy",
        },
        {
          title: "Hiện diện kỹ thuật số song ngữ",
          body: "Doanh nghiệp cũng có thể xuất hiện trên trang Leonix với biểu mẫu và hành động gốc bằng ngôn ngữ khách hàng chọn.",
          detail:
            "Trang kỹ thuật số bổ sung quảng cáo in và hồ sơ Negocios Locales với thông tin có thể chia sẻ mà khách hàng có thể quay lại từ điện thoại.",
          accent: "gold",
        },
        {
          title: "QR + hành động thực",
          body: "Biến sự chú ý từ in thành cuộc gọi, tin nhắn, bản đồ, truy cập website, mạng xã hội, ưu đãi và đường liên hệ.",
          detail:
            "QR kết nối mỗi số hàng tháng với hành động kỹ thuật số. Người đọc có thể quét, dùng công cụ dịch trên điện thoại hoặc trang Leonix bằng ngôn ngữ của họ, và đến doanh nghiệp mà không phải nhảy qua từng nền tảng.",
          accent: "qr",
        },
        {
          title: "Negocios Locales + hiện diện kỹ thuật số",
          body: "Chúng tôi tạo một trang trung tâm cho doanh nghiệp nơi khách hàng có thể tìm mạng xã hội, website, điện thoại, vị trí, ảnh, đánh giá, ưu đãi và cách liên hệ ở một nơi.",
          detail:
            "Negocios Locales không chỉ là quảng cáo — gom sự hiện diện trực tuyến để khách khám phá doanh nghiệp mà không phải tìm trên nhiều nền tảng riêng.",
          accent: "green",
        },
        {
          title: "Cơ hội ra mắt sớm",
          body: "Hãy là một trong những doanh nghiệp đầu tiên xuất hiện cùng Leonix Media trong giai đoạn ra mắt.",
          detail:
            "Trong giai đoạn ra mắt, các doanh nghiệp đầu tiên giúp xây mạng lưới Leonix Media ban đầu. Đây là cơ hội hiển thị sớm — không phải định dạng quảng cáo riêng.",
          accent: "founder",
        },
      ],
    },
    howItWorks: {
      eyebrow: "CÁCH HOẠT ĐỘNG",
      headline: "Quy trình rõ ràng để ra mắt sự hiện diện với Leonix.",
      intro:
        "Chúng tôi đồng hành từ thông tin ban đầu đến sự hiện diện sẵn sàng in, chia sẻ và kết nối.",
      stepsAria: "Các bước quy trình",
      steps: [
        {
          title: "Chọn sự hiện diện",
          body: "Chọn xem bạn muốn xuất hiện trên tạp chí in hàng tháng, tạo hiện diện kỹ thuật số trên Negocios Locales, kích hoạt hành động qua QR hay kết hợp các tùy chọn ra mắt.",
        },
        {
          title: "Gửi thông tin",
          body: "Chia sẻ logo, ảnh, điện thoại, địa chỉ, mạng xã hội, liên kết, ưu đãi và chi tiết chính về doanh nghiệp.",
        },
        {
          title: "Chúng tôi chuẩn bị",
          body: "Sắp xếp quảng cáo, thông tin kỹ thuật số và các yếu tố giúp khách hiểu và liên hệ doanh nghiệp.",
        },
        {
          title: "Ra mắt và kết nối",
          body: "Doanh nghiệp sẵn sàng xuất hiện trước cộng đồng và biến sự quan tâm thành cuộc gọi, tin nhắn, lượt ghé và kết nối.",
        },
      ],
    },
    qrAccess: {
      eyebrow: "TRUY CẬP QR",
      headline: "Từ quảng cáo in đến điện thoại của khách.",
      intro:
        "Mỗi số hàng tháng có thể kết nối tạp chí vật lý với hành động kỹ thuật số: quét, dịch, mở bản đồ, gọi, xem mạng xã hội, ưu đãi và liên hệ doanh nghiệp.",
      callout: "Quét. Dịch. Đọc. Kết nối.",
      explanation:
        "Khi tạp chí in được phân phối, người đọc có thể quét mã QR trên quảng cáo. Để đọc tạp chí hình ảnh, họ có thể dùng camera điện thoại, Google Lens, Google Translate hoặc Apple Live Text trên trang in, màn hình máy tính hoặc ảnh chụp. Để duyệt website Leonix, họ có thể dùng trang Leonix đã dịch hoặc chế độ website Google Translate làm hỗ trợ. Biểu mẫu liên hệ và quảng cáo gốc của Leonix vẫn là đường liên hệ chính thức.",
      mobileNote:
        "Trên điện thoại, đừng quét màn hình của chính bạn. Dùng trang và tóm tắt Leonix bằng ngôn ngữ của bạn trước. Google Lens và Apple Live Text là tùy chọn cho in hoặc ảnh chụp.",
      openReaderLabel: "Xem hướng dẫn dịch QR",
      heroStripSummary:
        "Mỗi số in hàng tháng có thể kết nối người đọc với cuộc gọi, bản đồ, liên kết, mạng xã hội và biểu mẫu liên hệ gốc Leonix.",
      detailNote: "Hướng dẫn dịch QR chi tiết",
      benefitsAria: "Lợi ích truy cập QR",
      benefits: [
        {
          title: "Từ in đến điện thoại",
          body: "QR biến sự chú ý từ tạp chí thành cuộc gọi, bản đồ, truy cập website, mạng xã hội, ưu đãi và biểu mẫu liên hệ gốc.",
        },
        {
          title: "Camera và dịch web",
          body: "Google Lens, Google Translate và Apple Live Text giúp đọc trang hình ảnh. Chế độ website Google Translate giúp duyệt Leonix — biểu mẫu gốc vẫn chính thức.",
        },
        {
          title: "Tạp chí hình ảnh gốc bằng tiếng Tây Ban Nha",
          body: "Phiên bản hình ảnh PDF/FlipHTML5 vẫn bằng tiếng Tây Ban Nha. Leonix không hứa tạp chí hình ảnh được dịch đầy đủ.",
        },
      ],
    },
    mediaKitPreview: {
      eyebrow: "MEDIA KIT",
      headline: "Bạn sẽ thấy gì trong Media Kit",
      intro:
        "Media Kit gom giải thích đầy đủ về cách Leonix Media kết hợp tạp chí in, hiện diện kỹ thuật số, QR, hành động thực và gói quảng cáo để doanh nghiệp trông mạnh hơn và dễ liên hệ hơn.",
      pdfHonestyLine:
        "PDF tải xuống có thể là ấn bản gốc tiếng Tây Ban Nha trong khi chúng tôi chuẩn bị bản dịch. Trang web giải thích các lựa chọn bằng ngôn ngữ bạn chọn.",
      cardsAria: "Nội dung Media Kit",
      cards: [
        {
          title: "Vì sao quảng cáo với Leonix",
          body: "Xem Leonix giúp tạo phạm vi, niềm tin và hành động cho doanh nghiệp địa phương muốn kết nối cộng đồng Latinh và đa văn hóa.",
        },
        {
          title: "QR + nút hành động",
          body: "Xem quảng cáo in có thể dẫn khách gọi, mở bản đồ, nhắn tin, vào website, xem mạng xã hội, đánh giá và hơn thế.",
        },
        {
          title: "Negocios Locales + kỹ thuật số",
          body: "Hiểu cách doanh nghiệp có thể có sự hiện diện gọn với điện thoại, địa chỉ, bản đồ, ảnh, đánh giá, mạng xã hội, website và nút liên hệ.",
        },
        {
          title: "Gói và bước tiếp theo",
          body: "Xem lựa chọn quảng cáo, mức hiển thị và quy trình bắt đầu với Leonix Media.",
        },
      ],
      ctaHeading: "Sẵn sàng xem chi tiết?",
      viewCta: { label: "Xem Media Kit" },
      downloadCta: { label: "Tải Media Kit" },
      dualPdfEsLabel: "Media Kit (PDF tiếng Tây Ban Nha gốc)",
      dualPdfEnLabel: "Media Kit (PDF tiếng Anh)",
      requestInfoCta: { label: "Yêu cầu thông tin quảng cáo" },
      supportingLine:
        "Mở Media Kit để xem định dạng, lợi ích, gói và các bước tiếp theo.",
    },
    digitalMagazine: {
      eyebrow: "TẠP CHÍ KỸ THUẬT SỐ",
      headline: "Ấn bản trực quan gốc + hỗ trợ đa ngôn ngữ",
      intro:
        "Bạn có thể mở tạp chí hình ảnh gốc bằng tiếng Tây Ban Nha và xem các trang như thiết kế. Leonix cũng cung cấp tóm tắt, điểm nổi bật và hành động nhanh bằng ngôn ngữ bạn chọn khi có sẵn.",
      visualNote:
        "Các trang tạp chí trực quan (PDF/FlipHTML5) là ấn bản gốc bằng tiếng Tây Ban Nha — không phải bản dịch tự động toàn bộ nội dung hình ảnh.",
      highlightsNote:
        "Dùng trang Leonix để có ngữ cảnh và CTA bằng ngôn ngữ của bạn. Google Lens hoặc ảnh chụp có thể giúp đọc trang hình ảnh. Bạn đồng hành HTML trong tương lai sẽ cải thiện phạm vi ngôn ngữ mà không thay thế ấn bản trực quan gốc.",
      mobileNote:
        "Trên điện thoại, chọn ngôn ngữ trên Leonix và dùng tóm tắt. Công cụ camera điện thoại có thể giúp với trang in hoặc trên màn hình — đừng quét màn hình của chính bạn để dịch.",
      readHighlightsCta: { label: "Đọc điểm nổi bật bằng ngôn ngữ của bạn" },
      openOriginalCta: { label: "Mở tạp chí kỹ thuật số gốc" },
      learnQrCta: { label: "Tìm hiểu truy cập QR" },
    },
    finalCta: {
      eyebrow: "SẴN SÀNG RA MẮT",
      headline: "Đặt chỗ trước khi ra mắt.",
      body: "Leonix Media đang chuẩn bị ra mắt để kết nối doanh nghiệp địa phương với cộng đồng Latinh và đa văn hóa Bay Area. Nếu bạn muốn xuất hiện từ đầu, đây là lúc giơ tay.",
      ctas: [
        { label: "Quảng cáo cùng chúng tôi", variant: "primary" },
        { label: "Xem Media Kit", variant: "secondary", external: true },
        { label: "Tham gia ra mắt", variant: "green" },
      ],
      mediaKitDownload: { label: "Tải Media Kit" },
    },
    contact: {
      title: "Liên hệ",
      body: "Có câu hỏi về quảng cáo, Media Kit hoặc giai đoạn ra mắt? Liên hệ với chúng tôi — chúng tôi sẽ giúp bạn chọn lộ trình phù hợp.",
      emailLabel: "Email",
      email: "info@leonixmedia.com",
      phoneLabel: "Điện thoại",
      phone: "(408) 303-6500",
      phoneHref: "tel:+14083036500",
      addressLabel: "Địa chỉ",
      address: "871 Coleman Avenue, Suite 202, San Jose, CA 95110",
      areaLabel: "Khu vực",
      area: "San José • Silicon Valley • Cộng đồng Latinh",
    },
    newsletter: {
      title: "Tham gia ra mắt",
      body: "Nhận tin tức, cơ hội và cập nhật từ Leonix Media.",
      placeholder: "Email của bạn",
      button: "Thông báo cho tôi",
      formAria: "Đăng ký bản tin",
      emailLabel: "Email",
      consent: "Tôi đồng ý nhận thông tin cập nhật ra mắt từ Leonix Media.",
      consentError: "Vui lòng xác nhận đồng ý nhận thông tin cập nhật.",
    },
    footer: "© 2026 Leonix Media. Dành cho cộng đồng chúng ta.",
  });
}
