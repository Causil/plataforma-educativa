/**
 * Actualización de dominio (mastery) estilo Elo.
 *
 * Modelo: el dominio m ∈ [0,1] se mueve según la sorpresa del resultado.
 * expected(m, d) es la probabilidad esperada de acierto dado el dominio
 * actual y la dificultad del ejercicio (1..5). Acertar algo difícil sube
 * mucho; fallar algo fácil baja mucho. Determinista y sin IA generativa.
 */
import type { MasteryUpdate } from './types';

/** Factor de aprendizaje: cuánto se mueve el dominio por respuesta. */
export const K = 0.16;

/** Dificultad mínima y máxima de un ejercicio. */
export const MIN_DIFFICULTY = 1;
export const MAX_DIFFICULTY = 5;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Probabilidad esperada de acierto (curva logística).
 * La dificultad se normaliza a [0.1, 0.9] para compararla con el dominio.
 */
export function expectedScore(mastery: number, difficulty: number): number {
  const d = clamp(difficulty, MIN_DIFFICULTY, MAX_DIFFICULTY);
  const target = (d - 0.5) / MAX_DIFFICULTY; // 1→0.1 … 5→0.9
  return 1 / (1 + Math.pow(10, (target - mastery) * 2));
}

/** Aplica una respuesta y devuelve el dominio actualizado, acotado a [0,1]. */
export function updateMastery(
  mastery: number,
  difficulty: number,
  correct: boolean,
): MasteryUpdate {
  const before = clamp(mastery, 0, 1);
  const expected = expectedScore(before, difficulty);
  const after = clamp(before + K * ((correct ? 1 : 0) - expected), 0, 1);
  return { before, after, delta: after - before };
}
