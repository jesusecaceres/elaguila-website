import type { IglesiasUiLang } from "./taxonomy";

export type IglesiasCopy = {
  heroEyebrow: string;
  heroTitleLine1: string;
  heroTitleLine2: string;
  heroSupport: string;
  heroScripture: string;
  ctaFind: string;
  ctaPrayer: string;
  ctaChurch: string;
  collageCaption: string;
  welcomeEyebrow: string;
  welcomeTitle: string;
  welcomeBody: string;
  lanePrayerEyebrow: string;
  lanePrayerTitle: string;
  lanePrayerSupport: string;
  lanePrayerInvite: string;
  comingSoon: string;
  prayerCardWallTitle: string;
  prayerCardWallBody: string;
  prayerCardRequestTitle: string;
  prayerCardRequestBody: string;
  prayerCardNetworkTitle: string;
  prayerCardNetworkBody: string;
  laneChurchEyebrow: string;
  laneChurchTitle: string;
  laneChurchSupport: string;
  searchHeading: string;
  searchName: string;
  searchCity: string;
  searchNeed: string;
  searchLanguage: string;
  searchSubmit: string;
  searchClear: string;
  searchNeedAll: string;
  searchLangAll: string;
  langEs: string;
  langEn: string;
  langBilingual: string;
  needSectionEyebrow: string;
  needSectionTitle: string;
  needSectionSupport: string;
  needNavNote: string;
  prayerComingTitle: string;
  prayerComingBody: string;
  discoveryTitle: string;
  discoveryEmpty: string;
  discoveryEmptySupport: string;
  discoveryFilteredEmpty: string;
  discoveryCount: (n: number) => string;
  cardView: string;
  cardDirections: string;
  cardCall: string;
  trustEyebrow: string;
  trustTitle: string;
  trustBody: string;
  churchCtaTitle: string;
  churchCtaBody: string;
  churchCtaButton: string;
  profileAbout: string;
  profileServices: string;
  profileHelp: string;
  profileContact: string;
  profileLocation: string;
  profileSocials: string;
  profileWebsite: string;
  profileLivestream: string;
  profileEmail: string;
  profileNoServices: string;
  profileNotFoundTitle: string;
  profileNotFoundBody: string;
  profileBack: string;
  applyTitle: string;
  applySupport: string;
  applyPendingNote: string;
  applyPrayerTeamLegend: string;
  applyPrayerTeamHelp: string;
  applyPrayerTeamYes: string;
  applyPrayerTeamNo: string;
  applyPrayerTeamInterested: string;
  applySubmit: string;
  applySuccessTitle: string;
  applySuccessBody: string;
  applySuccessPublishedTitle: string;
  applySuccessPublishedBody: string;
  applySuccessReviewTitle: string;
  applySuccessReviewBody: string;
  applySuccessBlockedTitle: string;
  applySuccessBlockedBody: string;
  applyError: string;
  dayNames: readonly string[];
  modeInPerson: string;
  modeOnline: string;
  modeHybrid: string;
  editorialImageNote: string;
};

