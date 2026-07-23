import { describe, expect, it } from 'vitest';
import { clamp, expectedScore, K, updateMastery } from './mastery';

describe('expectedScore', () => {
  it('a mayor dominio, mayor probabilidad esperada de acierto', () => {
    const d = 3;
    expect(expectedScore(0.8, d)).toBeGreaterThan(expectedScore(0.5, d));
    expect(expectedScore(0.5, d)).toBeGreaterThan(expectedScore(0.2, d));
  });

  it('a mayor dificultad, menor probabilidad esperada', () => {
    const m = 0.5;
    expect(expectedScore(m, 1)).toBeGreaterThan(expectedScore(m, 3));
    expect(expectedScore(m, 3)).toBeGreaterThan(expectedScore(m, 5));
  });

  it('devuelve probabilidades válidas (0,1)', () => {
    for (const m of [0, 0.25, 0.5, 0.75, 1]) {
      for (const d of [1, 2, 3, 4, 5]) {
        const e = expectedScore(m, d);
        expect(e).toBeGreaterThan(0);
        expect(e).toBeLessThan(1);
      }
    }
  });

  it('acota dificultades fuera de rango en lugar de romperse', () => {
    expect(expectedScore(0.5, 0)).toBe(expectedScore(0.5, 1));
    expect(expectedScore(0.5, 99)).toBe(expectedScore(0.5, 5));
  });
});

describe('updateMastery', () => {
  it('acertar sube el dominio; fallar lo baja', () => {
    const up = updateMastery(0.5, 3, true);
    const down = updateMastery(0.5, 3, false);
    expect(up.after).toBeGreaterThan(0.5);
    expect(down.after).toBeLessThan(0.5);
  });

  it('acertar algo difícil sube MÁS que acertar algo fácil', () => {
    const hard = updateMastery(0.5, 5, true);
    const easy = updateMastery(0.5, 1, true);
    expect(hard.delta).toBeGreaterThan(easy.delta);
  });

  it('fallar algo fácil baja MÁS que fallar algo difícil', () => {
    const easyFail = updateMastery(0.5, 1, false);
    const hardFail = updateMastery(0.5, 5, false);
    expect(easyFail.delta).toBeLessThan(hardFail.delta); // más negativo
  });

  it('nunca sale de [0, 1]', () => {
    expect(updateMastery(0.99, 1, true).after).toBeLessThanOrEqual(1);
    expect(updateMastery(0.01, 5, false).after).toBeGreaterThanOrEqual(0);
  });

  it('el movimiento por respuesta está acotado por K', () => {
    const r = updateMastery(0.5, 3, true);
    expect(Math.abs(r.delta)).toBeLessThanOrEqual(K);
  });

  it('normaliza entradas de dominio fuera de rango', () => {
    expect(updateMastery(1.5, 3, false).before).toBe(1);
    expect(updateMastery(-0.2, 3, true).before).toBe(0);
  });

  it('reporta before/after/delta coherentes', () => {
    const r = updateMastery(0.4, 2, true);
    expect(r.after - r.before).toBeCloseTo(r.delta, 10);
  });
});

describe('clamp', () => {
  it('acota por ambos lados', () => {
    expect(clamp(5, 0, 1)).toBe(1);
    expect(clamp(-5, 0, 1)).toBe(0);
    expect(clamp(0.5, 0, 1)).toBe(0.5);
  });
});
