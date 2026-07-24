/**
 * Capa del tutor SEGURA PARA NAVEGADOR (sin SDKs de Node).
 *
 * - En producción llama a la API (Lambda `chatTutor`, T-603) vía fetch.
 * - Sin API configurada (o si falla), degrada elegantemente al fallback local
 *   con la bibliografía del subtema — el estudiante nunca se queda sin ayuda.
 *
 * La capa Node (SDK Anthropic/Bedrock) vive en `tutor.ts` y solo la usan
 * las Lambdas y el laboratorio CLI.
 */
import type { TutorAnswer } from './answer';
import type { TutorContext } from './prompts';

const API_URL: string | undefined = import.meta.env?.VITE_TUTOR_API;

function chatFallback(ctx: TutorContext): TutorAnswer {
  const ref = ctx.bookRefs[0];
  return {
    text: `Ahora mismo no puedo consultar al tutor IA, pero para "${ctx.subtopicName}" te recomiendo leer ${
      ref ? `${ref.title}, ${ref.chapter} (${ref.page})` : 'el material del curso'
    } y volver a intentarlo en un momento.`,
    source: 'fallback',
  };
}

export async function chatTutor(ctx: TutorContext, question: string): Promise<TutorAnswer> {
  if (!API_URL) return chatFallback(ctx);
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'chat', ctx, question }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return chatFallback(ctx);
    const data = (await res.json()) as { text?: string };
    return data.text ? { text: data.text, source: 'ai' } : chatFallback(ctx);
  } catch {
    return chatFallback(ctx);
  }
}
