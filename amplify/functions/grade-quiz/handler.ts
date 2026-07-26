/**
 * grade-quiz handler (T-801)
 *
 * Flujo:
 * 1. Recibe { activityId, answers: [{exerciseId, optionIndex}] } del estudiante autenticado.
 * 2. Carga cada Exercise desde DynamoDB para obtener answerIndex.
 * 3. Calcula la nota con la rubrica:
 *    - concepto (60%): (correctas / total) * 60
 *    - consistencia (40%): (mejor_racha / total) * 40
 *    - total = Math.round(concepto + consistencia)
 * 4. Crea un registro Submission con activityId, studentId, answers, score, rubricScores.
 * 5. Devuelve { score, rubricScores, correct, total }.
 */
import type { Schema } from '../../data/resource';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/grade-quiz';

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

interface AnswerInput {
  exerciseId: string;
  optionIndex: number;
}

interface AppSyncEvent {
  identity?: {
    sub?: string;
    username?: string;
    claims?: Record<string, unknown>;
  };
  arguments: {
    activityId?: string;
    answers?: string;
  };
}

export const handler = async (event: AppSyncEvent) => {
  const userId = event.identity?.sub ?? event.identity?.username;
  if (!userId) {
    return { error: 'No autenticado.' };
  }

  const { activityId, answers: answersRaw } = event.arguments;
  if (!activityId) {
    return { error: 'Se requiere activityId.' };
  }
  if (!answersRaw) {
    return { error: 'Se requiere answers.' };
  }

  let answers: AnswerInput[];
  try {
    answers = typeof answersRaw === 'string' ? JSON.parse(answersRaw) : answersRaw;
  } catch {
    return { error: 'answers debe ser un JSON valido.' };
  }

  if (!Array.isArray(answers) || answers.length === 0) {
    return { error: 'answers debe ser un arreglo no vacio.' };
  }

  try {
    // 1. Cargar ejercicios y evaluar cada respuesta en orden
    const oks: boolean[] = [];
    let correctCount = 0;

    for (const ans of answers) {
      const { data: exercise } = await client.models.Exercise.get({ id: ans.exerciseId });
      if (!exercise) {
        return { error: `Ejercicio no encontrado: ${ans.exerciseId}` };
      }
      const isCorrect = ans.optionIndex === exercise.answerIndex;
      oks.push(isCorrect);
      if (isCorrect) correctCount++;
    }

    const total = answers.length;

    // 2. Calcular rubrica
    // concepto (60%): proporcion de respuestas correctas * 60
    const concepto = (correctCount / total) * 60;

    // consistencia (40%): mejor racha de aciertos consecutivos / total * 40
    let bestStreak = 0;
    let currentStreak = 0;
    for (const ok of oks) {
      currentStreak = ok ? currentStreak + 1 : 0;
      bestStreak = Math.max(bestStreak, currentStreak);
    }
    const consistencia = (bestStreak / total) * 40;

    const score = Math.round(concepto + consistencia);

    const rubricScores = [
      { criterion: 'Dominio del concepto', weight: 60, score: Math.round(concepto) },
      { criterion: 'Consistencia (aciertos seguidos)', weight: 40, score: Math.round(consistencia) },
    ];

    // 3. Crear registro Submission
    await client.models.Submission.create({
      activityId,
      studentId: userId,
      answers: JSON.stringify(answers),
      score,
      rubricScores: JSON.stringify(rubricScores),
      owner: userId,
    });

    // 4. Retornar resultado
    return {
      score,
      rubricScores,
      correct: correctCount,
      total,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno';
    return { error: message };
  }
};
