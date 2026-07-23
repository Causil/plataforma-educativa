import { describe, expect, it } from 'vitest';
import {
  difficultyFor,
  FAIL_STREAK_LIMIT,
  MASTERY_THRESHOLD,
  selectNext,
} from './selector';
import type { SubtopicState } from './types';

const s = (id: string, mastery: number, consecutiveFails = 0): SubtopicState => ({
  id,
  mastery,
  consecutiveFails,
});

describe('selectNext', () => {
  it('elige el subtema de MENOR dominio dentro de la zona de crecimiento', () => {
    const sel = selectNext([s('a', 0.7), s('b', 0.3), s('c', 0.5)]);
    expect(sel.subtopicId).toBe('b');
  });

  it('ignora subtemas ya dominados (≥ umbral)', () => {
    const sel = selectNext([s('dominado', 0.9), s('pendiente', 0.6)]);
    expect(sel.subtopicId).toBe('pendiente');
  });

  it('si nadie está en la zona [0.2, 0.8], igual elige el de menor dominio', () => {
    const sel = selectNext([s('muyBajo', 0.05), s('casiListo', 0.84)]);
    expect(sel.subtopicId).toBe('muyBajo');
  });

  it('todo dominado ⇒ modo repaso (elige el menor y lo explica)', () => {
    const sel = selectNext([s('a', 0.9), s('b', 0.86)]);
    expect(sel.subtopicId).toBe('b');
    expect(sel.reason).toMatch(/repaso/i);
  });

  it('es determinista ante empate (gana el orden curricular)', () => {
    const states = [s('primero', 0.4), s('segundo', 0.4)];
    expect(selectNext(states).subtopicId).toBe('primero');
    expect(selectNext(states).subtopicId).toBe('primero');
  });

  it('siempre da un motivo legible', () => {
    for (const m of [0.1, 0.5, 0.75]) {
      expect(selectNext([s('x', m)]).reason.length).toBeGreaterThan(10);
    }
  });

  it('lanza error con lista vacía', () => {
    expect(() => selectNext([])).toThrow();
  });

  it('no muta el arreglo de entrada', () => {
    const states = [s('a', 0.9), s('b', 0.3)];
    const copy = JSON.parse(JSON.stringify(states));
    selectNext(states);
    expect(states).toEqual(copy);
  });
});

describe('difficultyFor', () => {
  it('propone reto alcanzable (≈ nivel + 1) y respeta los límites 1..5', () => {
    expect(difficultyFor(0, 0)).toBe(1);
    expect(difficultyFor(0.5, 0)).toBe(4); // round(2.5)=3 → +1
    expect(difficultyFor(1, 0)).toBe(5); // tope superior
  });

  it(`degrada un punto tras ${FAIL_STREAK_LIMIT} fallos consecutivos`, () => {
    const normal = difficultyFor(0.5, 0);
    const degraded = difficultyFor(0.5, FAIL_STREAK_LIMIT);
    expect(degraded).toBe(normal - 1);
  });

  it('la degradación nunca baja de 1', () => {
    expect(difficultyFor(0, FAIL_STREAK_LIMIT)).toBe(1);
  });
});

describe('integración: umbral de dominio', () => {
  it(`un subtema cruza el umbral ${MASTERY_THRESHOLD} y deja de ser priorizado`, () => {
    // ping-pong: 'a' está a punto de dominarse, 'b' está a la mitad
    const states = [s('a', 0.84), s('b', 0.5)];
    expect(selectNext(states).subtopicId).toBe('b'); // b tiene menor dominio

    // b se domina; a sigue pendiente
    const states2 = [s('a', 0.84), s('b', 0.86)];
    expect(selectNext(states2).subtopicId).toBe('a');
  });
});
