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
        "Leonix combines print magazine visibility, digital presence, and QR-powered actions to help more customers find, understand, and contact your business.",
      expandMore: "Learn more",
      expandLess: "Show less",
      cards: [
        {
          title: "Premium print magazine",
          body: "Your business appears in a publication designed to connect with the local Latino community.",
          detail:
            "Your ad appears inside a magazine designed to feel local, trustworthy, and professional. The goal is not just to look good; it is to place your business in front of a community that wants to support local businesses.",
          accent: "burgundy",
        },
        {
          title: "Bilingual digital presence",
          body: "Your ad can also live in a clear, professional digital experience that is easy to share.",
          detail:
            "Your digital presence helps the ad go beyond a single page. Customers can find your information, share it, and return to it from their phone.",
          accent: "gold",
        },
        {
          title: "QR + real actions",
          body: "Turn attention into calls, messages, maps, links, offers, and more information.",
          detail:
            "The QR helps move people from the magazine to a concrete action: call, open a map, send a message, visit a website, view social media, or request more information.",
          accent: "qr",
        },
        {
          title: "Negocios Locales",
          body: "An organized presence for phone, location, socials, photos, reviews, and important links.",
          detail:
            "Negocios Locales organizes your information in one place so customers do not have to search across separate platforms. Phone, address, map, socials, photos, and links can live together.",
          accent: "green",
        },
        {
          title: "Founder launch opportunity",
          body: "Be one of the first businesses featured with Leonix Media during the launch stage.",
          detail:
            "During launch, the first businesses help build the initial Leonix Media network. This creates an early visibility opportunity while the community starts discovering the platform.",
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
          title: "Choose your path",
          body: "Select the type of presence you want: print ad, digital presence, QR, Media Kit, or launch package.",
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
        "Scan the QR for simple steps, or use the translator QR to try opening Google Lens or Google Translate on your phone.",
      callout: "Scan. Translate. Read. Connect.",
      explanation:
        "Scan the QR to learn how to translate the visual magazine with Google Lens, Google Translate, or Apple Translate. Then use Leonix to open links, contact businesses, and view quick actions.",
      mobileNote:
        "You already scanned the QR — do not scan your own screen. Use Google Lens, Google Translate camera, or Apple Translate on the printed or digital magazine.",
      openReaderLabel: "See camera translation steps",
      benefitsAria: "QR access benefits",
      benefits: [
        {
          title: "Translate with your camera",
          body: "Google Lens, Google Translate camera, or Apple Translate read the visual magazine in your language.",
        },
        {
          title: "Leonix links & actions",
          body: "After reading, use Leonix to call, open maps, view the Media Kit, and contact businesses.",
        },
        {
          title: "Original magazine in Spanish",
          body: "The visual edition (PDF/flipbook) stays in Spanish — Leonix does not auto-translate it.",
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
      requestInfoCta: { label: "Request advertising information" },
      supportingLine:
        "Open the Media Kit to see formats, benefits, packages, and next steps.",
    },
    digitalMagazine: {
      eyebrow: "DIGITAL MAGAZINE",
      headline: "Open the original visual edition — with support in your language",
      intro:
        "You can open the original digital magazine and view its pages as designed. Leonix also offers summaries, highlights, and quick actions in the language you choose.",
      visualNote:
        "The visual magazine pages (PDF/FlipHTML5) are the original edition — not an automatic translation of all artwork.",
      highlightsNote:
        "On the site you will find summaries and CTAs in your language to guide you without claiming a fully translated visual magazine.",
      mobileNote:
        "On mobile, choose your language on Leonix and use the summaries. Do not scan your own screen to translate.",
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
    },
    footer: "© 2026 Leonix Media. Built for our community.",
  });
}
