import type { BusinessTypePreset, ChipDef, ServiciosInternalGroup } from "./clasificadosServiciosApplicationTypes";

function C(id: string, es: string, en: string): ChipDef {
  return { id, es, en };
}

function preset(
  id: string,
  group: ServiciosInternalGroup,
  labelEs: string,
  labelEn: string,
  suggestedServices: ChipDef[],
  reasonsToChoose: ChipDef[],
  quickFacts: ChipDef[],
  primaryCtaOptions: ChipDef[],
  secondaryCtaOptions: ChipDef[],
): BusinessTypePreset {
  return {
    id,
    internalGroup: group,
    labelEs,
    labelEn,
    suggestedServices,
    reasonsToChoose,
    quickFacts,
    primaryCtaOptions,
    secondaryCtaOptions,
  };
}

/** All supported business types — one universal app, many presets */
export const BUSINESS_TYPE_PRESETS: BusinessTypePreset[] = [
  preset(
    "plomero",
    "home_trade",
    "Plomero",
    "Plumber",
    [
      C("plom_fugas", "Reparación de fugas", "Leak repair"),
      C("plom_destape", "Destape de drenaje", "Drain cleaning"),
      C("plom_calentador", "Calentador de agua", "Water heater"),
      C("plom_griferia", "Instalación de grifería", "Fixture installation"),
      C("plom_emergencia", "Plomería de emergencia", "Emergency plumbing"),
    ],
    [
      C("plom_r1", "Licenciado", "Licensed"),
      C("plom_r2", "Asegurado", "Insured"),
      C("plom_r3", "Servicio el mismo día", "Same-day service"),
      C("plom_r4", "Estimados gratis", "Free estimates"),
      C("plom_r5", "Servicio de emergencia", "Emergency service"),
    ],
    [
      C("plom_q1", "Años de experiencia", "Years of experience"),
      C("plom_q2", "Responde en 1 hora", "Responds within 1 hour"),
      C("plom_q3", "Estimados gratis", "Free estimates"),
      C("plom_q4", "Servicio de emergencia", "Emergency service"),
      C("plom_q5", "Servicio móvil", "Mobile service"),
    ],
    [
      C("cta_cotiz", "Solicitar cotización", "Request a quote"),
      C("cta_visita", "Agendar visita", "Schedule a visit"),
      C("cta_llamar", "Llamar ahora", "Call now"),
    ],
    [
      C("sec_mensaje", "Enviar mensaje", "Send a message"),
      C("sec_whatsapp", "WhatsApp", "WhatsApp"),
    ],
  ),
  preset(
    "electricista",
    "home_trade",
    "Electricista",
    "Electrician",
    [
      C("el_inst", "Instalaciones eléctricas", "Electrical installations"),
      C("el_panel", "Paneles y breakers", "Panels & breakers"),
      C("el_ilum", "Iluminación", "Lighting"),
      C("el_revision", "Revisiones de seguridad", "Safety inspections"),
      C("el_emergencia", "Emergencias eléctricas", "Electrical emergencies"),
    ],
    [
      C("el_r1", "Licenciado", "Licensed"),
      C("el_r2", "Asegurado", "Insured"),
      C("el_r3", "Citas el mismo día", "Same-day appointments"),
      C("el_r4", "Estimados claros", "Clear estimates"),
      C("el_r5", "Cumple códigos locales", "Meets local codes"),
    ],
    [
      C("el_q1", "Respuesta rápida", "Fast response"),
      C("el_q2", "Años de experiencia", "Years of experience"),
      C("el_q3", "Garantía en mano de obra", "Workmanship warranty"),
      C("el_q4", "Servicio de emergencia", "Emergency service"),
      C("el_q5", "Presupuesto gratuito", "Free quote"),
    ],
    [
      C("cta_cotiz", "Solicitar cotización", "Request a quote"),
      C("cta_inspeccion", "Solicitar inspección", "Request inspection"),
      C("cta_llamar", "Llamar ahora", "Call now"),
    ],
    [C("sec_mensaje", "Enviar mensaje", "Send a message"), C("sec_whatsapp", "WhatsApp", "WhatsApp")],
  ),
  preset(
    "contratista",
    "home_trade",
    "Contratista general",
    "General contractor",
    [
      C("co_remodel", "Remodelación", "Remodeling"),
      C("co_adiciones", "Adiciones", "Additions"),
      C("co_exteriores", "Exteriores / decks", "Exteriors / decks"),
      C("co_proyecto", "Gestión de proyecto", "Project management"),
    ],
    [
      C("co_r1", "Licenciado y asegurado", "Licensed & insured"),
      C("co_r2", "Referencias disponibles", "References available"),
      C("co_r3", "Cronogramas claros", "Clear timelines"),
      C("co_r4", "Subcontratistas calificados", "Qualified subs"),
    ],
    [
      C("co_q1", "Proyectos locales", "Local projects"),
      C("co_q2", "Estimados detallados", "Detailed estimates"),
      C("co_q3", "Visitas a obra", "Site visits"),
    ],
    [
      C("cta_cotiz", "Solicitar cotización", "Request a quote"),
      C("cta_visita", "Agendar visita", "Schedule visit"),
    ],
    [C("sec_mensaje", "Enviar mensaje", "Send a message")],
  ),
  preset(
    "cerrajero",
    "home_trade",
    "Cerrajero",
    "Locksmith",
    [
      C("ce_resid", "Residencial", "Residential"),
      C("ce_comer", "Comercial", "Commercial"),
      C("ce_auto", "Cerrajería automotriz", "Automotive locks"),
      C("ce_duplic", "Duplicado de llaves", "Key duplication"),
    ],
    [
      C("ce_r1", "Servicio de emergencia 24/7", "24/7 emergency"),
      C("ce_r2", "Llegada rápida", "Fast arrival"),
      C("ce_r3", "Precios transparentes", "Transparent pricing"),
    ],
    [
      C("ce_q1", "Respuesta en minutos", "Response in minutes"),
      C("ce_q2", "Servicio móvil", "Mobile service"),
    ],
    [C("cta_llamar", "Llamar ahora", "Call now"), C("cta_cotiz", "Solicitar servicio", "Request service")],
    [C("sec_whatsapp", "WhatsApp", "WhatsApp")],
  ),
  preset(
    "pintor",
    "home_trade",
    "Pintor",
    "Painter",
    [
      C("pi_int", "Interiores", "Interior"),
      C("pi_ext", "Exteriores", "Exterior"),
      C("pi_gab", "Gabinetes", "Cabinets"),
      C("pi_comer", "Comercial ligero", "Light commercial"),
    ],
    [
      C("pi_r1", "Muestras de color", "Color samples"),
      C("pi_r2", "Preparación de superficie", "Surface prep"),
      C("pi_r3", "Acabados limpios", "Clean finishes"),
    ],
    [
      C("pi_q1", "Estimados gratis", "Free estimates"),
      C("pi_q2", "Años de experiencia", "Years of experience"),
    ],
    [C("cta_cotiz", "Solicitar cotización", "Request quote"), C("cta_visita", "Agendar visita", "Schedule visit")],
    [C("sec_mensaje", "Enviar mensaje", "Send a message")],
  ),
  preset(
    "roofing",
    "home_trade",
    "Techos / Roofing",
    "Roofing",
    [
      C("ro_rep", "Reparación de techos", "Roof repair"),
      C("ro_reem", "Reemplazo", "Replacement"),
      C("ro_inspe", "Inspección", "Inspection"),
      C("ro_canal", "Canaletas", "Gutters"),
    ],
    [
      C("ro_r1", "Licenciado y asegurado", "Licensed & insured"),
      C("ro_r2", "Garantía de materiales", "Material warranty"),
      C("ro_r3", "Fotos antes/después", "Before/after photos"),
    ],
    [
      C("ro_q1", "Inspecciones gratis", "Free inspections"),
      C("ro_q2", "Financiamiento disponible", "Financing available"),
    ],
    [C("cta_cotiz", "Solicitar cotización", "Request quote"), C("cta_inspeccion", "Inspección gratuita", "Free inspection")],
    [C("sec_mensaje", "Enviar mensaje", "Send a message")],
  ),
  preset(
    "hvac",
    "home_trade",
    "Aire acondicionado / HVAC",
    "HVAC",
    [
      C("hv_instal", "Instalación", "Installation"),
      C("hv_mant", "Mantenimiento", "Maintenance"),
      C("hv_rep", "Reparación", "Repair"),
      C("hv_mini", "Minisplits", "Ductless / mini-splits"),
    ],
    [
      C("hv_r1", "Técnicos certificados", "Certified techs"),
      C("hv_r2", "Piezas originales", "OEM parts"),
      C("hv_r3", "Contratos de mantenimiento", "Maintenance plans"),
    ],
    [
      C("hv_q1", "Servicio el mismo día", "Same-day service"),
      C("hv_q2", "Emergencias", "Emergency service"),
    ],
    [C("cta_cotiz", "Solicitar cotización", "Request quote"), C("cta_mant", "Agendar mantenimiento", "Schedule maintenance")],
    [C("sec_whatsapp", "WhatsApp", "WhatsApp")],
  ),
  preset(
    "abogado_inmigracion",
    "legal",
    "Abogado de inmigración",
    "Immigration lawyer",
    [
      C("im_asilo", "Asilo", "Asylum"),
      C("im_res", "Residencia", "Residency"),
      C("im_ciu", "Ciudadanía", "Citizenship"),
      C("im_fam", "Peticiones familiares", "Family petitions"),
      C("im_def", "Defensa de deportación", "Removal defense"),
    ],
    [
      C("im_r1", "Consulta inicial", "Initial consultation"),
      C("im_r2", "Bilingüe", "Bilingual"),
      C("im_r3", "Planes de pago", "Payment plans"),
      C("im_r4", "Citas virtuales", "Virtual appointments"),
      C("im_r5", "Años de experiencia", "Years of experience"),
    ],
    [
      C("im_q1", "Consulta el mismo día", "Same-day consult availability"),
      C("im_q2", "Seguimiento claro", "Clear communication"),
      C("im_q3", "Citas virtuales", "Virtual visits"),
    ],
    [
      C("cta_consulta", "Solicitar consulta", "Request consultation"),
      C("cta_llamar", "Llamar", "Call"),
      C("cta_caso", "Evaluar mi caso", "Evaluate my case"),
    ],
    [C("sec_mensaje", "Enviar mensaje", "Send message"), C("sec_web", "Sitio web", "Website")],
  ),
  preset(
    "abogado_accidentes",
    "legal",
    "Abogado de accidentes",
    "Accident lawyer",
    [
      C("ac_auto", "Accidentes de auto", "Car accidents"),
      C("ac_moto", "Motocicletas", "Motorcycles"),
      C("ac_corp", "Lesiones corporales", "Personal injury"),
      C("ac_seg", "Negociación con seguros", "Insurance negotiation"),
    ],
    [
      C("ac_r1", "Sin honorarios si no ganamos", "No fee unless we win"),
      C("ac_r2", "Evaluación gratis", "Free case review"),
      C("ac_r3", "Bilingüe", "Bilingual"),
      C("ac_r4", "Disponible 24/7", "24/7 availability"),
    ],
    [
      C("ac_q1", "Evaluación rápida", "Fast review"),
      C("ac_q2", "Equipo local", "Local team"),
    ],
    [C("cta_consulta", "Solicitar consulta", "Request consultation"), C("cta_caso", "Revisar mi caso", "Review my case")],
    [C("sec_llamar", "Llamada prioritaria", "Priority call")],
  ),
  preset(
    "abogado_familia",
    "legal",
    "Abogado de familia",
    "Family lawyer",
    [
      C("fa_div", "Divorcio", "Divorce"),
      C("fa_cust", "Custodia", "Custody"),
      C("fa_man", "Manutención", "Support"),
      C("fa_doc", "Documentos", "Documents"),
    ],
    [
      C("fa_r1", "Consulta confidencial", "Confidential consult"),
      C("fa_r2", "Mediación", "Mediation"),
      C("fa_r3", "Planes de pago", "Payment plans"),
    ],
    [
      C("fa_q1", "Citas con cita", "By appointment"),
      C("fa_q2", "Equipo compasivo", "Compassionate team"),
    ],
    [C("cta_consulta", "Solicitar consulta", "Request consultation")],
    [C("sec_mensaje", "Enviar mensaje", "Send message")],
  ),
  preset(
    "doctor",
    "health",
    "Doctor (medicina general)",
    "Doctor (general practice)",
    [
      C("doc_cons", "Consultas generales", "General visits"),
      C("doc_prev", "Prevención", "Prevention"),
      C("doc_ref", "Referencias", "Referrals"),
    ],
    [
      C("doc_r1", "Nuevos pacientes", "New patients"),
      C("doc_r2", "Acepta seguro", "Accepts insurance"),
      C("doc_r3", "Telemedicina", "Telemedicine"),
      C("doc_r4", "Personal bilingüe", "Bilingual staff"),
      C("doc_r5", "Citas el mismo día", "Same-day visits"),
    ],
    [
      C("doc_q1", "Citas el mismo día", "Same-day appointments"),
      C("doc_q2", "Acepta seguro", "Insurance accepted"),
      C("doc_q3", "Telemedicina", "Telemedicine"),
    ],
    [C("cta_reserva", "Reservar cita", "Book appointment"), C("cta_consulta", "Solicitar información", "Request info")],
    [C("sec_llamar", "Llamar clínica", "Call clinic")],
  ),
  preset(
    "dermatologo",
    "health",
    "Dermatólogo",
    "Dermatologist",
    [
      C("der_acne", "Tratamiento de acné", "Acne treatment"),
      C("der_exam", "Exámenes de piel", "Skin exams"),
      C("der_cos", "Dermatología cosmética", "Cosmetic dermatology"),
      C("der_botox", "Botox / rellenos", "Botox / fillers"),
      C("der_laser", "Tratamientos láser", "Laser treatments"),
    ],
    [
      C("der_r1", "Nuevos pacientes", "New patients"),
      C("der_r2", "Tecnología actualizada", "Modern technology"),
      C("der_r3", "Planes de pago", "Payment options"),
    ],
    [
      C("der_q1", "Citas disponibles", "Appointments available"),
      C("der_q2", "Acepta seguro", "Insurance"),
    ],
    [C("cta_reserva", "Reservar cita", "Book appointment")],
    [C("sec_mensaje", "Mensaje seguro", "Secure message")],
  ),
  preset(
    "dentista",
    "health",
    "Dentista",
    "Dentist",
    [
      C("den_limp", "Limpieza", "Cleaning"),
      C("den_blan", "Blanqueamiento", "Whitening"),
      C("den_orto", "Ortodoncia", "Orthodontics"),
      C("den_urg", "Urgencias dentales", "Dental emergencies"),
    ],
    [
      C("den_r1", "Nuevos pacientes", "New patients"),
      C("den_r2", "Financiamiento", "Financing"),
      C("den_r3", "Ambiente familiar", "Family-friendly"),
    ],
    [
      C("den_q1", "Mismo día para urgencias", "Same-day emergencies"),
      C("den_q2", "Seguros principales", "Major insurances"),
    ],
    [C("cta_reserva", "Reservar cita", "Book appointment")],
    [C("sec_llamar", "Llamar", "Call")],
  ),
  preset(
    "quiropractico",
    "health",
    "Quiropráctico",
    "Chiropractor",
    [
      C("qui_aj", "Ajustes", "Adjustments"),
      C("qui_dol", "Dolor de espalda/cuello", "Back/neck pain"),
      C("qui_acc", "Accidentes", "Accident care"),
    ],
    [
      C("qui_r1", "Primera visita promoción", "New patient special"),
      C("qui_r2", "Planes de cuidado", "Care plans"),
    ],
    [
      C("qui_q1", "Citas flexibles", "Flexible hours"),
    ],
    [C("cta_reserva", "Reservar cita", "Book appointment")],
    [C("sec_mensaje", "Mensaje", "Message")],
  ),
  preset(
    "salon_belleza",
    "beauty",
    "Salón de belleza",
    "Hair salon",
    [
      C("sa_corte", "Corte y peinado", "Cut & style"),
      C("sa_color", "Color", "Color"),
      C("sa_trat", "Tratamientos", "Treatments"),
      C("sa_ext", "Extensiones", "Extensions"),
    ],
    [
      C("sa_r1", "Citas disponibles", "Appointments available"),
      C("sa_r2", "Productos premium", "Premium products"),
      C("sa_r3", "Bilingüe", "Bilingual"),
      C("sa_r4", "Técnicos certificados", "Certified stylists"),
      C("sa_r5", "Ambiente familiar", "Family-friendly"),
    ],
    [
      C("sa_q1", "Reserva en línea", "Online booking"),
      C("sa_q2", "Horarios extendidos", "Extended hours"),
    ],
    [C("cta_reserva", "Reservar ahora", "Book now"), C("cta_cotiz", "Consultar servicio", "Ask about services")],
    [C("sec_whatsapp", "WhatsApp", "WhatsApp")],
  ),
  preset(
    "barberia",
    "beauty",
    "Barbería",
    "Barbershop",
    [
      C("ba_corte", "Corte clásico", "Classic cut"),
      C("ba_barba", "Barba", "Beard"),
      C("ba_afeit", "Afeitado", "Shave"),
    ],
    [
      C("ba_r1", "Walk-ins bienvenidos", "Walk-ins welcome"),
      C("ba_r2", "Citas", "Appointments"),
    ],
    [
      C("ba_q1", "Sin espera larga", "Short waits"),
    ],
    [C("cta_reserva", "Reservar cita", "Book"), C("cta_walk", "Soy walk-in", "Walk-in")],
    [C("sec_llamar", "Llamar", "Call")],
  ),
  preset(
    "spa",
    "beauty",
    "Spa",
    "Spa",
    [
      C("sp_mas", "Masajes", "Massage"),
      C("sp_facial", "Faciales", "Facials"),
      C("sp_paq", "Paquetes", "Packages"),
    ],
    [
      C("sp_r1", "Ambiente tranquilo", "Relaxing setting"),
      C("sp_r2", "Productos de calidad", "Quality products"),
    ],
    [
      C("sp_q1", "Reserva recomendada", "Reservations recommended"),
    ],
    [C("cta_reserva", "Reservar spa", "Book spa")],
    [C("sec_mensaje", "Mensaje", "Message")],
  ),
  preset(
    "auto_repair",
    "automotive",
    "Taller mecánico",
    "Auto repair",
    [
      C("au_frenos", "Frenos", "Brakes"),
      C("au_alin", "Alineación", "Alignment"),
      C("au_aceite", "Cambio de aceite", "Oil change"),
      C("au_diag", "Diagnóstico", "Diagnostics"),
      C("au_susp", "Suspensión", "Suspension"),
    ],
    [
      C("au_r1", "Técnicos ASE", "ASE technicians"),
      C("au_r2", "Garantía en repuestos", "Parts warranty"),
      C("au_r3", "Estimados claros", "Clear estimates"),
    ],
    [
      C("au_q1", "Mismo día", "Same-day service"),
      C("au_q2", "Uber/loaner (si aplica)", "Loaner / shuttle (if available)"),
    ],
    [C("cta_cotiz", "Solicitar cotización", "Request quote"), C("cta_reserva", "Agendar servicio", "Schedule service")],
    [C("sec_llamar", "Llamar", "Call")],
  ),
  preset(
    "tire_shop",
    "automotive",
    "Llantas / Tire shop",
    "Tire shop",
    [
      C("ti_cam", "Cambio de llantas", "Tire replacement"),
      C("ti_bal", "Balanceo", "Balancing"),
      C("ti_rot", "Rotación", "Rotation"),
      C("ti_rep", "Reparación", "Repair"),
    ],
    [
      C("ti_r1", "Inventario amplio", "Large inventory"),
      C("ti_r2", "Precios competitivos", "Competitive pricing"),
    ],
    [
      C("ti_q1", "Servicio rápido", "Fast service"),
    ],
    [C("cta_cotiz", "Cotizar llantas", "Get tire quote")],
    [C("sec_whatsapp", "WhatsApp", "WhatsApp")],
  ),
  preset(
    "car_wash",
    "automotive",
    "Lavado de autos",
    "Car wash",
    [
      C("cw_bas", "Lavado básico", "Basic wash"),
      C("cw_det", "Detallado completo", "Full detail"),
      C("cw_int", "Interior", "Interior"),
    ],
    [
      C("cw_r1", "Tiempos rápidos", "Fast turnaround"),
      C("cw_r2", "Productos premium", "Premium products"),
    ],
    [
      C("cw_q1", "Sin cita (si aplica)", "No appointment needed"),
    ],
    [C("cta_reserva", "Reservar detallado", "Book detail"), C("cta_walk", "Visitar ahora", "Visit now")],
    [],
  ),
  preset(
    "auto_detailing",
    "automotive",
    "Auto detailing",
    "Auto detailing",
    [
      C("det_ext", "Exterior", "Exterior"),
      C("det_int", "Interior profundo", "Deep interior"),
      C("det_cer", "Cerámica / protección", "Ceramic / protection"),
    ],
    [
      C("det_r1", "Acabado showroom", "Showroom finish"),
      C("det_r2", "Citas por horas", "Hour appointments"),
    ],
    [
      C("det_q1", "Paquetes claros", "Clear packages"),
    ],
    [C("cta_reserva", "Reservar paquete", "Book package")],
    [C("sec_mensaje", "Mensaje", "Message")],
  ),
  preset(
    "tutor",
    "education",
    "Tutor / educación",
    "Tutor / education",
    [
      C("tu_mat", "Matemáticas", "Math"),
      C("tu_ing", "Inglés / lectura", "English / reading"),
      C("tu_ex", "Preparación exámenes", "Test prep"),
    ],
    [
      C("tu_r1", "Planes flexibles", "Flexible plans"),
      C("tu_r2", "En línea o presencial", "Online or in-person"),
    ],
    [
      C("tu_q1", "Horarios tarde/finde", "Evening/weekend"),
    ],
    [C("cta_consulta", "Solicitar información", "Request info"), C("cta_reserva", "Agendar clase", "Schedule session")],
    [C("sec_mensaje", "Mensaje", "Message")],
  ),
  preset(
    "pet_groomer",
    "pets",
    "Pet groomer",
    "Pet groomer",
    [
      C("pg_bano", "Baño y corte", "Bath & cut"),
      C("pg_uñas", "Uñas", "Nails"),
      C("pg_dientes", "Higiene dental ligera", "Dental hygiene"),
    ],
    [
      C("pg_r1", "Manejo suave", "Gentle handling"),
      C("pg_r2", "Citas el mismo día (si hay)", "Same-day if open"),
    ],
    [
      C("pg_q1", "Amantes de mascotas", "Pet lovers"),
    ],
    [C("cta_reserva", "Reservar cita", "Book appointment")],
    [C("sec_llamar", "Llamar", "Call")],
  ),
  preset(
    "movers",
    "moving",
    "Mudanzas",
    "Movers",
    [
      C("mv_local", "Mudanza local", "Local move"),
      C("mv_largo", "Larga distancia", "Long distance"),
      C("mv_emp", "Empaque", "Packing"),
    ],
    [
      C("mv_r1", "Seguro de carga", "Cargo protection"),
      C("mv_r2", "Equipo profesional", "Pro crew"),
    ],
    [
      C("mv_q1", "Estimados en sitio o virtual", "On-site or virtual estimates"),
    ],
    [C("cta_cotiz", "Solicitar cotización", "Request quote")],
    [C("sec_whatsapp", "WhatsApp", "WhatsApp")],
  ),
  preset(
    "cleaning",
    "cleaning",
    "Limpieza",
    "Cleaning service",
    [
      C("cl_res", "Residencial", "Residential"),
      C("cl_com", "Comercial ligero", "Light commercial"),
      C("cl_prof", "Limpieza profunda", "Deep clean"),
    ],
    [
      C("cl_r1", "Personal confiable", "Trusted staff"),
      C("cl_r2", "Productos seguros", "Safe products"),
    ],
    [
      C("cl_q1", "Horarios flexibles", "Flexible scheduling"),
    ],
    [C("cta_cotiz", "Solicitar cotización", "Request quote")],
    [C("sec_mensaje", "Mensaje", "Message")],
  ),
];

export function getBusinessTypePreset(id: string): BusinessTypePreset | undefined {
  return BUSINESS_TYPE_PRESETS.find((p) => p.id === id);
}

export function chipLabel(chip: ChipDef, lang: "es" | "en"): string {
  return lang === "en" ? chip.en : chip.es;
}
