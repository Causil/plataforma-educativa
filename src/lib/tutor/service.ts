/**
 * Capa del tutor SEGURA PARA NAVEGADOR.
 *
 * Llama a la Lambda `tutor` vía AppSync (query askTutor) — la autenticación
 * viaja con el token de Cognito y la API key del modelo vive como secreto de
 * la function (nunca en el navegador). Si algo falla, degrada elegantemente
 * al fallback local con la bibliografía del subtema.
 */
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import type { TutorAnswer } from './answer';
import type { TutorContext } from './prompts';

const client = generateClient<Schema>();
const parse = (raw: unknown) => (typeof raw === 'string' ? JSON.parse(raw) : raw);

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
  try {
    const q = await client.queries.askTutor({
      kind: 'chat',
      payload: JSON.stringify({ ctx, question }),
    });
    const r = parse(q.data) as { text?: string; source?: string; error?: string };
    if (r?.text) return { text: r.text, source: r.source === 'ai' ? 'ai' : 'fallback' };
    return chatFallback(ctx);
  } catch {
    return chatFallback(ctx);
  }
}
