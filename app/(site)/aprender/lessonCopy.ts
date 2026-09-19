import type { Lang } from "./learningCopy";

/**
 * Learning Center — code-owned chrome for the canonical lesson renderer (Gate G2). Same
 * per-lang-object-literal convention as learningCopy.ts. Lesson CONTENT never lives here: it comes
 * from a LessonPackage (authored, or derived from the stored body by the legacy adapter).
 */
export type LessonCopy = {
  header: {
    home: string;
    lessonLabel: string;
    checkpointLabel: string;
    minutes: string;
    read: string;
    listen: string;
    activity: string;
    breadcrumbAria: string;
  };
  modes: { aria: string; read: string; listen: string; do: string; askAi: string };
  sections: {
    outcomes: string;
    explain: string;
    model: string;
    compare: string;
    activity: string;
    askAi: string;
    mistakes: string;
    mistakeLabel: string;
    insteadLabel: string;
    glossary: string;
    glossaryTitle: string;
    glossaryLink: string;
    checklist: string;
    resources: string;
    resourcesTitle: string;
    verify: string;
    proHelp: string;
    proHelpTitle: string;
    proHelpCanTeach: string;
    proHelpMustVerify: string;
    proHelpPrepare: string;
    proHelpQuestions: string;
    recap: string;
    recapTitle: string;
    steps: string;
    note: string;
    diagramDescription: string;
    weakMark: string;
    strongMark: string;
  };
  activity: {
    statementLabel: string;
    statementHint: string;
    progress: string;
    /** Generic guided activities: "3 de 8" / "3 of 8". */
    progressOf: string;
    copy: string;
    copied: string;
    clear: string;
    savedLocal: string;
  };
  prompt: {
    neutral: string;
    version: string;
    fieldsTitle: string;
    promptLabel: string;
    copy: string;
    copied: string;
    missing: string;
    why: string;
    customize: string;
    followUps: string;
    copyFollowUp: string;
    copiedShort: string;
    privacy: string;
    verify: string;
    contextTitle: string;
    answersIncluded: string;
    editAnswers: string;
    purpose: string;
    startHere: string;
    moreTemplates: string;
    reminder: string;
  };
  audio: {
    title: string;
    intro: string;
    previewBadge: string;
    previewBody: string;
    transcript: string;
    speed: string;
    chapters: string;
    pause: string;
    drivingNote: string;
  };
  completion: {
    eyebrow: string;
    title: string;
    readyTitle: string;
    readyBody: string;
    pendingTitle: string;
    pendingActivity: string;
    pendingChecklist: string;
    localNote: string;
    accountTitle: string;
    essentialFormat: string;
  };
  print: { button: string; hint: string; sheetEyebrow: string; sheetTitle: string; statement: string; checklist: string; prompt: string; footer: string };
  next: { eyebrow: string; title: string; cta: string; backToPath: string; choosePath: string; noNext: string };
};

