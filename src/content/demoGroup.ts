/**
 * Grupo demo para el panel docente (datos INVENTADOS — sin PII real).
 * Dominio por subtema en el orden de SUBTOPICS:
 * [vars, tablas, tc, disp, regresion, prob, dist, muestreo]
 */
export interface DemoStudent {
  name: string;
  mastery: number[]; // 0..100
}

export const DEMO_GROUP: DemoStudent[] = [
  { name: 'Sofía Ramírez', mastery: [72, 60, 55, 30, 18, 45, 25, 20] },
  { name: 'Mateo López', mastery: [90, 82, 85, 60, 50, 72, 55, 48] },
  { name: 'Valentina Gómez', mastery: [55, 44, 40, 20, 12, 35, 22, 15] },
  { name: 'Diego Peña', mastery: [72, 65, 68, 45, 32, 60, 38, 30] },
  { name: 'Camila Torres', mastery: [95, 90, 92, 80, 72, 88, 75, 70] },
  { name: 'Juan Díaz', mastery: [32, 28, 25, 15, 8, 28, 12, 10] },
  { name: 'Lucía Marín', mastery: [78, 70, 74, 58, 45, 65, 50, 42] },
  { name: 'Andrés Vega', mastery: [60, 50, 52, 30, 22, 45, 28, 22] },
  { name: 'Paula Ríos', mastery: [48, 40, 38, 22, 14, 30, 18, 14] },
  { name: 'Tomás Cano', mastery: [84, 78, 80, 66, 55, 70, 58, 52] },
];

export const DEMO_USAGE = [
  { name: 'Sofía Ramírez', last: 'Hoy 9:14', freq: '5×/sem', dur: '32 min', route: 'Curso → Práctica → Tutor' },
  { name: 'Mateo López', last: 'Ayer 20:02', freq: '3×/sem', dur: '21 min', route: 'Diagnóstico → Práctica' },
  { name: 'Juan Díaz', last: 'Hace 6 días', freq: '0.5×/sem', dur: '8 min', route: 'Curso → salió', risk: true },
];