const ES: IglesiasCopy = {
  heroEyebrow: "Fe, esperanza y comunidad",
  heroTitleLine1: "No estás solo.",
  heroTitleLine2: "El amor no tiene distancia.",
  heroSupport:
    "La oración es para todas las personas: creyentes, buscadores, familias, recién llegados y quien necesita apoyo. Cerca o lejos, aquí hay un lugar para ti.",
  heroScripture: "Ámense unos a otros. Donde dos o más se reúnen, hay presencia y esperanza.",
  ctaFind: "Encontrar una iglesia",
  ctaPrayer: "Necesito oración",
  ctaChurch: "Soy una iglesia",
  collageCaption: "Imágenes editoriales de comunidad. No representan iglesias listadas en Leonix.",
  welcomeEyebrow: "Un espacio abierto",
  welcomeTitle: "La oración es para todos",
  welcomeBody:
    "Creas, estás buscando, dudas, o simplemente necesitas que alguien te sostenga: eres bienvenido. La distancia no apaga el amor ni la oración. Encuentra apoyo, comunidad, o una iglesia cuando estés listo.",
  lanePrayerEyebrow: "Oración y apoyo",
  lanePrayerTitle: "Pide oración. Recibe apoyo.",
  lanePrayerSupport:
    "Este es un espacio seguro y respetuoso para pedir oración en público o en privado. Nadie tiene que fingir fe para pertenecer aquí.",
  lanePrayerInvite:
    "Sea cual sea tu historia, tu cultura o el lugar donde estás, la oración no pide permiso a un mapa.",
  comingSoon: "Próximamente",
  prayerCardWallTitle: "Muro de oración",
  prayerCardWallBody: "Un lugar para compartir peticiones con respeto.",
  prayerCardRequestTitle: "Pedir oración",
  prayerCardRequestBody: "Puedes pedir oración de forma pública o privada, también de manera anónima.",
  prayerCardNetworkTitle: "Red de oración",
  prayerCardNetworkBody: "Iglesias podrán unirse para orar con quienes lo pidan. La red todavía no está abierta.",
  laneChurchEyebrow: "Encuentra una iglesia",
  laneChurchTitle: "Comunidad cerca de ti",
  laneChurchSupport:
    "Cuando quieras un lugar para reunirte, busca por necesidad, idioma o ciudad. El directorio es local y honesto: solo iglesias reales, revisadas.",
  searchHeading: "Buscar una iglesia",
  searchName: "Nombre o palabra clave",
  searchCity: "Ciudad, estado, país o código postal",
  searchNeed: "Necesidad",
  searchLanguage: "Idioma",
  searchSubmit: "Buscar",
  searchClear: "Limpiar",
  searchNeedAll: "Todas las necesidades",
  searchLangAll: "Todos los idiomas",
  langEs: "Español",
  langEn: "Inglés",
  langBilingual: "Bilingüe",
  needSectionEyebrow: "Empieza por lo que necesitas",
  needSectionTitle: "No hace falta saber una denominación",
  needSectionSupport: "Familia, duelo, jóvenes, alimentos, español, esperanza: elige una necesidad. Estos recuadros son orientación, no un inventario de iglesias.",
  needNavNote: "Imágenes editoriales de orientación. No son iglesias listadas.",
  prayerComingTitle: "Oración",
  prayerComingBody:
    "Puedes pedir oración aquí, en público o en privado. La Red de Oración con iglesias llega en un siguiente paso.",
  discoveryTitle: "Iglesias cerca de ti",
  discoveryEmpty: "Aún estamos incorporando iglesias de nuestra comunidad.",
  discoveryEmptySupport:
    "Puedes explorar por necesidad y, si representas una congregación, enviar una solicitud. No mostramos iglesias de ejemplo.",
  discoveryFilteredEmpty: "Todavía no hay iglesias publicadas que coincidan con esta búsqueda.",
  discoveryCount: (n) => (n === 1 ? "1 iglesia" : `${n} iglesias`),
  cardView: "Ver iglesia",
  cardDirections: "Cómo llegar",
  cardCall: "Llamar",
  trustEyebrow: "Cómo Leonix acompaña",
  trustTitle: "Amor primero. Sin ranking pagado.",
  trustBody:
    "Esta página existe para ayudar a las personas a encontrar oración, apoyo y comunidad de fe. Leonix no vende posiciones, no rankingea congregaciones y no respalda una teología. Incluir una iglesia no es una recomendación doctrinal.",
  churchCtaTitle: "¿Representas una iglesia?",
  churchCtaBody: "Envía los datos de tu congregación. Revisamos cada solicitud antes de publicarla.",
  churchCtaButton: "Registrar mi iglesia",
  profileAbout: "Quiénes somos",
  profileServices: "Horarios de servicio",
  profileHelp: "¿Cómo podemos ayudarte?",
  profileContact: "Contacto",
  profileLocation: "Ubicación",
  profileSocials: "Redes",
  profileWebsite: "Sitio web",
  profileLivestream: "En vivo",
  profileEmail: "Correo",
  profileNoServices: "Esta iglesia aún no publicó horarios de servicio.",
  profileNotFoundTitle: "No encontramos esta iglesia",
  profileNotFoundBody: "Puede estar en revisión o ya no estar publicada.",
  profileBack: "Volver a Iglesias",
  applyTitle: "Registrar una iglesia",
  applySupport: "Las solicitudes claras se publican automáticamente. Solo las excepciones se revisan.",
  applyPendingNote: "Si hace falta revisión, te lo confirmamos al enviar.",
  applyPrayerTeamLegend: "¿Tu iglesia tiene un equipo o ministerio de oración?",
  applyPrayerTeamHelp: "Esto es solo intención. No activa la Red de Oración. Un administrador revisa cada solicitud.",
  applyPrayerTeamYes: "Sí",
  applyPrayerTeamNo: "No",
  applyPrayerTeamInterested: "Nos interesa",
  applySubmit: "Enviar solicitud",
  applySuccessTitle: "Solicitud recibida",
  applySuccessBody: "Recibimos tu solicitud. Necesitamos revisar algunos detalles antes de publicarla.",
  applySuccessPublishedTitle: "Iglesia publicada",
  applySuccessPublishedBody: "Tu iglesia fue recibida y publicada correctamente.",
  applySuccessReviewTitle: "Solicitud recibida",
  applySuccessReviewBody: "Recibimos tu solicitud. Necesitamos revisar algunos detalles antes de publicarla.",
  applySuccessBlockedTitle: "Solicitud recibida",
  applySuccessBlockedBody: "Recibimos tu solicitud. No podemos publicarla en este momento.",
  applyError: "No pudimos enviar la solicitud. Inténtalo de nuevo.",
  dayNames: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
  modeInPerson: "En persona",
  modeOnline: "En línea",
  modeHybrid: "Híbrido",
  editorialImageNote: "Imagen editorial de la sección Iglesias. No es una congregación listada.",
};

