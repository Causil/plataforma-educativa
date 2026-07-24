import { describe, expect, it } from 'vitest';
import {
  buildChatPrompt,
  buildExplanationPrompt,
  buildHintPrompt,
  levelDescriptor,
  type TutorContext,
} from './prompts';

const ctx: TutorContext = {
  courseName: 'Estadística CBS00074',
  subtopicName: 'Tendencia central',
  mastery: 0.5,
  bookRefs: [
    { title: 'Devore (2015)', chapter: 'Cap. 1 · Medidas de localización', page: 'pág. 28' },
  ],
};

describe('buildHintPrompt — seguridad pedagógica', () => {
  const CORRECT = 'La mediana es 3';
  const prompt = buildHintPrompt(ctx, 'Datos: 2,3,3,8,9. ¿Mediana?', 'La mediana es 5');

  it('NUNCA incluye la respuesta correcta (imposible filtrarla)', () => {
    expect(prompt.system).not.toContain(CORRECT);
    expect(prompt.user).not.toContain(CORRECT);
  });

  it('incluye la regla dura de no revelar la respuesta', () => {
    expect(prompt.system).toMatch(/NUNCA reveles la respuesta/i);
  });

  it('limita la extensión (máx 2 frases)', () => {
    expect(prompt.system).toMatch(/2 frases/);
  });

  it('lleva el intento del estudiante para contextualizar', () => {
    expect(prompt.user).toContain('La mediana es 5');
  });
});

describe('buildChatPrompt — anclaje bibliográfico', () => {
  const prompt = buildChatPrompt(ctx, '¿Qué es la mediana?');

  it('incluye la bibliografía real con capítulo y página', () => {
    expect(prompt.system).toContain('Devore (2015)');
    expect(prompt.system).toContain('pág. 28');
  });

  it('prohíbe inventar fuentes', () => {
    expect(prompt.system).toMatch(/PROHIBIDO inventar/i);
  });

  it('pide LaTeX para las fórmulas (KaTeX en el frontend)', () => {
    expect(prompt.system).toMatch(/LaTeX/);
  });

  it('maneja subtemas sin referencias sin romperse', () => {
    const p = buildChatPrompt({ ...ctx, bookRefs: [] }, 'hola');
    expect(p.system).toMatch(/No hay referencias/);
  });
});

describe('buildExplanationPrompt', () => {
  const prompt = buildExplanationPrompt(ctx, 'Media de 4,6,11', '7');

  it('aquí SÍ incluye la respuesta correcta (es post-resolución)', () => {
    expect(prompt.user).toContain('7');
  });

  it('pide pasos numerados y cierre con referencia', () => {
    expect(prompt.system).toMatch(/paso a paso/i);
    expect(prompt.system).toMatch(/Para profundizar/);
  });
});

describe('levelDescriptor — adaptación al estudiante', () => {
  it('cambia el registro según el dominio', () => {
    expect(levelDescriptor(0.1)).toMatch(/principiante/);
    expect(levelDescriptor(0.5)).toMatch(/intermedio/);
    expect(levelDescriptor(0.9)).toMatch(/avanzado/);
  });

  it('los tres descriptores son distintos', () => {
    const set = new Set([levelDescriptor(0.1), levelDescriptor(0.5), levelDescriptor(0.9)]);
    expect(set.size).toBe(3);
  });
});
