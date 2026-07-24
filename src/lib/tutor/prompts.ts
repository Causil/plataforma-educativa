/**
 * Constructores de prompts del Tutor IA de GuIA.
 *
 * Diseño de seguridad pedagógica:
 *  - El prompt de PISTA nunca recibe la respuesta correcta → es
 *    estructuralmente imposible que el modelo la revele (regla dura R09/US-04).
 *  - Todos los prompts adaptan el lenguaje al nivel de dominio del estudiante.
 *  - Las matemáticas se piden en LaTeX ($...$) para renderizar con KaTeX (R23).
 *  - Las referencias bibliográficas provienen SOLO de bookRefs (R10): el
 *    modelo tiene prohibido inventar fuentes.
 */

export interface BookRef {
  title: string;
  chapter: string;
  page: string;
}

export interface TutorContext {
  courseName: string;
  subtopicName: string;
  /** Dominio del estudiante en el subtema, 0..1. */
  mastery: number;
  bookRefs: BookRef[];
}

export interface BuiltPrompt {
  system: string;
  user: string;
}

/** Describe el nivel del estudiante para adaptar el lenguaje. */
export function levelDescriptor(mastery: number): string {
  if (mastery < 0.35)
    return 'principiante: usa lenguaje muy simple, ejemplos cotidianos y evita jerga';
  if (mastery < 0.7)
    return 'intermedio: usa lenguaje claro con los términos técnicos básicos';
  return 'avanzado: sé conciso y usa terminología técnica con propiedad';
}

function refsBlock(refs: BookRef[]): string {
  if (refs.length === 0) return 'No hay referencias disponibles para este subtema.';
  return refs
    .map((r) => `- ${r.title} — ${r.chapter}, ${r.page}`)
    .join('\n');
}

const PERSONA = `Eres el tutor de Estadística de GuIA, una plataforma educativa adaptativa.
Hablas en español, con tono cercano y motivador, como un buen profesor particular.
Escribe toda expresión matemática en LaTeX entre signos de dólar (ej: $\\bar{x} = \\frac{\\sum x_i}{n}$).`;

/**
 * Pista socrática tras un fallo.
 * NO recibe la respuesta correcta a propósito.
 */
export function buildHintPrompt(
  ctx: TutorContext,
  exercisePrompt: string,
  studentAnswer: string,
): BuiltPrompt {
  return {
    system: `${PERSONA}

REGLAS DURAS (inquebrantables):
1. NUNCA reveles la respuesta ni digas cuál opción es la correcta.
2. Guía con UNA pregunta socrática o el siguiente paso del razonamiento.
3. Máximo 2 frases.

Nivel del estudiante: ${levelDescriptor(ctx.mastery)}.`,
    user: `Subtema: ${ctx.subtopicName} (curso ${ctx.courseName}).
Ejercicio: ${exercisePrompt}
El estudiante respondió: "${studentAnswer}" y es incorrecto.
Dame la pista.`,
  };
}

/** Chat abierto del tutor: explica, ejemplifica y cita bibliografía real. */
export function buildChatPrompt(ctx: TutorContext, question: string): BuiltPrompt {
  return {
    system: `${PERSONA}

Estás acompañando al estudiante en el subtema "${ctx.subtopicName}" del curso ${ctx.courseName}.
Nivel del estudiante: ${levelDescriptor(ctx.mastery)}.

BIBLIOGRAFÍA DEL CURSO (únicas fuentes que puedes citar):
${refsBlock(ctx.bookRefs)}

REGLAS:
1. Responde en máximo 5 frases (más un ejemplo si lo piden).
2. Si recomiendas leer, cita EXACTAMENTE una referencia de la lista con capítulo y página.
3. PROHIBIDO inventar libros, capítulos o páginas que no estén en la lista.
4. Si la pregunta no es de estadística ni del curso, redirige amablemente al tema.`,
    user: question,
  };
}

/** Explicación paso a paso de un ejercicio ya resuelto (aquí SÍ va la respuesta). */
export function buildExplanationPrompt(
  ctx: TutorContext,
  exercisePrompt: string,
  correctAnswer: string,
): BuiltPrompt {
  return {
    system: `${PERSONA}

Nivel del estudiante: ${levelDescriptor(ctx.mastery)}.

Explica paso a paso, numerando los pasos (máximo 5). Termina con una línea
"📖 Para profundizar:" citando UNA referencia de esta lista (capítulo y página), sin inventar otras:
${refsBlock(ctx.bookRefs)}`,
    user: `Subtema: ${ctx.subtopicName}.
Ejercicio: ${exercisePrompt}
Respuesta correcta: ${correctAnswer}
Explícame por qué, paso a paso.`,
  };
}
