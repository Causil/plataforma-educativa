/**
 * Selección del siguiente reto (zona de desarrollo próximo).
 *
 * Reglas (spec US-03 / R06):
 *  - Se priorizan subtemas NO dominados (mastery < umbral 0.85).
 *  - Dentro de ellos, se prefiere la "zona de crecimiento" [0.2, 0.8]
 *    y se ataca el de MENOR dominio (mayor ganancia esperada).
 *  - Si todo está dominado, se entra en modo repaso (menor dominio global).
 *  - La dificultad propuesta es ≈ nivel actual + 1 (reto alcanzable).
 *  - Tras 3 fallos consecutivos en el subtema, la dificultad baja un punto
 *    (refuerzo) — nunca por debajo de 1.
 */
import { clamp, MAX_DIFFICULTY, MIN_DIFFICULTY } from './mastery';
import type { Selection, SubtopicState } from './types';

/** Un subtema con dominio ≥ umbral se considera dominado. */
export const MASTERY_THRESHOLD = 0.85;
/** Fallos consecutivos que activan la degradación de dificultad. */
export const FAIL_STREAK_LIMIT = 3;
/** Zona de crecimiento preferida. */
export const GROWTH_ZONE_MIN = 0.2;
export const GROWTH_ZONE_MAX = 0.8;

/** Dificultad objetivo para un dominio dado (reto alcanzable: nivel + 1). */
export function difficultyFor(mastery: number, consecutiveFails: number): number {
  let d = clamp(Math.round(mastery * MAX_DIFFICULTY) + 1, MIN_DIFFICULTY, MAX_DIFFICULTY);
  if (consecutiveFails >= FAIL_STREAK_LIMIT) {
    d = clamp(d - 1, MIN_DIFFICULTY, MAX_DIFFICULTY);
  }
  return d;
}

/** Motivo legible de la decisión (alimenta la "Ruta adaptativa"). */
function reasonFor(s: SubtopicState, reviewing: boolean): string {
  if (reviewing) return 'Todo dominado: repaso para mantener el nivel.';
  if (s.consecutiveFails >= FAIL_STREAK_LIMIT)
    return 'Varios fallos seguidos: bajo la dificultad y refuerzo la base.';
  if (s.mastery < 0.35) return 'Es donde más te cuesta: reforcemos con calma.';
  if (s.mastery < 0.7) return 'Aquí puedes crecer más ahora mismo.';
  return 'Casi lo dominas: un empujón más.';
}

/**
 * Elige el siguiente subtema + dificultad.
 * Determinista: ante empate de dominio, gana el primero en el orden dado
 * (que es el orden curricular de las unidades).
 */
export function selectNext(states: readonly SubtopicState[]): Selection {
  if (states.length === 0) {
    throw new Error('selectNext: se requiere al menos un subtema');
  }

  const notMastered = states.filter((s) => s.mastery < MASTERY_THRESHOLD);
  const reviewing = notMastered.length === 0;
  const candidates = reviewing ? [...states] : notMastered;

  const inZone = candidates.filter(
    (s) => s.mastery >= GROWTH_ZONE_MIN && s.mastery <= GROWTH_ZONE_MAX,
  );
  const pool = inZone.length > 0 ? inZone : candidates;

  let chosen = pool[0];
  for (const s of pool) {
    if (s.mastery < chosen.mastery) chosen = s;
  }

  return {
    subtopicId: chosen.id,
    difficulty: difficultyFor(chosen.mastery, chosen.consecutiveFails),
    reason: reasonFor(chosen, reviewing),
  };
}
