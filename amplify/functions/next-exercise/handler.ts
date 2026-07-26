/**
 * next-exercise handler (T-404a)
 *
 * Flujo:
 * 1. Lee los MasteryState del estudiante caller (owner).
 * 2. Si no existen (primera vez), genera estados iniciales con mastery=0.
 * 3. Llama a selectNext() del engine para obtener el subtema+dificultad.
 * 4. Busca un ejercicio que coincida (subtopicId, difficulty ± 1).
 * 5. Devuelve el ejercicio SIN answerIndex + motivo.
 */
import type { Schema } from '../../data/resource';
import { selectNext } from '../../../src/engine/selector';
import type { SubtopicState } from '../../../src/engine/types';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/next-exercise';

// Patrón canónico Gen2 "function calling data": trae la model introspection
// (sin esto, client.models queda undefined — fix de review #2).
const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

/**
 * AppSync event shape for custom operations resolved by Lambda.
 */
interface AppSyncEvent {
  identity?: {
    sub?: string;
    username?: string;
    claims?: Record<string, unknown>;
  };
  arguments: Record<string, unknown>;
}

export const handler = async (event: AppSyncEvent) => {
  const userId = event.identity?.sub ?? event.identity?.username;
  if (!userId) {
    return { error: 'No autenticado.' };
  }

  try {
    // 1. Leer MasteryState del estudiante
    const { data: masteryList } = await client.models.MasteryState.list({
      filter: { owner: { eq: userId } },
    });

    // 2. Leer subtopics disponibles
    const { data: subtopics } = await client.models.Subtopic.list({ limit: 100 });

    if (!subtopics || subtopics.length === 0) {
      return { error: 'No hay subtemas configurados.' };
    }

    // 3. Construir SubtopicState[] para el engine
    const masteryMap = new Map<string, { mastery: number; consecutiveFails: number }>();
    for (const ms of masteryList ?? []) {
      masteryMap.set(ms.subtopicId, {
        mastery: ms.mastery,
        consecutiveFails: ms.consecutiveFails ?? 0,
      });
    }

    const states: SubtopicState[] = subtopics.map((st) => ({
      id: st.id,
      mastery: masteryMap.get(st.id)?.mastery ?? 0,
      consecutiveFails: masteryMap.get(st.id)?.consecutiveFails ?? 0,
    }));

    // 4. Selección del engine
    const selection = selectNext(states);

    // 5. Buscar ejercicio que coincida con subtopic + dificultad (±1)
    const { data: exercises } = await client.models.Exercise.list({
      filter: {
        subtopicId: { eq: selection.subtopicId },
      },
      limit: 50,
    });

    if (!exercises || exercises.length === 0) {
      return { error: 'No hay ejercicios para el subtema seleccionado.' };
    }

    // Preferir dificultad exacta, sino ±1
    let match = exercises.find((e) => e.difficulty === selection.difficulty);
    if (!match) {
      match = exercises.find(
        (e) => Math.abs(e.difficulty - selection.difficulty) <= 1,
      );
    }
    if (!match) {
      match = exercises[0]; // fallback: cualquiera del subtema
    }

    // 6. Devolver SIN answerIndex, hint, explanation
    return {
      exercise: {
        id: match.id,
        subtopicId: match.subtopicId,
        level: match.level,
        difficulty: match.difficulty,
        prompt: match.prompt,
        options: match.options,
      },
      reason: selection.reason,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno';
    return { error: message };
  }
};
