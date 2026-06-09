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
      cardsAria: "Danh mục marketplace địa phương",
      cards: [
        {
          title: "Đồ miễn phí / bán",
          body: "Đồ bán, đồ gia dụng, dụng cụ, quần áo và hơn thế. Tin đăng giúp thu hút lưu lượng địa phương và chia sẻ cơ hội giữa hàng xóm.",
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
        "Leonix kết hợp tạp chí in, hiện diện kỹ thuật số và hành động qua QR để giúp nhiều khách hàng tìm thấy, hiểu và liên hệ doanh nghiệp của bạn.",
      expandMore: "Xem thêm",
      expandLess: "Thu gọn",
      cards: [
        {
          title: "Tạp chí in cao cấp",
          body: "Doanh nghiệp của bạn xuất hiện trên ấn phẩm được thiết kế cho cộng đồng Latinh địa phương.",
          detail:
            "Quảng cáo của bạn nằm trong một tạp chí mang cảm giác địa phương, đáng tin và chuyên nghiệp. Mục tiêu không chỉ là đẹp — mà là đặt doanh nghiệp trước một cộng đồng muốn ủng hộ doanh nghiệp địa phương.",
          accent: "burgundy",
        },
        {
          title: "Hiện diện kỹ thuật số song ngữ",
          body: "Quảng cáo cũng có thể sống trong trải nghiệm kỹ thuật số rõ ràng, chuyên nghiệp và dễ chia sẻ.",
          detail:
            "Hiện diện kỹ thuật số giúp quảng cáo không dừng ở một trang. Khách hàng có thể tìm thông tin, chia sẻ và quay lại từ điện thoại.",
          accent: "gold",
        },
        {
          title: "QR + hành động thực",
          body: "Biến sự chú ý thành cuộc gọi, tin nhắn, bản đồ, liên kết, ưu đãi và thêm thông tin.",
          detail:
            "QR giúp đưa người đọc từ tạp chí đến hành động cụ thể: gọi, mở bản đồ, nhắn tin, vào website, xem mạng xã hội hoặc yêu cầu thêm thông tin.",
          accent: "qr",
        },
        {
          title: "Negocios Locales",
          body: "Sự hiện diện có tổ chức cho điện thoại, vị trí, mạng xã hội, ảnh, đánh giá và liên kết quan trọng.",
          detail:
            "Negocios Locales gom thông tin một chỗ để khách không phải tìm trên nhiều nền tảng. Điện thoại, địa chỉ, bản đồ, mạng xã hội, ảnh và liên kết có thể ở cùng nhau.",
          accent: "green",
        },
        {
          title: "Cơ hội ra mắt sớm",
          body: "Hãy là một trong những doanh nghiệp đầu tiên xuất hiện cùng Leonix Media trong giai đoạn ra mắt.",
          detail:
            "Trong giai đoạn ra mắt, các doanh nghiệp đầu tiên giúp xây mạng lưới Leonix Media ban đầu. Đây là cơ hội hiển thị sớm khi cộng đồng bắt đầu biết đến nền tảng.",
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
          title: "Chọn lộ trình",
          body: "Chọn loại hiện diện bạn muốn: quảng cáo in, kỹ thuật số, QR, Media Kit hoặc gói ra mắt.",
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
        "QR kết nối tạp chí in với trải nghiệm kỹ thuật số của Leonix — cầu nối đa ngôn ngữ của bạn.",
      callout: "Quét. Chọn ngôn ngữ. Kết nối.",
      explanation:
        "Quét QR từ tài liệu in hoặc kỹ thuật số. Trên Leonix bạn chọn ngôn ngữ, đọc tóm tắt và thông tin doanh nghiệp địa phương, rồi hành động nhanh. Website là cầu nối đa ngôn ngữ; tạp chí trực quan giữ nguyên ấn bản gốc.",
      mobileNote:
        "Trên điện thoại, đừng cố quét màn hình của chính bạn. Dùng bộ chọn ngôn ngữ Leonix và các tóm tắt bằng ngôn ngữ bạn chọn. Google Lens hoặc Apple Translate chỉ là tùy chọn cho tài liệu in.",
      benefitsAria: "Lợi ích truy cập QR",
      benefits: [
        {
          title: "Chọn ngôn ngữ trên Leonix",
          body: "Tóm tắt, thông tin doanh nghiệp và hành động nhanh bằng ngôn ngữ bạn chọn trên trang.",
        },
        {
          title: "Nhiều cách để hành động",
          body: "Từ điện thoại, họ có thể gọi, mở bản đồ, nhắn tin, vào liên kết, xem mạng xã hội hoặc yêu cầu thêm thông tin.",
        },
        {
          title: "Tùy chọn cho bản in",
          body: "Với tài liệu in, Google Lens hoặc Apple Translate có thể giúp đọc văn bản. Leonix vẫn là cổng chính đến nội dung kỹ thuật số.",
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
      requestInfoCta: { label: "Yêu cầu thông tin quảng cáo" },
      supportingLine:
        "Mở Media Kit để xem định dạng, lợi ích, gói và các bước tiếp theo.",
    },
    digitalMagazine: {
      eyebrow: "TẠP CHÍ KỸ THUẬT SỐ",
      headline: "Mở ấn bản trực quan gốc — với hỗ trợ bằng ngôn ngữ của bạn",
      intro:
        "Bạn có thể mở tạp chí kỹ thuật số gốc và xem các trang như thiết kế. Leonix cũng cung cấp tóm tắt, điểm nổi bật và hành động nhanh bằng ngôn ngữ bạn chọn.",
      visualNote:
        "Các trang tạp chí trực quan (PDF/FlipHTML5) là ấn bản gốc — không phải bản dịch tự động toàn bộ nội dung hình ảnh.",
      highlightsNote:
        "Trên trang web bạn sẽ thấy tóm tắt và CTA bằng ngôn ngữ bạn chọn để hướng dẫn mà không hứa tạp chí trực quan được dịch đầy đủ.",
      mobileNote:
        "Trên điện thoại, chọn ngôn ngữ trên Leonix và dùng tóm tắt. Đừng quét màn hình của chính bạn để dịch.",
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
    },
    footer: "© 2026 Leonix Media. Dành cho cộng đồng chúng ta.",
  });
}
