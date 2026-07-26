/**
 * Handler del Tutor IA — expone chat / pista / explicación vía AppSync.
 * Reutiliza la capa probada de src/lib/tutor (prompts con reglas duras,
 * timeout y fallback elegante). Sin acceso a datos: recibe el contexto
 * (subtema, dominio, bookRefs) desde el cliente.
 */
import { chatTutor, getExplanation, getHint } from '../../../src/lib/tutor/tutor';
import type { TutorContext } from '../../../src/lib/tutor/prompts';

interface AppSyncEvent {
  identity?: { sub?: string; username?: string };
  arguments: {
    kind?: 'chat' | 'hint' | 'explanation';
    payload?: string; // JSON: { ctx, question?, exercisePrompt?, studentAnswer?, fallbackHint?, exerciseId?, correctAnswer?, fallbackExplanation? }
  };
}

export const handler = async (event: AppSyncEvent) => {
  if (!event.identity?.sub && !event.identity?.username) {
    return { error: 'No autenticado.' };
  }
  const { kind, payload } = event.arguments;
  if (!kind || !payload) return { error: 'Se requiere kind y payload.' };

  let p: Record<string, unknown>;
  try {
    p = JSON.parse(payload);
  } catch {
    return { error: 'payload debe ser JSON válido.' };
  }
  const ctx = p.ctx as TutorContext | undefined;
  if (!ctx?.subtopicName) return { error: 'payload.ctx inválido.' };

  try {
    switch (kind) {
      case 'chat':
        return await chatTutor(ctx, String(p.question ?? ''));
      case 'hint':
        return await getHint(
          ctx,
          String(p.exercisePrompt ?? ''),
          String(p.studentAnswer ?? ''),
          String(p.fallbackHint ?? 'Revisa el concepto e inténtalo de nuevo.'),
        );
      case 'explanation':
        return await getExplanation(
          ctx,
          String(p.exerciseId ?? 'sin-id'),
          String(p.exercisePrompt ?? ''),
          String(p.correctAnswer ?? ''),
          String(p.fallbackExplanation ?? ''),
        );
      default:
        return { error: `kind desconocido: ${kind}` };
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error interno del tutor.' };
  }
};
