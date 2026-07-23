/** Motor adaptativo de GuIA — tipos compartidos. */

/** Estado de dominio de un estudiante en un subtema. */
export interface SubtopicState {
  /** Identificador del subtema (p. ej. "tc", "regresion"). */
  id: string;
  /** Dominio estimado en [0, 1]. */
  mastery: number;
  /** Fallos consecutivos en este subtema. */
  consecutiveFails: number;
}

/** Resultado de la selección del siguiente reto. */
export interface Selection {
  subtopicId: string;
  /** Dificultad sugerida, 1..5. */
  difficulty: number;
  /** Motivo legible (se muestra en la "Ruta adaptativa"). */
  reason: string;
}

/** Resultado de actualizar el dominio tras una respuesta. */
export interface MasteryUpdate {
  before: number;
  after: number;
  delta: number;
}
