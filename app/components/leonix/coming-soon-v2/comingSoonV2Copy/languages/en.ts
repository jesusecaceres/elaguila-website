import type { SupportedLang } from "@/app/lib/language";
import type { ComingSoonV2Copy } from "../types";
import { localizeComingSoonV2Copy } from "../assemble";

export function getEnCopy(lang: SupportedLang): ComingSoonV2Copy {
  return localizeComingSoonV2Copy(lang, {
    nav: [
      { label: "Home", href: "#inicio", active: true },
      { label: "What you get", href: "#que-obtienes" },
      { label: "How it works", href: "#como-funciona" },
      { label: "QR access", href: "#qr" },
      { label: "Contact", href: "#contacto" },
    ],
    launchCta: "Join the launch",
    brandName: "Leonix Media",
    langToggle: { es: "Español", en: "English" },
    mainAria: "Leonix Media — Home",
    navAria: "Main navigation",
    langAria: "Language",
    hero: {
      badge: "COMING SOON",
      title: "Leonix Media",
      valueLines: [
        {
          parts: [
            { text: "Spanish ", accent: "burgundy" },
            { text: "print advertising." },
          ],
        },
        {
          parts: [
            { text: "Bilingual ", accent: "burgundy" },
            { text: "digital exposure." },
          ],
        },
        {
          parts: [
            { text: "Multilingual ", accent: "burgundy" },
            { text: "access through " },
            { text: "QR", accent: "gold" },
            { text: "." },
          ],
        },
      ],
      paragraph:
        "Connect your business with the Latino and multicultural Bay Area community through a premium magazine, bilingual digital presence, and tools that turn attention into action.",
      ctas: [
        { label: "Advertise with us", variant: "primary" },
        { label: "View Media Kit", variant: "secondary" },
        { label: "Join the launch", variant: "green" },
      ],
      trustChips: ["Built for our community", "Local trust", "Digital action"],
      valueAria: "Value proposition",
      trustAria: "Trust",
      mediaVisual: {
        label: "Premium magazine + digital presence",
        qrOverlay: "Scan. Choose language. Connect.",
        magazineAlt: "Decorative Leonix Media magazine preview",
      },
      magazineCta: "View digital edition",
    },
    marketplace: {
      eyebrow: "CLASSIFIEDS + LOCAL MARKETPLACE",
      headline: "The community comes for what they need. Businesses gain visibility.",
      intro:
        "Leonix is not only advertising. We are also building a local marketplace where the community can search, post, and share real opportunities: rentals, jobs, private autos, items for sale, events, food, pets, and more.",
      bridge:
        "More reasons to visit Leonix means more opportunities for businesses to be seen.",
      cardsAria: "Local marketplace categories",
      cards: [
        {
          title: "Free stuff for sale",
          body: "Items for sale, home goods, tools, clothing, and more. Listings designed to bring local traffic and help neighbors share opportunities.",
        },
        {
          title: "Rentals",
          body: "Rooms, apartments, spaces, and housing opportunities with photos, description, location, price, and contact.",
        },
        {
          title: "Jobs",
          body: "Businesses that are hiring can connect with people in the community looking for work and new opportunities.",
        },
        {
          title: "Private autos",
          body: "Car listings with photos, description, price, and contact for local buyers.",
        },
        {
          title: "Food + events",
          body: "Pop-ups, local food, activities, community events, and moments that keep people coming back.",
        },
        {
          title: "Wanted + pets",
          body: "The community can also search, share needs, connect around pets, lost items, adoptions, or local support.",
        },
      ],
      closing:
        "Classifieds bring traffic. Negocios Locales turns that attention into calls, visits, and customers.",
      exploreCta: { label: "Explore Classifieds" },
    },
    whatYouGet: {
      eyebrow: "WHAT YOU GET",
      headline: "More than an ad: a complete presence for your business.",
      intro:
        "Leonix combines a monthly print magazine, a Local Business Hub, and QR-powered actions to help more customers find, understand, and contact your business.",
      expandMore: "Learn more",
      expandLess: "Show less",
      cards: [
        {
          title: "Monthly print magazine",
          body: "Your business can appear in a monthly magazine designed to connect with the local Latino community.",
          detail:
            "Leonix publishes a monthly Spanish print magazine for trusted local visibility. Print placement depends on your advertising package — not every business appears in every edition without a contract.",
          accent: "burgundy",
        },
        {
          title: "Bilingual digital presence",
          body: "Your business can also appear on Leonix web pages with native forms and actions in the language your customers choose.",
          detail:
            "Digital pages complement your print ad and your Local Business Hub profile with shareable information customers can return to from their phone.",
          accent: "gold",
        },
        {
          title: "QR + real actions",
          body: "Turn print attention into calls, messages, maps, website visits, social links, offers, and contact paths.",
          detail:
            "QR connects each monthly edition to digital action. Readers can scan, use phone translation tools or Leonix language pages, and reach your business without jumping platform by platform.",
          accent: "qr",
        },
        {
          title: "Local Business Hub + digital presence",
          body: "We create one central business page where customers can find your social links, website, phone, location, photos, reviews, offers, and contact options in one place.",
          detail:
            "Negocios Locales is more than an ad — it brings your online presence together so customers discover and explore your business without searching across separate platforms.",
          accent: "green",
        },
        {
          title: "Founder launch opportunity",
          body: "Be one of the first businesses featured with Leonix Media during the launch stage.",
          detail:
            "During launch, the first businesses help build the initial Leonix Media network. This is an early visibility opportunity — not a separate advertising format.",
          accent: "founder",
        },
      ],
    },
    howItWorks: {
      eyebrow: "HOW IT WORKS",
      headline: "A clear process to launch your presence with Leonix.",
      intro:
        "We guide you from the first information to a presence ready to print, share, and connect.",
      stepsAria: "Process steps",
      steps: [
        {
          title: "Choose your presence",
          body: "Select whether you want monthly print visibility, a digital Local Business Hub page, QR-powered customer actions, or a launch combination.",
        },
        {
          title: "Send your information",
          body: "Share your logo, photos, phone, address, socials, links, offer, and the main details of your business.",
        },
        {
          title: "We prepare your presence",
          body: "We organize your ad, your digital information, and the elements that help customers understand and contact your business.",
        },
        {
          title: "Launch and connect",
          body: "Your business is ready to appear in front of the community and turn interest into calls, messages, visits, and connections.",
        },
      ],
    },
    qrAccess: {
      eyebrow: "QR ACCESS",
      headline: "From the printed ad to the customer's phone.",
      intro:
        "Each monthly edition can connect the physical magazine to digital actions: scan, translate, open maps, call, visit social links, view offers, and contact the business.",
      callout: "Scan. Translate. Read. Connect.",
      explanation:
        "When the printed magazine is distributed, readers can scan QR codes on ads. To read the visual magazine, visitors can use their phone camera, Google Lens, Google Translate, or Apple Live Text on printed pages, desktop screens, or screenshots. To browse the Leonix website, they can use Leonix translated pages or Google Translate Website Mode as a fallback. Native Leonix contact and advertising forms stay the official lead path.",
      mobileNote:
        "On mobile, do not scan your own screen. Use Leonix language pages and summaries first. Google Lens and Apple Live Text are optional for printed pages or screenshots.",
      openReaderLabel: "View QR translation steps",
      heroStripSummary:
        "Each monthly print edition can connect readers to calls, maps, links, social profiles, and native Leonix contact paths.",
      detailNote: "Detailed QR translation guide",
      benefitsAria: "QR access benefits",
      benefits: [
        {
          title: "Print to phone action",
          body: "QR turns magazine attention into calls, maps, website visits, social links, offers, and native contact forms.",
        },
        {
          title: "Camera & website translation",
          body: "Google Lens, Google Translate, and Apple Live Text help read visual pages. Google Translate Website Mode helps browse Leonix pages — native forms stay official.",
        },
        {
          title: "Original visual magazine in Spanish",
          body: "The PDF/FlipHTML5 visual edition stays in Spanish. Leonix does not claim a fully translated visual magazine.",
        },
      ],
    },
    mediaKitPreview: {
      eyebrow: "MEDIA KIT",
      headline: "What you'll find in the Media Kit",
      intro:
        "The Media Kit brings together the full explanation of how Leonix Media combines print magazine exposure, digital presence, QR, real actions, and advertising packages to help your business look stronger and become easier to contact.",
      pdfHonestyLine:
        "The downloadable PDF may be the original Spanish edition while we prepare translated versions. The website explains your options in your selected language.",
      cardsAria: "Media Kit contents",
      cards: [
        {
          title: "Why advertise with Leonix",
          body: "See how Leonix helps create reach, trust, and action for local businesses that want to connect with the Latino and multicultural community.",
        },
        {
          title: "QR + action buttons",
          body: "See how a printed ad can help customers call you, open your map, send a message, visit your website, view social media, reviews, and more.",
        },
        {
          title: "Negocios Locales + digital presence",
          body: "Understand how your business can have an organized presence with phone, address, map, photos, reviews, social media, website, and contact buttons.",
        },
        {
          title: "Packages and next steps",
          body: "Review advertising options, visibility levels, and the process to get started with Leonix Media.",
        },
      ],
      ctaHeading: "Ready to see the details?",
      viewCta: { label: "View Media Kit" },
      downloadCta: { label: "Download Media Kit" },
      dualPdfEsLabel: "Media Kit (original Spanish PDF)",
      dualPdfEnLabel: "Download Media Kit",
      requestInfoCta: { label: "Request advertising information" },
      supportingLine:
        "Open the Media Kit to see formats, benefits, packages, and next steps.",
    },
    digitalMagazine: {
      eyebrow: "DIGITAL MAGAZINE",
      headline: "Original visual edition + multilingual support",
      intro:
        "You can open the original Spanish visual magazine and view its pages as designed. Leonix also offers summaries, highlights, and quick actions in your selected language where available.",
      visualNote:
        "The visual magazine pages (PDF/FlipHTML5) are the original Spanish edition — not an automatic translation of all artwork.",
      highlightsNote:
        "Use Leonix pages for context and CTAs in your language. Google Lens or screenshots can help read visual pages. A future HTML companion will improve language reach without replacing the original visual edition.",
      mobileNote:
        "On mobile, choose your language on Leonix and use the summaries. Phone camera tools can help with printed or on-screen pages — do not scan your own screen to translate.",
      readHighlightsCta: { label: "Read highlights in your language" },
      openOriginalCta: { label: "Open original digital magazine" },
      learnQrCta: { label: "Learn how QR access works" },
    },
    finalCta: {
      eyebrow: "READY TO LAUNCH",
      headline: "Reserve your space before launch.",
      body: "Leonix Media is preparing its launch to connect local businesses with the Latino and multicultural Bay Area community. If you want to appear from the beginning, this is the moment to raise your hand.",
      ctas: [
        { label: "Advertise with us", variant: "primary" },
        { label: "View Media Kit", variant: "secondary", external: true },
        { label: "Join the launch", variant: "green" },
      ],
      mediaKitDownload: { label: "Download Media Kit" },
    },
    contact: {
      title: "Contact",
      body: "Have questions about advertising, the Media Kit, or the launch stage? Contact us and we'll help you choose the best path for your business.",
      emailLabel: "Email",
      email: "info@leonixmedia.com",
      phoneLabel: "Phone",
      phone: "(408) 303-6500",
      phoneHref: "tel:+14083036500",
      addressLabel: "Address",
      address: "871 Coleman Avenue, Suite 202, San Jose, CA 95110",
      areaLabel: "Area",
      area: "San José • Silicon Valley • Latino Community",
    },
    newsletter: {
      title: "Be part of the launch",
      body: "Receive news, opportunities, and updates from Leonix Media.",
      placeholder: "Your email address",
      button: "Notify Me",
      formAria: "Newsletter signup",
      emailLabel: "Email address",
      consent: "I agree to receive Leonix Media launch updates.",
      consentError: "Please confirm consent to receive updates.",
    },
    footer: "© 2026 Leonix Media. Built for our community.",
  });
}
