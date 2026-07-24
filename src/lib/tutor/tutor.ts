/**
 * Servicios del Tutor IA: pista, chat y explicación.
 * Con timeout + degradación elegante (R04 de requisitos: si la IA falla,
 * el estudiante NUNCA se queda sin ayuda) y caché de explicaciones.
 */
import { llm, modelFor } from './client';
import {
  buildChatPrompt,
  buildExplanationPrompt,
  buildHintPrompt,
  type BuiltPrompt,
  type TutorContext,
} from './prompts';

export interface TutorAnswer {
  text: string;
  /** 'ai' = respuesta del modelo · 'fallback' = respaldo local. */
  source: 'ai' | 'fallback';
}

const DEFAULT_TIMEOUT_MS = 8_000;

async function complete(
  tier: 'fast' | 'smart',
  prompt: BuiltPrompt,
  maxTokens: number,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<string | null> {
  try {
    const response = await llm().messages.create(
      {
        model: modelFor(tier),
        max_tokens: maxTokens,
        system: prompt.system,
        messages: [{ role: 'user', content: prompt.user }],
      },
      { timeout: timeoutMs },
    );
    const block = response.content.find((b) => b.type === 'text');
    return block && 'text' in block ? block.text : null;
  } catch {
    return null; // el que llama decide el fallback
  }
}

/** Pista socrática (Haiku). Fallback: la pista precargada del ejercicio. */
export async function getHint(
  ctx: TutorContext,
  exercisePrompt: string,
  studentAnswer: string,
  fallbackHint: string,
): Promise<TutorAnswer> {
  const text = await complete('fast', buildHintPrompt(ctx, exercisePrompt, studentAnswer), 200);
  return text ? { text, source: 'ai' } : { text: fallbackHint, source: 'fallback' };
}

/** Chat del tutor (Haiku). Fallback: explicación breve + referencia local. */
export async function chatTutor(ctx: TutorContext, question: string): Promise<TutorAnswer> {
  const text = await complete('fast', buildChatPrompt(ctx, question), 500);
  if (text) return { text, source: 'ai' };
  const ref = ctx.bookRefs[0];
  return {
    text: `Ahora mismo no puedo consultar al tutor, pero para "${ctx.subtopicName}" te recomiendo leer ${
      ref ? `${ref.title}, ${ref.chapter} (${ref.page})` : 'el material del curso'
    } y volver a intentarlo en un momento.`,
    source: 'fallback',
  };
}

/** Explicación paso a paso (Sonnet) con caché por ejercicio. */
const explanationCache = new Map<string, string>();

export async function getExplanation(
  ctx: TutorContext,
  exerciseId: string,
  exercisePrompt: string,
  correctAnswer: string,
  fallbackExplanation: string,
): Promise<TutorAnswer> {
  const hit = explanationCache.get(exerciseId);
  if (hit) return { text: hit, source: 'ai' };

  const text = await complete(
    'smart',
    buildExplanationPrompt(ctx, exercisePrompt, correctAnswer),
    900,
    12_000,
  );
  if (text) {
    explanationCache.set(exerciseId, text);
    return { text, source: 'ai' };
  }
  return { text: fallbackExplanation, source: 'fallback' };
}

/** Solo para tests. */
export function _clearExplanationCache(): void {
  explanationCache.clear();
}