const LESSON_ES: LessonCopy = {
  header: {
    home: "Centro de Aprendizaje",
    lessonLabel: "Lección",
    checkpointLabel: "Punto",
    minutes: "min",
    read: "de lectura",
    listen: "para escuchar",
    activity: "de actividad",
    breadcrumbAria: "Ubicación de la lección",
  },
  modes: { aria: "Formas de tomar esta lección", read: "Leer", listen: "Escuchar", do: "Hacer", askAi: "Preguntar a IA" },
  sections: {
    outcomes: "Lo que vas a aprender",
    explain: "La idea",
    model: "Míralo así",
    compare: "Compara",
    activity: "Tu turno",
    askAi: "Pregúntale a tu IA",
    mistakes: "Error común",
    mistakeLabel: "El error",
    insteadLabel: "Mejor así",
    glossary: "Palabras clave",
    glossaryTitle: "Términos de esta lección",
    glossaryLink: "Ver el glosario completo",
    checklist: "Lista de comprobación",
    resources: "Para poner en práctica",
    resourcesTitle: "Listas y plantillas de esta lección",
    verify: "Verifica",
    proHelp: "Ayuda profesional",
    proHelpTitle: "Cuándo buscar ayuda profesional",
    proHelpCanTeach: "Lo que Leonix puede enseñarte",
    proHelpMustVerify: "Lo que debes verificar",
    proHelpPrepare: "Cómo prepararte",
    proHelpQuestions: "Preguntas para llevar",
    recap: "En resumen",
    recapTitle: "Tres ideas para llevarte",
    steps: "Hazlo paso a paso",
    note: "Un dato importante",
    diagramDescription: "Descripción del diagrama",
    weakMark: "No ayuda",
    strongMark: "Sí ayuda",
  },
  activity: {
    statementLabel: "Tu frase",
    statementHint: "Se arma solo con lo que tú escribes.",
    progress: "respuestas de 5",
    progressOf: "de",
    copy: "Copiar mi frase",
    copied: "Frase copiada",
    clear: "Borrar mis respuestas",
    savedLocal: "Tus respuestas se guardan solo en este dispositivo. Nada se envía a Leonix ni a ninguna IA.",
  },
  prompt: {
    neutral: "Funciona con el asistente de IA que tú prefieras. Cópiala y pégala ahí.",
    version: "versión",
    fieldsTitle: "Completa antes de copiar",
    promptLabel: "Tu conversación lista para copiar",
    copy: "Copiar conversación",
    copied: "Copiada. Pégala en tu asistente de IA y sigue la conversación.",
    missing: "Todavía hay espacios entre corchetes. Puedes llenarlos aquí o directamente en tu asistente.",
    why: "Por qué funciona",
    customize: "Personalízalo",
    followUps: "Sigue preguntando",
    copyFollowUp: "Copiar",
    copiedShort: "Copiada",
    privacy: "Privacidad",
    verify: "Verifica",
    contextTitle: "Tu contexto",
    answersIncluded: "respuestas de “Tu turno” ya incluidas en estas conversaciones.",
    editAnswers: "Editar mis respuestas",
    purpose: "Para qué sirve",
    startHere: "Empieza aquí",
    moreTemplates: "Más conversaciones para seguir",
    reminder: "Antes de pegar: quita datos personales de tus clientes. Después: comprueba lo importante con personas reales.",
  },
  audio: {
    title: "Escucha esta lección",
    intro: "Una clase hablada, pensada para escuchar mientras haces otra cosa. No es la lectura de esta página.",
    previewBadge: "Vista previa del guion",
    previewBody: "El audio de esta lección todavía no está grabado, así que no hay nada que reproducir. Este es el guion de enseñanza con el que se grabará.",
    transcript: "Transcripción",
    speed: "Velocidad",
    chapters: "Capítulos",
    pause: "Pausa para pensar",
    drivingNote: "Si vas manejando, solo escucha. Los ejercicios son para cuando estés estacionado o en casa.",
  },
  completion: {
    eyebrow: "Cierre",
    title: "Cierra la lección",
    readyTitle: "Lección lista",
    readyBody: "Hiciste tu parte en “Tu turno” y confirmaste tu lista. El siguiente paso es comprobarlo con personas reales.",
    pendingTitle: "Te falta poco",
    pendingActivity: "Completa “Tu turno”.",
    pendingChecklist: "Marca los puntos de tu lista de comprobación.",
    localNote: "Este avance vive solo en este dispositivo.",
    accountTitle: "Guardar en tu cuenta",
    essentialFormat: "Formato esencial: esta lección todavía no incluye ejemplo, actividad, audio ni pregunta para IA.",
  },
  print: {
    button: "Imprimir mi hoja",
    hint: "Solo tu hoja: tu resultado, tu lista y tu conversación principal para la IA. También puedes guardarla como PDF desde la ventana de impresión.",
    sheetEyebrow: "Centro de Aprendizaje Leonix",
    sheetTitle: "Mi hoja",
    statement: "Mi frase",
    checklist: "Mi lista de comprobación",
    prompt: "Mi conversación para la IA",
    footer: "La IA ayuda. Tú verificas. Habla con 3 personas reales antes de cambiar tu negocio.",
  },
  next: {
    eyebrow: "Lo que sigue",
    title: "Siguiente lección",
    cta: "Continuar",
    backToPath: "Volver a mi ruta",
    choosePath: "Elegir mi ruta",
    noNext: "Ya recorriste las lecciones disponibles de esta ruta. Vuelve a tu ruta para ver los siguientes puntos.",
  },
};

