import type { BookRef } from '../lib/tutor/prompts';

export type Level = 'basico' | 'intermedio' | 'avanzado';

export interface Unit {
  id: string;
  order: number;
  title: string;
}

export interface Subtopic {
  id: string;
  unitId: string;
  name: string;
  short: string;
  /** Dominio inicial estimado (hasta que exista diagnóstico del usuario). */
  initialMastery: number;
  bookRefs: BookRef[];
}

export interface Exercise {
  id: string;
  subtopicId: string;
  level: Level;
  /** 1..5 */
  difficulty: number;
  /** Texto con matemáticas inline entre $...$ (KaTeX). */
  prompt: string;
  options: string[];
  answerIndex: number;
  hint: string;
  explanation: string;
}

export interface CourseSeed {
  code: string;
  name: string;
  institution: string;
  visibility: 'public' | 'private';
  credits: number;
  units: Unit[];
  subtopics: Subtopic[];
  exercises: Exercise[];
}

export function levelForDifficulty(d: number): Level {
  if (d <= 2) return 'basico';
  if (d === 3) return 'intermedio';
  return 'avanzado';
}

export const LEVEL_LABEL: Record<Level, string> = {
  basico: 'Básico',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
};