const EN: IglesiasCopy = {
  heroEyebrow: "Faith, hope, and community",
  heroTitleLine1: "You are not alone.",
  heroTitleLine2: "Love has no distance.",
  heroSupport:
    "Prayer is for everyone — believers, seekers, families, newcomers, and anyone who needs support. Near or far, there is a place for you here.",
  heroScripture: "Love one another. Where two or more gather, there is presence and hope.",
  ctaFind: "Find a church",
  ctaPrayer: "I need prayer",
  ctaChurch: "I am a church",
  collageCaption: "Editorial community photography. These images are not listed Leonix churches.",
  welcomeEyebrow: "An open space",
  welcomeTitle: "Prayer is for everyone",
  welcomeBody:
    "Whether you believe, are searching, have doubts, or simply need someone to stand with you: you are welcome. Distance does not stop love or prayer. Find support, community, or a church when you are ready.",
  lanePrayerEyebrow: "Prayer and support",
  lanePrayerTitle: "Ask for prayer. Receive support.",
  lanePrayerSupport:
    "This is a safe, respectful place to ask for prayer in public or in private. You do not have to pretend faith to belong here.",
  lanePrayerInvite: "Whatever your story, culture, or place on the map, prayer does not wait for proximity.",
  comingSoon: "Coming soon",
  prayerCardWallTitle: "Prayer wall",
  prayerCardWallBody: "A respectful place to share requests.",
  prayerCardRequestTitle: "Request prayer",
  prayerCardRequestBody: "You can ask for prayer publicly or privately, including anonymously.",
  prayerCardNetworkTitle: "Prayer network",
  prayerCardNetworkBody: "Churches will be able to pray with those who ask. The network is not open yet.",
  laneChurchEyebrow: "Find a church",
  laneChurchTitle: "Community near you",
  laneChurchSupport:
    "When you want a place to gather, search by need, language, or city. The directory is local and honest: real churches only, after review.",
  searchHeading: "Search for a church",
  searchName: "Name or keyword",
  searchCity: "City, state, country, or postal code",
  searchNeed: "Need",
  searchLanguage: "Language",
  searchSubmit: "Search",
  searchClear: "Clear",
  searchNeedAll: "All needs",
  searchLangAll: "All languages",
  langEs: "Spanish",
  langEn: "English",
  langBilingual: "Bilingual",
  needSectionEyebrow: "Start with what you need",
  needSectionTitle: "You do not need a denomination first",
  needSectionSupport: "Family, grief, youth, food, Spanish, hope: choose a need. These tiles are guidance, not church inventory.",
  needNavNote: "Editorial navigation imagery. These are not listed churches.",
  prayerComingTitle: "Prayer",
  prayerComingBody:
    "You can ask for prayer here, in public or in private. Church Prayer Network delivery comes in a later step.",
  discoveryTitle: "Churches near you",
  discoveryEmpty: "We are still welcoming churches from our community.",
  discoveryEmptySupport:
    "You can still explore by need, and congregations can apply. We do not show sample churches.",
  discoveryFilteredEmpty: "No published churches match this search yet.",
  discoveryCount: (n) => (n === 1 ? "1 church" : `${n} churches`),
  cardView: "View church",
  cardDirections: "Directions",
  cardCall: "Call",
  trustEyebrow: "How Leonix walks with you",
  trustTitle: "Love first. No paid ranking.",
  trustBody:
    "This page exists to help people find prayer, support, and faith community. Leonix does not sell rankings, does not rank congregations, and does not endorse a theology. Listing a church is not a doctrinal recommendation.",
  churchCtaTitle: "Do you represent a church?",
  churchCtaBody: "Submit your congregation. Every application is reviewed before it is published.",
  churchCtaButton: "Register my church",
  profileAbout: "About",
  profileServices: "Service times",
  profileHelp: "How can we help?",
  profileContact: "Contact",
  profileLocation: "Location",
  profileSocials: "Social",
  profileWebsite: "Website",
  profileLivestream: "Livestream",
  profileEmail: "Email",
  profileNoServices: "This church has not published service times yet.",
  profileNotFoundTitle: "We could not find this church",
  profileNotFoundBody: "It may still be in review or is no longer published.",
  profileBack: "Back to Churches",
  applyTitle: "Register a church",
  applySupport: "Clear applications are published automatically. Only exceptions are reviewed.",
  applyPendingNote: "If a review is needed, we will confirm that when you submit.",
  applyPrayerTeamLegend: "Does your church have a prayer team or prayer ministry?",
  applyPrayerTeamHelp: "This is intent only. It does not enable the Prayer Network. Every application still needs admin review.",
  applyPrayerTeamYes: "Yes",
  applyPrayerTeamNo: "No",
  applyPrayerTeamInterested: "Interested",
  applySubmit: "Submit application",
  applySuccessTitle: "Application received",
  applySuccessBody: "We received your application. We need to review a few details before publishing it.",
  applySuccessPublishedTitle: "Church published",
  applySuccessPublishedBody: "Your church was received and published successfully.",
  applySuccessReviewTitle: "Application received",
  applySuccessReviewBody: "We received your application. We need to review a few details before publishing it.",
  applySuccessBlockedTitle: "Application received",
  applySuccessBlockedBody: "We received your application. We cannot publish it at this time.",
  applyError: "We could not send the application. Please try again.",
  dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  modeInPerson: "In person",
  modeOnline: "Online",
  modeHybrid: "Hybrid",
  editorialImageNote: "Editorial image for the Churches section. Not a listed congregation.",
};