const LESSON_EN: LessonCopy = {
  header: {
    home: "Learning Center",
    lessonLabel: "Lesson",
    checkpointLabel: "Checkpoint",
    minutes: "min",
    read: "read",
    listen: "listen",
    activity: "activity",
    breadcrumbAria: "Lesson location",
  },
  modes: { aria: "Ways to take this lesson", read: "Read", listen: "Listen", do: "Do", askAi: "Ask AI" },
  sections: {
    outcomes: "What you'll learn",
    explain: "The idea",
    model: "Picture it",
    compare: "Compare",
    activity: "Your turn",
    askAi: "Ask your AI",
    mistakes: "Common mistake",
    mistakeLabel: "The mistake",
    insteadLabel: "Do this instead",
    glossary: "Key words",
    glossaryTitle: "Terms in this lesson",
    glossaryLink: "See the full glossary",
    checklist: "Checklist",
    resources: "Put it into practice",
    resourcesTitle: "Checklists and templates for this lesson",
    verify: "Verify",
    proHelp: "Professional help",
    proHelpTitle: "When to get professional help",
    proHelpCanTeach: "What Leonix can teach you",
    proHelpMustVerify: "What you must verify",
    proHelpPrepare: "How to prepare",
    proHelpQuestions: "Questions to bring",
    recap: "In short",
    recapTitle: "Three ideas to take with you",
    steps: "Do it step by step",
    note: "An important note",
    diagramDescription: "Diagram description",
    weakMark: "Does not help",
    strongMark: "Helps",
  },
  activity: {
    statementLabel: "Your sentence",
    statementHint: "It is built only from what you type.",
    progress: "of 5 answers",
    progressOf: "of",
    copy: "Copy my sentence",
    copied: "Sentence copied",
    clear: "Clear my answers",
    savedLocal: "Your answers are saved only on this device. Nothing is sent to Leonix or to any AI.",
  },
  prompt: {
    neutral: "It works with whichever AI assistant you prefer. Copy it and paste it there.",
    version: "version",
    fieldsTitle: "Fill in before copying",
    promptLabel: "Your conversation, ready to copy",
    copy: "Copy conversation",
    copied: "Copied. Paste it into your AI assistant and keep the conversation going.",
    missing: "There are still blanks in brackets. You can fill them in here or directly in your assistant.",
    why: "Why it works",
    customize: "Make it yours",
    followUps: "Keep asking",
    copyFollowUp: "Copy",
    copiedShort: "Copied",
    privacy: "Privacy",
    verify: "Verify",
    contextTitle: "Your context",
    answersIncluded: "answers from “Your turn” already included in these conversations.",
    editAnswers: "Edit my answers",
    purpose: "What this helps with",
    startHere: "Start here",
    moreTemplates: "More conversations to continue",
    reminder: "Before you paste: remove your customers' personal details. Afterwards: check what matters with real people.",
  },
  audio: {
    title: "Listen to this lesson",
    intro: "A spoken class, made for listening while you do something else. It is not a reading of this page.",
    previewBadge: "Script preview",
    previewBody: "The audio for this lesson has not been recorded yet, so there is nothing to play. This is the teaching script it will be recorded from.",
    transcript: "Transcript",
    speed: "Speed",
    chapters: "Chapters",
    pause: "Pause to think",
    drivingNote: "If you are driving, just listen. The exercises are for when you are parked or at home.",
  },
  completion: {
    eyebrow: "Wrap-up",
    title: "Close the lesson",
    readyTitle: "Lesson ready",
    readyBody: "You did your part in “Your turn” and confirmed your checklist. The next step is to check it with real people.",
    pendingTitle: "Almost there",
    pendingActivity: "Finish “Your turn.”",
    pendingChecklist: "Tick the items on your checklist.",
    localNote: "This progress lives only on this device.",
    accountTitle: "Save to your account",
    essentialFormat: "Essential format: this lesson does not include an example, activity, audio, or AI question yet.",
  },
  print: {
    button: "Print my sheet",
    hint: "Just your sheet: your result, your checklist, and your main AI conversation. You can also save it as a PDF from the print window.",
    sheetEyebrow: "Leonix Learning Center",
    sheetTitle: "My sheet",
    statement: "My sentence",
    checklist: "My checklist",
    prompt: "My conversation for the AI",
    footer: "AI helps. You verify. Talk with 3 real people before you change your business.",
  },
  next: {
    eyebrow: "What comes next",
    title: "Next lesson",
    cta: "Continue",
    backToPath: "Back to my path",
    choosePath: "Choose my path",
    noNext: "You have gone through the lessons available on this path. Go back to your path to see the next checkpoints.",
  },
};

export function lessonCopy(lang: Lang): LessonCopy {
  return lang === "es" ? LESSON_ES : LESSON_EN;
}
