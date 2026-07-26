/**
 * submit-answer handler (T-404b)
 *
 * Flujo:
 * 1. Recibe { exerciseId, optionIndex } del estudiante autenticado.
 * 2. Carga el Exercise (con answerIndex) desde DynamoDB.
 * 3. Compara optionIndex vs answerIndex → ok/fail.
 * 4. Llama updateMastery() del engine.
 * 5. Escribe/actualiza MasteryState del subtema.
 * 6. Escribe RouteLog.
 * 7. Actualiza GameState (doble upsert: scope='global' Y scope=courseId).
 * 8. Devuelve { ok, before, after, xp, streak, level, hint, explanation }.
 */
import type { Schema } from '../../data/resource';
import { updateMastery } from '../../../src/engine/mastery';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/submit-answer';

// Patrón canónico Gen2 "function calling data": trae la model introspection
// (sin esto, client.models queda undefined — fix de review #2).
const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

/** Las escrituras del data client NO lanzan: devuelven {data, errors}. Fallar fuerte. */
const must = <T>(res: { data: T | null; errors?: { message: string }[] }, what: string): T => {
  if (res.errors?.length) {
    console.error(`${what} FALLÓ:`, JSON.stringify(res.errors));
    throw new Error(`${what}: ${res.errors.map((e) => e.message).join('; ')}`);
  }
  if (res.data === null || res.data === undefined) {
    throw new Error(`${what}: sin datos en la respuesta`);
  }
  return res.data;
};

/** XP por respuesta correcta (base) y bonus por racha. */
const XP_CORRECT = 10;
const XP_STREAK_BONUS = 5;

/** Calcula nivel a partir del XP total (cada 100 XP = 1 nivel). */
function levelFromXp(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

interface AppSyncEvent {
  identity?: {
    sub?: string;
    username?: string;
    claims?: Record<string, unknown>;
  };
  arguments: {
    exerciseId?: string;
    optionIndex?: number;
  };
}

export const handler = async (event: AppSyncEvent) => {
  const userId = event.identity?.sub ?? event.identity?.username;
  if (!userId) {
    return { error: 'No autenticado.' };
  }

  const { exerciseId, optionIndex } = event.arguments;
  if (!exerciseId || optionIndex === undefined || optionIndex === null) {
    return { error: 'Se requiere exerciseId y optionIndex.' };
  }

  try {
    // 1. Cargar el ejercicio (con answerIndex — la function tiene permisos de resource)
    const { data: exercise } = await client.models.Exercise.get({ id: exerciseId });
    if (!exercise) {
      return { error: 'Ejercicio no encontrado.' };
    }

    const answerIndex = exercise.answerIndex;
    if (answerIndex === null || answerIndex === undefined) {
      return { error: 'Ejercicio sin respuesta configurada.' };
    }

    // 2. Evaluar respuesta
    const ok = optionIndex === answerIndex;

    // 3. Buscar MasteryState existente del usuario para este subtema
    const { data: existingMastery } = await client.models.MasteryState.list({
      filter: {
        owner: { eq: userId },
        subtopicId: { eq: exercise.subtopicId },
      },
    });

    let currentMastery = 0;
    let currentStreak = 0;
    let currentConsecutiveFails = 0;
    let masteryId: string | undefined;

    if (existingMastery && existingMastery.length > 0) {
      const ms = existingMastery[0];
      currentMastery = ms.mastery;
      currentStreak = ms.streak ?? 0;
      currentConsecutiveFails = ms.consecutiveFails ?? 0;
      masteryId = ms.id;
    }

    // Recalcular con el mastery real
    const realResult = updateMastery(currentMastery, exercise.difficulty, ok);
    const newStreak = ok ? currentStreak + 1 : 0;
    const newConsecutiveFails = ok ? 0 : currentConsecutiveFails + 1;

    // 4. Escribir/actualizar MasteryState
    if (masteryId) {
      must(
        await client.models.MasteryState.update({
          id: masteryId,
          mastery: realResult.after,
          streak: newStreak,
          consecutiveFails: newConsecutiveFails,
          attempts: (existingMastery![0].attempts ?? 0) + 1,
        }),
        'MasteryState.update',
      );
    } else {
      must(
        await client.models.MasteryState.create({
          studentId: userId,
          subtopicId: exercise.subtopicId,
          mastery: realResult.after,
          streak: newStreak,
          consecutiveFails: newConsecutiveFails,
          attempts: 1,
          owner: userId,
        }),
        'MasteryState.create',
      );
    }

    // 5. Escribir RouteLog
    // Contar pasos anteriores para determinar step
    const { data: prevLogs } = await client.models.RouteLog.list({
      filter: { owner: { eq: userId } },
      limit: 1000,
    });
    const step = (prevLogs?.length ?? 0) + 1;

    must(
      await client.models.RouteLog.create({
        studentId: userId,
        step,
        subtopicId: exercise.subtopicId,
        difficulty: exercise.difficulty,
        ok,
        masteryBefore: realResult.before,
        masteryAfter: realResult.after,
        reason: ok ? 'Respuesta correcta' : 'Respuesta incorrecta',
        owner: userId,
      }),
      'RouteLog.create',
    );

    // 6. Actualizar GameState (doble upsert: scope='global' Y scope=courseId)
    const xpGained = ok ? XP_CORRECT + (newStreak > 1 ? XP_STREAK_BONUS : 0) : 0;

    // Buscar el courseId del ejercicio a través del subtopic → unit → course
    const { data: subtopic } = await client.models.Subtopic.get({ id: exercise.subtopicId });
    let courseId: string | undefined;
    if (subtopic) {
      const { data: unit } = await client.models.Unit.get({ id: subtopic.unitId });
      if (unit) {
        courseId = unit.courseId;
      }
    }

    // Función auxiliar para upsert de GameState por scope
    const upsertGameState = async (scope: string) => {
      const { data: existingGS } = await client.models.GameState.list({
        filter: {
          owner: { eq: userId },
          scope: { eq: scope },
        },
      });

      if (existingGS && existingGS.length > 0) {
        const gs = existingGS[0];
        const newXp = (gs.xp ?? 0) + xpGained;
        const newGameStreak = ok ? (gs.streak ?? 0) + 1 : 0;
        must(
          await client.models.GameState.update({
            id: gs.id,
            xp: newXp,
            level: levelFromXp(newXp),
            streak: newGameStreak,
          }),
          'GameState.update',
        );
        return { xp: newXp, level: levelFromXp(newXp), streak: newGameStreak };
      } else {
        const newXp = xpGained;
        const newGameStreak = ok ? 1 : 0;
        must(
          await client.models.GameState.create({
            studentId: userId,
            scope,
            xp: newXp,
            level: levelFromXp(newXp),
            streak: newGameStreak,
            owner: userId,
          }),
          'GameState.create',
        );
        return { xp: newXp, level: levelFromXp(newXp), streak: newGameStreak };
      }
    };

    // Doble upsert
    const globalState = await upsertGameState('global');
    if (courseId) {
      await upsertGameState(courseId);
    }

    // 7. Responder con hint y explanation (solo tras responder)
    return {
      ok,
      before: realResult.before,
      after: realResult.after,
      xp: globalState.xp,
      streak: globalState.streak,
      level: globalState.level,
      hint: exercise.hint ?? null,
      explanation: exercise.explanation ?? null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno';
    return { error: message };
  }
};