export function getIglesiasCopy(lang: IglesiasUiLang): IglesiasCopy {
  return lang === "en" ? EN : ES;
}

export function formatIglesiasServiceSummary(
  dayOfWeek: number,
  startsAt: string,
  language: string,
  lang: IglesiasUiLang,
): string {
  const copy = getIglesiasCopy(lang);
  const day = copy.dayNames[dayOfWeek] ?? "";
  const time = formatIglesiasTime(startsAt, lang);
  const languageLabel =
    language === "en" ? copy.langEn : language === "bilingual" ? copy.langBilingual : copy.langEs;
  return `${day} ${time} · ${languageLabel}`;
}

export function formatIglesiasTime(startsAt: string, lang: IglesiasUiLang): string {
  const raw = String(startsAt ?? "");
  const m = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return raw;
  const hours = Number(m[1]);
  const minutes = m[2];
  if (lang === "en") {
    const suffix = hours >= 12 ? "PM" : "AM";
    const h12 = hours % 12 || 12;
    return `${h12}:${minutes} ${suffix}`;
  }
  return `${String(hours).padStart(2, "0")}:${minutes}`;
}

export function iglesiasLanguageLabel(code: string, lang: IglesiasUiLang): string {
  const copy = getIglesiasCopy(lang);
  if (code === "en") return copy.langEn;
  if (code === "bilingual") return copy.langBilingual;
  return copy.langEs;
}

export function googleDirectionsHref(address: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
